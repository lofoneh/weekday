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
  getAllCalendarList: protectedProcedure
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
                color: eventColor,
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
});
