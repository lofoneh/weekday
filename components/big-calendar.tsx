"use client";

import { useMemo } from "react";

import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { type CalendarEvent, EventCalendar } from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { api } from "@/trpc/react";

export function BigCalendar() {
  const { currentDate, isCalendarVisible } = useCalendarContext();
  const utils = api.useUtils();

  const { timeMax, timeMin } = useMemo(() => {
    const start = startOfMonth(subMonths(currentDate, 1));
    const end = endOfMonth(addMonths(currentDate, 1));
    return {
      timeMax: end.toISOString(),
      timeMin: start.toISOString(),
    };
  }, [currentDate]);

  // Server rendered???
  const { data: events } = api.calendar.getEvents.useQuery({
    timeMax,
    timeMin,
  });

  const { isPending: isCreatingEvent, mutate: createEvent } =
    api.calendar.createEvent.useMutation({
      onSuccess: () => {
        utils.calendar.getEvents.invalidate();
      },
    });
  const { isPending: isUpdatingEvent, mutate: updateEvent } =
    api.calendar.updateEvent.useMutation({
      onSuccess: () => {
        utils.calendar.getEvents.invalidate();
      },
    });
  const { isPending: isDeletingEvent, mutate: deleteEvent } =
    api.calendar.deleteEvent.useMutation({
      onSuccess: () => {
        utils.calendar.getEvents.invalidate();
      },
    });

  const visibleEvents = useMemo(() => {
    return events?.filter((event) => isCalendarVisible(event.calendarId));
  }, [events, isCalendarVisible]);

  const handleEventAdd = (event: CalendarEvent) => {
    if (!event.title || !event.start || !event.end) {
      console.error("Event title, start, and end are required.");
      return;
    }

    createEvent({
      calendarId: event.calendarId ?? "primary",
      event: {
        allDay: event.allDay,
        description: event.description,
        end: new Date(event.end),
        location: event.location,
        start: new Date(event.start),
        title: event.title,
      },
    });
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    if (!updatedEvent.id) {
      console.error("Event ID is required for updates.");
      return;
    }
    updateEvent({
      calendarId: updatedEvent.calendarId ?? "primary",
      event: {
        allDay: updatedEvent.allDay,
        description: updatedEvent.description,
        end: updatedEvent.end ? new Date(updatedEvent.end) : undefined,
        location: updatedEvent.location,
        start: updatedEvent.start ? new Date(updatedEvent.start) : undefined,
        title: updatedEvent.title,
      },
      eventId: updatedEvent.id,
    });
  };

  const handleEventDelete = (eventId: string) => {
    deleteEvent({
      calendarId: "primary",
      eventId,
    });
  };

  return (
    <EventCalendar
      onEventAdd={handleEventAdd}
      onEventDelete={handleEventDelete}
      onEventUpdate={handleEventUpdate}
      events={visibleEvents}
      isCreatingEvent={isCreatingEvent}
      isDeletingEvent={isDeletingEvent}
      isUpdatingEvent={isUpdatingEvent}
    />
  );
}
