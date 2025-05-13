"use client";

import { useMemo } from "react";

import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { type CalendarEvent, EventCalendar } from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { api } from "@/trpc/react";

export function BigCalendar() {
  const { currentDate, isCalendarVisible } = useCalendarContext();

  const { timeMax, timeMin } = useMemo(() => {
    const start = startOfMonth(subMonths(currentDate, 1));
    const end = endOfMonth(addMonths(currentDate, 1));
    return {
      timeMax: end.toISOString(),
      timeMin: start.toISOString(),
    };
  }, [currentDate]);

  const { data: fetchedEvents } = api.calendar.getEvents.useQuery({
    timeMax,
    timeMin,
  });

  const events = useMemo(() => {
    if (!fetchedEvents) return [];

    return fetchedEvents.map((ev) => ({
      id: ev.id,
      allDay: ev.allDay,
      calendarId: ev.calendarId,
      color: undefined,
      description: ev.description ?? undefined,
      end: new Date(ev.end),
      location: ev.location ?? undefined,
      start: new Date(ev.start),
      title: ev.title,
    }));
  }, [fetchedEvents]);

  // Filter events based on visible colors
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isCalendarVisible(event.calendarId));
  }, [events, isCalendarVisible]);

  const handleEventAdd = (event: CalendarEvent) => {
    // This would typically call a mutation to add an event
    // After successful mutation, the query would be invalidated and refetched
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    // This would typically call a mutation to update an event
    // After successful mutation, the query would be invalidated and refetched
  };

  const handleEventDelete = (eventId: string) => {
    // This would typically call a mutation to delete an event
    // After successful mutation, the query would be invalidated and refetched
  };

  return (
    <EventCalendar
      onEventAdd={handleEventAdd}
      onEventDelete={handleEventDelete}
      onEventUpdate={handleEventUpdate}
      events={visibleEvents}
      initialView="week"
    />
  );
}
