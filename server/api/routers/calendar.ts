import { z } from "zod";

import {
  CalendarListResponseSchema,
  ProcessedCalendarListEntrySchema,
} from "@/server/api/routers/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { authInstance } from "@/server/auth";

const GOOGLE_CALENDAR_LIST_API_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";

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
});
