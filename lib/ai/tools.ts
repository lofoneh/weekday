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
    console.log("getEvents", { end, endTime, includeAllDay, start, startTime });

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

const createEventSchema = z.object({
  attendees: z
    .array(
      z.object({
        email: z
          .string()
          .email({ message: "Invalid email format for attendee." })
          .describe("The email address of a person to invite to the event."),
      }),
    )
    .optional()
    .describe(
      "A list of attendees to invite. Extract email addresses if provided.",
    ),
  createMeetLink: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Set to true if the user explicitly requests a Google Meet link or implies a virtual meeting without providing a specific link.",
    ),
  description: z
    .string()
    .optional()
    .describe(
      "A more detailed description or notes for the event, if provided by the user.",
    ),
  endTime: z
    .string()
    .datetime({
      message:
        "Invalid ISO 8601 datetime format for endTime. Ensure the date and time are correctly inferred and formatted.",
    })
    .describe(
      "The end date and time of the event in ISO 8601 format (e.g., '2024-07-15T10:00:00-07:00'). The LLM must infer this. If the user specifies a start time and duration (e.g., 'for 1 hour'), calculate endTime. If only startTime is given, assume a default duration (e.g., 60 minutes).",
    ),
  location: z
    .string()
    .optional()
    .describe(
      "The physical location (e.g., 'Conference Room A', '123 Main St') or virtual meeting link for the event.",
    ),
  reminders: z
    .array(
      z.object({
        method: z
          .enum(["email", "popup"])
          .describe("The method of reminder: 'email' or 'popup'."),
        minutes: z
          .number()
          .int()
          .positive({ message: "Reminder minutes must be a positive integer." })
          .describe(
            "Number of minutes before the event start time for the reminder.",
          ),
      }),
    )
    .optional()
    .describe(
      "Custom reminders for the event, if specified by the user (e.g., 'remind me 10 minutes before').",
    ),
  startTime: z
    .string()
    .datetime({
      message:
        "Invalid ISO 8601 datetime format for startTime. Ensure the date and time are correctly inferred and formatted.",
    })
    .describe(
      "The start date and time of the event in ISO 8601 format (e.g., '2024-07-15T09:00:00-07:00'). The LLM must accurately infer this from natural language, including the full date and time.",
    ),
  summary: z
    .string()
    .describe(
      "The title or name of the event. This should be extracted directly from the user's description of the event's purpose.",
    ),
  timeZone: z
    .string()
    .optional()
    .describe(
      "The IANA time zone for the event's start and end times (e.g., 'America/Los_Angeles'). If the user doesn't specify, attempt to use the user's primary calendar timezone or a sensible default like UTC, and inform the user if a default is assumed.",
    ),
});

export const createEvent = tool({
  description:
    "Creates a new event in the user's Google Calendar. Use this to schedule meetings, appointments, or other calendar entries based on user-provided details like title, date, time, attendees, and location.",
  parameters: createEventSchema,
  execute: async ({
    attendees,
    createMeetLink,
    description,
    endTime,
    location,
    reminders,
    startTime,
    summary,
  }: z.infer<typeof createEventSchema>) => {
    try {
      const parsedStartTime = new Date(startTime);
      const parsedEndTime = new Date(endTime);

      let remindersPayload:
        | { overrides: typeof reminders; useDefault: boolean }
        | undefined;
      if (reminders && reminders.length > 0) {
        remindersPayload = {
          overrides: reminders,
          useDefault: false,
        };
      }

      const createdEvent = await api.calendar.createEvent({
        calendarId: "primary",
        createMeetLink: createMeetLink ?? false,
        event: {
          attendees,
          description,
          end: parsedEndTime,
          location,
          reminders: remindersPayload as any,
          start: parsedStartTime,
          title: summary,
        },
      });

      return {
        event: {
          id: createdEvent.id,
          allDay: createdEvent.allDay,
          calendarId: createdEvent.calendarId,
          description: createdEvent.description,
          end: createdEvent.end.toISOString(),
          location: createdEvent.location,
          start: createdEvent.start.toISOString(),
          title: createdEvent.title,
          // htmlLink: createdEvent.htmlLink, // Removed as ProcessedCalendarEventSchema likely lacks htmlLink
        },
        message: "Event created successfully.",
      };
    } catch (error) {
      console.error("Error creating event with tool:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: string }).message)
          : "Failed to create calendar event due to an unexpected error.";
      return { error: errorMessage };
    }
  },
});
