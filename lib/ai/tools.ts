import { tool } from "ai";
import { z } from "zod";

import { ProcessedCalendarEventSchema } from "@/server/api/routers/schema";
import { api } from "@/trpc/server";

type ProcessedCalendarEvent = z.infer<typeof ProcessedCalendarEventSchema>;

export const getEvents = tool({
  description:
    "Retrieve calendar events within a date and optionally time range",
  parameters: z.object({
    end: z
      .string()
      .describe(
        "End date in ISO 8601 format (YYYY-MM-DD). If endTime is also provided, this should be the full ISO 8601 date-time string.",
      ),
    endTime: z
      .string()
      .optional()
      .describe(
        "Optional end time in ISO 8601 format (THH:mm:ssZ). If not provided, defaults to end of the day.",
      ),
    includeAllDay: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Whether to include all-day events in the results. Defaults to true (all-day events are included).",
      ),
    start: z
      .string()
      .describe(
        "Start date in ISO 8601 format (YYYY-MM-DD). If startTime is also provided, this should be the full ISO 8601 date-time string.",
      ),
    startTime: z
      .string()
      .optional()
      .describe(
        "Optional start time in ISO 8601 format (THH:mm:ssZ). If not provided, defaults to start of the day.",
      ),
  }),
  execute: async ({ end, endTime, includeAllDay, start, startTime }) => {
    try {
      const fullStart = startTime
        ? `${start.split("T")[0]}${startTime}`
        : `${start.split("T")[0]}T00:00:00Z`;
      const fullEnd = endTime
        ? `${end.split("T")[0]}${endTime}`
        : `${end.split("T")[0]}T23:59:59Z`;

      const events = await api.calendar.getEvents({
        includeAllDay: includeAllDay,
        timeMax: fullEnd,
        timeMin: fullStart,
      });

      return {
        events: events.map((event: ProcessedCalendarEvent) => ({
          id: event.id,
          allDay: event.allDay,
          calendarId: event.calendarId,
          color: event.color,
          description: event.description,
          end: event.end,
          location: event.location,
          start: event.start,
          title: event.title,
        })),
      };
    } catch (error) {
      console.error("Error fetching events:", error);
      return { error: "Failed to fetch calendar events", events: [] };
    }
  },
});

export const getNextUpcomingEvent = tool({
  description:
    "Retrieves the very next upcoming event from all calendars from the current time. Tells you if the event is ongoing, starting soon, or upcoming.",
  parameters: z.object({}),
  execute: async () => {
    try {
      const now = new Date();
      const timeMin = now.toISOString();

      const timeMaxDate = new Date(now);
      timeMaxDate.setDate(now.getDate() + 7);
      const timeMax = timeMaxDate.toISOString();

      const eventsResponse = await api.calendar.getEvents({
        includeAllDay: false,
        maxResults: 10,
        timeMax,
        timeMin,
      });

      if (!eventsResponse || eventsResponse.length === 0) {
        return {
          message: "No upcoming non-all-day events found in the next 7 days.",
        };
      }

      const sortedEvents = eventsResponse.sort((a, b) => {
        const startA = new Date(a.start).getTime();
        const startB = new Date(b.start).getTime();
        return startA - startB;
      });

      const nextEvent = sortedEvents[0];
      if (!nextEvent) {
        return {
          message: "No upcoming non-all-day events found in the next 7 days.",
        };
      }

      const eventStart = new Date(nextEvent.start);
      const eventEnd = new Date(nextEvent.end);
      let status = "upcoming";
      const minutesToStart =
        (eventStart.getTime() - now.getTime()) / (1000 * 60);

      if (now >= eventStart && now <= eventEnd) {
        status = "ongoing";
      } else if (minutesToStart > 0 && minutesToStart <= 30) {
        status = "starting_soon";
      }

      return {
        event: {
          id: nextEvent.id,
          allDay: nextEvent.allDay,
          calendarId: nextEvent.calendarId,
          color: nextEvent.color,
          description: nextEvent.description,
          end: nextEvent.end.toISOString(),
          location: nextEvent.location,
          start: nextEvent.start.toISOString(),
          title: nextEvent.title,
        },
        minutesToStart:
          minutesToStart > 0 ? Math.round(minutesToStart) : undefined,
        status,
      };
    } catch (error) {
      console.error("Error fetching next upcoming event:", error);
      return { error: "Failed to fetch the next upcoming event." };
    }
  },
});
