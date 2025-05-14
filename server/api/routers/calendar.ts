import { z } from "zod";

import {
  GOOGLE_CALENDAR_COLORS,
  GOOGLE_CALENDAR_LIST_API_URL,
} from "@/lib/constants";
import {
  CalendarListResponseSchema,
  ProcessedCalendarEventSchema,
  ProcessedCalendarListEntrySchema,
} from "@/server/api/routers/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { authInstance } from "@/server/auth";

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
      const account = await ctx.db.account.findFirst({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
        where: {
          providerId: "google",
          userId: ctx.session.user.id,
        },
      });

      if (!account?.accessToken) {
        throw new Error("No access token found");
      }

      let accessToken = account.accessToken;
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${accessToken}`);
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");

      const eventData: Record<string, any> = {
        description: input.event.description,
        location: input.event.location,
        summary: input.event.title,
      };

      if (input.event.allDay) {
        const startDate = input.event.start.toISOString().split("T")[0];
        const endDate = input.event.end.toISOString().split("T")[0];
        eventData.start = { date: startDate };
        eventData.end = { date: endDate };
      } else {
        eventData.start = { dateTime: input.event.start.toISOString() };
        eventData.end = { dateTime: input.event.end.toISOString() };
      }

      if (input.event.color) {
        for (const [colorId, colorInfo] of Object.entries(
          GOOGLE_CALENDAR_COLORS,
        )) {
          if (colorInfo.color === input.event.color) {
            eventData.colorId = colorId;
            break;
          }
        }
      }

      const requestOptions: RequestInit = {
        body: JSON.stringify(eventData),
        headers,
        method: "POST",
        mode: "cors",
      };

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events`;

      try {
        let response = await fetch(url, requestOptions);

        if (response.status === 401 && account.refreshToken) {
          console.log("Access token expired, refreshing via Better Auth...");

          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);

            response = await fetch(url, {
              ...requestOptions,
              headers,
            });
          }
        }

        if (!response.ok) {
          const error = await response.text();
          console.error("Error creating event:", error);
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          );
        }

        const item = await response.json();

        const isAllDay = !!item.start?.date;
        const startStr = (item.start?.dateTime ?? item.start?.date) as
          | string
          | undefined;
        const endStr = (item.end?.dateTime ?? item.end?.date) as
          | string
          | undefined;

        if (!startStr || !endStr) {
          throw new Error(
            "Event is missing required start/end time information",
          );
        }

        let eventColor = undefined;
        const colorId = item.colorId as string | undefined;
        if (colorId && GOOGLE_CALENDAR_COLORS[colorId]) {
          eventColor = GOOGLE_CALENDAR_COLORS[colorId].color;
        }

        return {
          id: item.id,
          allDay: isAllDay,
          calendarId: input.calendarId,
          color: eventColor || "blue",
          description: item.description ?? undefined,
          end: new Date(endStr),
          location: item.location ?? undefined,
          start: new Date(startStr),
          title: item.summary ?? "(No title)",
        };
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
      const account = await ctx.db.account.findFirst({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
        where: {
          providerId: "google",
          userId: ctx.session.user.id,
        },
      });

      if (!account?.accessToken) {
        throw new Error("No access token found");
      }

      let accessToken = account.accessToken;
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${accessToken}`);
      headers.append("Accept", "application/json");

      const requestOptions: RequestInit = {
        headers,
        method: "DELETE",
        mode: "cors",
      };

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;

      try {
        let response = await fetch(url, requestOptions);

        // Handle token refresh if needed
        if (response.status === 401 && account.refreshToken) {
          console.log("Access token expired, refreshing via Better Auth...");

          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);

            response = await fetch(url, {
              ...requestOptions,
              headers,
            });
          }
        }

        if (!response.ok) {
          const error = await response.text();
          console.error("Error deleting event:", error);
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          );
        }

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
      const account = await ctx.db.account.findFirst({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
        where: {
          providerId: "google",
          userId: ctx.session.user.id,
        },
      });

      if (!account?.accessToken) {
        throw new Error("No access token found");
      }

      let accessToken = account.accessToken;
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${accessToken}`);
      headers.append("Accept", "application/json");

      const requestOptions = {
        cache: "no-cache" as RequestCache,
        headers: headers,
        method: "GET",
        mode: "cors" as RequestMode,
      };

      try {
        let response = await fetch(
          GOOGLE_CALENDAR_LIST_API_URL,
          requestOptions,
        );

        if (response.status === 401 && account.refreshToken) {
          console.log("Access token expired, refreshing via Better Auth...");

          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);

            response = await fetch(GOOGLE_CALENDAR_LIST_API_URL, {
              ...requestOptions,
              headers,
            });
          }
        }

        if (!response.ok) {
          const error = await response.json();
          console.error("Error fetching calendar list:", error);
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          );
        }

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
      const account = await ctx.db.account.findFirst({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
        where: {
          providerId: "google",
          userId: ctx.session.user.id,
        },
      });

      if (!account?.accessToken) {
        throw new Error("No access token found");
      }

      let accessToken = account.accessToken;
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${accessToken}`);
      headers.append("Accept", "application/json");

      const requestOptions: RequestInit = {
        cache: "no-cache",
        headers,
        method: "GET",
        mode: "cors",
      };

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;

      try {
        let response = await fetch(url, requestOptions);

        if (response.status === 401 && account.refreshToken) {
          console.log("Access token expired, refreshing via Better Auth...");

          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);

            response = await fetch(url, {
              ...requestOptions,
              headers,
            });
          }
        }

        if (!response.ok) {
          const error = await response.text();
          console.error("Error fetching event:", error);
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`,
          );
        }

        const item = await response.json();

        const isAllDay = !!item.start?.date;
        const startStr = (item.start?.dateTime ?? item.start?.date) as
          | string
          | undefined;
        const endStr = (item.end?.dateTime ?? item.end?.date) as
          | string
          | undefined;

        if (!startStr || !endStr) {
          throw new Error(
            "Event is missing required start/end time information",
          );
        }

        let eventColor = undefined;
        const colorId = item.colorId as string | undefined;
        if (colorId && GOOGLE_CALENDAR_COLORS[colorId]) {
          eventColor = GOOGLE_CALENDAR_COLORS[colorId].color;
        }

        return {
          id: item.id,
          allDay: isAllDay,
          calendarId: input.calendarId,
          color: eventColor || "blue",
          description: item.description ?? undefined,
          end: new Date(endStr),
          location: item.location ?? undefined,
          start: new Date(startStr),
          title: item.summary ?? "(No title)",
        };
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
      const account = await ctx.db.account.findFirst({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
        where: {
          providerId: "google",
          userId: ctx.session.user.id,
        },
      });

      if (!account?.accessToken) {
        throw new Error("No access token found");
      }

      let accessToken = account.accessToken;

      const headers = new Headers();
      headers.append("Authorization", `Bearer ${accessToken}`);
      headers.append("Accept", "application/json");

      const requestOptions: RequestInit = {
        cache: "no-cache",
        headers,
        method: "GET",
        mode: "cors",
      };

      let calendarsToFetch: { id: string; backgroundColor?: string }[] = [];

      try {
        let calListResponse = await fetch(
          GOOGLE_CALENDAR_LIST_API_URL,
          requestOptions,
        );

        if (calListResponse.status === 401 && account.refreshToken) {
          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);
            calListResponse = await fetch(GOOGLE_CALENDAR_LIST_API_URL, {
              ...requestOptions,
              headers,
            });
          }
        }

        if (!calListResponse.ok) {
          const error = await calListResponse.json();
          console.error("Error fetching calendar list:", error);
          throw new Error(
            `HTTP error! status: ${calListResponse.status} - ${calListResponse.statusText}`,
          );
        }

        const calListData = await calListResponse.json();
        const parsedCalList = CalendarListResponseSchema.parse(calListData);

        calendarsToFetch = parsedCalList.items.map((item) => ({
          id: item.id,
          backgroundColor: item.backgroundColor,
        }));

        if (input?.calendarIds?.length) {
          calendarsToFetch = calendarsToFetch.filter((c) =>
            input.calendarIds!.includes(c.id),
          );
        }

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

          let currentAccessToken = accessToken;
          const currentHeaders = new Headers(headers);

          try {
            let evResponse = await fetch(url, {
              ...requestOptions,
              headers: currentHeaders,
            });

            if (evResponse.status === 401 && account.refreshToken) {
              console.log(
                `Token expired for calendar ${calendar.id}, attempting refresh...`,
              );
              const refreshedAccount = await authInstance.api.refreshToken({
                body: {
                  accountId: account.id,
                  providerId: "google",
                  userId: ctx.session.user.id,
                },
              });

              if (refreshedAccount?.accessToken) {
                currentAccessToken = refreshedAccount.accessToken;
                accessToken = currentAccessToken;
                currentHeaders.set(
                  "Authorization",
                  `Bearer ${currentAccessToken}`,
                );

                evResponse = await fetch(url, {
                  ...requestOptions,
                  headers: currentHeaders,
                });
              } else {
                console.error(
                  `Failed to refresh token for calendar ${calendar.id}`,
                );
                return [];
              }
            }

            if (!evResponse.ok) {
              const error = await evResponse.text();
              console.error(
                `Error fetching events for calendar ${calendar.id}: ${evResponse.status} - ${evResponse.statusText}, Body: ${error}`,
              );
              return [];
            }

            const evData = await evResponse.json();
            const items = (evData.items ?? []) as any[];
            const calendarEvents: Array<
              z.infer<typeof ProcessedCalendarEventSchema>
            > = [];

            for (const item of items) {
              const isAllDay = !!item.start?.date;
              const startStr = (item.start?.dateTime ?? item.start?.date) as
                | string
                | undefined;
              const endStr = (item.end?.dateTime ?? item.end?.date) as
                | string
                | undefined;

              if (!startStr || !endStr) continue;

              let eventColor = undefined;
              const colorId = item.colorId as string | undefined;
              if (colorId && GOOGLE_CALENDAR_COLORS[colorId]) {
                eventColor = GOOGLE_CALENDAR_COLORS[colorId].color;
              }

              calendarEvents.push({
                id: item.id,
                allDay: isAllDay,
                calendarId: calendar.id,
                color: eventColor || "blue",
                description: item.description ?? undefined,
                end: new Date(endStr),
                location: item.location ?? undefined,
                start: new Date(startStr),
                title: item.summary ?? "(No title)",
              });
            }
            return calendarEvents;
          } catch (fetchError) {
            console.error(
              `Unexpected error fetching events for calendar ${calendar.id}:`,
              fetchError,
            );
            return [];
          }
        });

        const results = await Promise.all(fetchPromises);

        const events = results.flat();

        return events;
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
      const account = await ctx.db.account.findFirst({
        select: {
          id: true,
          accessToken: true,
          refreshToken: true,
        },
        where: {
          providerId: "google",
          userId: ctx.session.user.id,
        },
      });

      if (!account?.accessToken) {
        throw new Error("No access token found");
      }

      let accessToken = account.accessToken;
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${accessToken}`);
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");

      // First fetch the current event to update
      const getUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
      const getOptions: RequestInit = {
        headers,
        method: "GET",
        mode: "cors",
      };

      try {
        let getResponse = await fetch(getUrl, getOptions);

        // Handle token refresh if needed
        if (getResponse.status === 401 && account.refreshToken) {
          console.log("Access token expired, refreshing via Better Auth...");

          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);

            getResponse = await fetch(getUrl, {
              ...getOptions,
              headers,
            });
          }
        }

        if (!getResponse.ok) {
          const error = await getResponse.text();
          console.error("Error fetching event for update:", error);
          throw new Error(
            `HTTP error! status: ${getResponse.status} - ${getResponse.statusText}`,
          );
        }

        const currentEvent = await getResponse.json();
        const eventData: Record<string, any> = { ...currentEvent };

        // Update fields that were provided
        if (input.event.title !== undefined) {
          eventData.summary = input.event.title;
        }
        if (input.event.description !== undefined) {
          eventData.description = input.event.description;
        }
        if (input.event.location !== undefined) {
          eventData.location = input.event.location;
        }

        // Handle date updates
        const isAllDay = input.event.allDay ?? !!currentEvent.start?.date;

        if (isAllDay) {
          // Format dates as YYYY-MM-DD for all-day events
          if (input.event.start) {
            const startDate = input.event.start.toISOString().split("T")[0];
            eventData.start = { date: startDate };
          }
          if (input.event.end) {
            const endDate = input.event.end.toISOString().split("T")[0];
            eventData.end = { date: endDate };
          }
        } else {
          // Use dateTime for regular events
          if (input.event.start) {
            eventData.start = { dateTime: input.event.start.toISOString() };
          }
          if (input.event.end) {
            eventData.end = { dateTime: input.event.end.toISOString() };
          }
        }

        // Update color if provided
        if (input.event.color) {
          // Find colorId that matches the requested color
          for (const [colorId, colorInfo] of Object.entries(
            GOOGLE_CALENDAR_COLORS,
          )) {
            if (colorInfo.color === input.event.color) {
              eventData.colorId = colorId;
              break;
            }
          }
        }

        const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`;
        const updateOptions: RequestInit = {
          body: JSON.stringify(eventData),
          headers,
          method: "PUT",
          mode: "cors",
        };

        let updateResponse = await fetch(updateUrl, updateOptions);

        // Handle token refresh if needed (again, just in case)
        if (updateResponse.status === 401 && account.refreshToken) {
          console.log(
            "Access token expired during update, refreshing via Better Auth...",
          );

          const refreshedAccount = await authInstance.api.refreshToken({
            body: {
              accountId: account.id,
              providerId: "google",
              userId: ctx.session.user.id,
            },
          });

          if (refreshedAccount?.accessToken) {
            accessToken = refreshedAccount.accessToken;
            headers.set("Authorization", `Bearer ${accessToken}`);

            updateResponse = await fetch(updateUrl, {
              ...updateOptions,
              headers,
            });
          }
        }

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error("Error updating event:", error);
          throw new Error(
            `HTTP error! status: ${updateResponse.status} - ${updateResponse.statusText}`,
          );
        }

        const item = await updateResponse.json();

        const updatedIsAllDay = !!item.start?.date;
        const startStr = (item.start?.dateTime ?? item.start?.date) as
          | string
          | undefined;
        const endStr = (item.end?.dateTime ?? item.end?.date) as
          | string
          | undefined;

        if (!startStr || !endStr) {
          throw new Error(
            "Updated event is missing required start/end time information",
          );
        }

        let eventColor = undefined;
        const colorId = item.colorId as string | undefined;
        if (colorId && GOOGLE_CALENDAR_COLORS[colorId]) {
          eventColor = GOOGLE_CALENDAR_COLORS[colorId].color;
        }

        return {
          id: item.id,
          allDay: updatedIsAllDay,
          calendarId: input.calendarId,
          color: eventColor || "blue",
          description: item.description ?? undefined,
          end: new Date(endStr),
          location: item.location ?? undefined,
          start: new Date(startStr),
          title: item.summary ?? "(No title)",
        };
      } catch (error) {
        console.error("Error updating event:", error);
        throw error;
      }
    }),
});
