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
  execute: async ({ end, endTime, start, startTime }) => {
    try {
      const fullStart = startTime
        ? `${start.split("T")[0]}${startTime}`
        : `${start.split("T")[0]}T00:00:00Z`;
      const fullEnd = endTime
        ? `${end.split("T")[0]}${endTime}`
        : `${end.split("T")[0]}T23:59:59Z`;

      const events = await api.calendar.getEvents({
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
