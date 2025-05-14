import { z } from "zod";

import {
  type GoogleEvent,
  createHeaders,
  createRequestOptions,
  executeRequest,
  getGoogleAccount,
  prepareEventData,
  processEventData,
} from "@/lib/calendar";
import { GOOGLE_CALENDAR_LIST_API_URL } from "@/lib/constants";
import {
  CalendarListResponseSchema,
  ProcessedCalendarEventSchema,
  ProcessedCalendarListEntrySchema,
} from "@/server/api/routers/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const calendarRouter = createTRPCRouter({
  createEvent: protectedProcedure
    .input(
      z.object({
        calendarId: z.string(),
        event: z.object({
          allDay: z.boolean().optional(),
          color: z.string().optional(),
          description: z.string().optional(),
          end: z.date(),
          location: z.string().optional(),
          start: z.date(),
          title: z.string(),
        }),
      }),
    )
    .output(ProcessedCalendarEventSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await getGoogleAccount(ctx.db, ctx.session.user.id);

      if (!account.accessToken) throw new Error("No access token found");

      const headers = createHeaders(account.accessToken);
      headers.append("Content-Type", "application/json");

      // Prepare event data
      const eventData = prepareEventData({
        allDay: input.event.allDay,
        color: input.event.color,
        description: input.event.description,
        end: input.event.end,
        location: input.event.location,
        start: input.event.start,
        title: input.event.title,
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events`;
      const options = createRequestOptions(
        headers,
        "POST",
        JSON.stringify(eventData),
      );

      try {
        const response = await executeRequest(
          url,
          options,
          account,
          ctx.session.user.id,
        );

        const item = await response.json();
        return processEventData(item, input.calendarId);
      } catch (error) {
        console.error("Error creating event:", error);
        throw error;
      }
    }),

  deleteEvent: protectedProcedure
    .input(
      z.object({
        calendarId: z.string(),
        eventId: z.string(),
      }),
    )
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      const account = await getGoogleAccount(ctx.db, ctx.session.user.id);

      if (!account.accessToken) throw new Error("No access token found");

      const headers = createHeaders(account.accessToken);
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
      const options = createRequestOptions(headers, "DELETE");

      try {
        await executeRequest(url, options, account, ctx.session.user.id);
        // For successful DELETE operations, Google Calendar API returns an empty response
        // with 204 No Content status
        return true;
      } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
      }
    }),

  getCalendars: protectedProcedure
    .output(z.array(ProcessedCalendarListEntrySchema))
    .query(async ({ ctx }) => {
      const account = await getGoogleAccount(ctx.db, ctx.session.user.id);

      if (!account.accessToken) throw new Error("No access token found");

      const headers = createHeaders(account.accessToken);
      const options = createRequestOptions(headers);

      try {
        const response = await executeRequest(
          GOOGLE_CALENDAR_LIST_API_URL,
          options,
          account,
          ctx.session.user.id,
        );

        const data = await response.json();
        const parsedData = CalendarListResponseSchema.parse(data);

        const processedItems = parsedData.items.map((item) => {
          const isEmailSummary = z
            .string()
            .email()
            .safeParse(item.summary).success;
          const isUserPrimaryCalendar =
            isEmailSummary && item.summary === ctx.session.user.email;
          const displaySummary = isUserPrimaryCalendar
            ? (ctx.session.user.name ?? item.summary ?? "")
            : (item.summary ?? "");

          return {
            id: item.id,
            accessRole: item.accessRole,
            backgroundColor: item.backgroundColor,
            foregroundColor: item.foregroundColor,
            primary: item.primary,
            summary: displaySummary,
          };
        });

        // Sort calendars - primary calendar first, then alphabetically
        processedItems.sort((a, b) => {
          if (a.primary && !b.primary) {
            return -1;
          }
          if (!a.primary && b.primary) {
            return 1;
          }
          return a.summary.localeCompare(b.summary);
        });

        return processedItems;
      } catch (error) {
        console.error("Error fetching or parsing calendar list:", error);
        throw error;
      }
    }),
  getEvent: protectedProcedure
    .input(
      z.object({
        calendarId: z.string(),
        eventId: z.string(),
      }),
    )
    .output(ProcessedCalendarEventSchema)
    .query(async ({ ctx, input }) => {
      const account = await getGoogleAccount(ctx.db, ctx.session.user.id);

      if (!account.accessToken) throw new Error("No access token found");

      const headers = createHeaders(account.accessToken);
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
      const options = createRequestOptions(headers);

      try {
        const response = await executeRequest(
          url,
          options,
          account,
          ctx.session.user.id,
        );

        const item = await response.json();
        return processEventData(item, input.calendarId);
      } catch (error) {
        console.error("Error fetching event:", error);
        throw error;
      }
    }),

  getEvents: protectedProcedure
    .input(
      z
        .object({
          calendarIds: z.array(z.string()).optional(),
          timeMax: z.string().optional(),
          timeMin: z.string().optional(),
        })
        .optional(),
    )
    .output(z.array(ProcessedCalendarEventSchema))
    .query(async ({ ctx, input }) => {
      const account = await getGoogleAccount(ctx.db, ctx.session.user.id);

      if (!account.accessToken) throw new Error("No access token found");

      const headers = createHeaders(account.accessToken);
      const options = createRequestOptions(headers);

      try {
        // First, fetch all available calendars
        const calListResponse = await executeRequest(
          GOOGLE_CALENDAR_LIST_API_URL,
          options,
          account,
          ctx.session.user.id,
        );

        const calListData = await calListResponse.json();
        const parsedCalList = CalendarListResponseSchema.parse(calListData);

        // Determine which calendars to fetch events from
        let calendarsToFetch = parsedCalList.items.map((item) => ({
          id: item.id,
          backgroundColor: item.backgroundColor,
        }));

        // Filter by calendars specified in input, if any
        if (input?.calendarIds?.length) {
          calendarsToFetch = calendarsToFetch.filter((c) =>
            input.calendarIds!.includes(c.id),
          );
        }

        // Determine time range
        const now = new Date();
        const defaultTimeMin = new Date(now.getFullYear(), now.getMonth(), 1); // first day of current month
        const defaultTimeMax = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
        );

        const timeMinISO = input?.timeMin ?? defaultTimeMin.toISOString();
        const timeMaxISO = input?.timeMax ?? defaultTimeMax.toISOString();

        const fetchPromises = calendarsToFetch.map(async (calendar) => {
          const params = new URLSearchParams({
            maxResults: "2500",
            orderBy: "startTime",
            singleEvents: "true",
            timeMax: timeMaxISO,
            timeMin: timeMinISO,
          });

          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?${params.toString()}`;

          try {
            const response = await executeRequest(
              url,
              options,
              account,
              ctx.session.user.id,
            );

            const evData = await response.json();
            const items = (evData.items ?? []) as GoogleEvent[];

            return items
              .filter((item) => {
                const startStr = item.start?.dateTime ?? item.start?.date;
                const endStr = item.end?.dateTime ?? item.end?.date;
                return !!startStr && !!endStr;
              })
              .map((item) => processEventData(item, calendar.id));
          } catch (fetchError) {
            console.error(
              `Error fetching events for calendar ${calendar.id}:`,
              fetchError,
            );
            return [];
          }
        });

        const results = await Promise.all(fetchPromises);

        return results.flat();
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
      }
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        calendarId: z.string(),
        event: z.object({
          allDay: z.boolean().optional(),
          color: z.string().optional(),
          description: z.string().optional(),
          end: z.date().optional(),
          location: z.string().optional(),
          start: z.date().optional(),
          title: z.string().optional(),
        }),
        eventId: z.string(),
      }),
    )
    .output(ProcessedCalendarEventSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await getGoogleAccount(ctx.db, ctx.session.user.id);

      if (!account.accessToken) throw new Error("No access token found");

      const headers = createHeaders(account.accessToken);
      headers.append("Content-Type", "application/json");

      // First fetch the current event to update
      const getUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
      const getOptions = createRequestOptions(headers);

      try {
        // Get the current event
        const getResponse = await executeRequest(
          getUrl,
          getOptions,
          account,
          ctx.session.user.id,
        );

        const currentEvent = await getResponse.json();

        // Prepare event data using our helper function
        const eventData = prepareEventData(
          {
            allDay: input.event.allDay,
            color: input.event.color,
            description: input.event.description,
            end: input.event.end,
            location: input.event.location,
            start: input.event.start,
            title: input.event.title,
          },
          currentEvent,
        );

        // Update the event
        const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
        const updateOptions = createRequestOptions(
          headers,
          "PUT",
          JSON.stringify(eventData),
        );

        const updateResponse = await executeRequest(
          updateUrl,
          updateOptions,
          account,
          ctx.session.user.id,
        );

        const item = await updateResponse.json();
        return processEventData(item, input.calendarId);
      } catch (error) {
        console.error("Error updating event:", error);
        throw error;
      }
    }),
});
