"use client";

import { useMemo, useState } from "react";

import { addDays, getDay, setHours, setMinutes } from "date-fns";

import {
  type CalendarEvent,
  type EventColor,
  EventCalendar,
} from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";

// Etiquettes data for calendar filtering
export const etiquettes = [
  {
    id: "my-events",
    color: "emerald" as EventColor,
    isActive: true,
    name: "My Events",
  },
  {
    id: "marketing-team",
    color: "orange" as EventColor,
    isActive: true,
    name: "Marketing Team",
  },
  {
    id: "interviews",
    color: "violet" as EventColor,
    isActive: true,
    name: "Interviews",
  },
  {
    id: "events-planning",
    color: "blue" as EventColor,
    isActive: true,
    name: "Events Planning",
  },
  {
    id: "holidays",
    color: "rose" as EventColor,
    isActive: true,
    name: "Holidays",
  },
];

// Function to calculate days until next Sunday
const getDaysUntilNextSunday = (date: Date) => {
  const day = getDay(date); // 0 is Sunday, 6 is Saturday
  return day === 0 ? 0 : 7 - day; // If today is Sunday, return 0, otherwise calculate days until Sunday
};

// Store the current date to avoid repeated new Date() calls
const currentDate = new Date();

// Calculate the offset once to avoid repeated calculations
const daysUntilNextSunday = getDaysUntilNextSunday(currentDate);

// Sample events data with hardcoded times
const sampleEvents: CalendarEvent[] = [
  {
    id: "w1-0a",
    color: "blue",
    description: "Quarterly review with executive team",
    end: setMinutes(
      setHours(addDays(currentDate, -13 + daysUntilNextSunday), 11),
      30,
    ),
    location: "Executive Boardroom",
    start: setMinutes(
      setHours(addDays(currentDate, -13 + daysUntilNextSunday), 9),
      0,
    ),
    title: "Executive Board Meeting",
  },
  {
    id: "w1-0b",
    color: "violet",
    description: "Update investors on company progress",
    end: setMinutes(
      setHours(addDays(currentDate, -13 + daysUntilNextSunday), 15),
      0,
    ),
    location: "Conference Room A",
    start: setMinutes(
      setHours(addDays(currentDate, -13 + daysUntilNextSunday), 14),
      0,
    ),
    title: "Investor Call",
  },
  {
    id: "w1-1",
    color: "violet",
    description: "Annual strategy planning session",
    end: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 10),
      0,
    ),
    location: "Innovation Lab",
    start: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 8),
      30,
    ),
    title: "Strategy Workshop",
  },
  {
    id: "w1-2",
    color: "emerald",
    description: "Present quarterly results",
    end: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 14),
      30,
    ),
    location: "Client HQ",
    start: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 13),
      0,
    ),
    title: "Client Presentation",
  },
  {
    id: "w1-3",
    color: "blue",
    description: "Review department budgets",
    end: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 11),
      0,
    ),
    location: "Finance Room",
    start: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 9),
      15,
    ),
    title: "Budget Review",
  },
  {
    id: "w1-4",
    color: "orange",
    description: "Quarterly team lunch",
    end: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 13),
      30,
    ),
    location: "Bistro Garden",
    start: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 12),
      0,
    ),
    title: "Team Lunch",
  },
  {
    id: "w1-5",
    color: "orange",
    description: "Launch new marketing campaign",
    end: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 12),
      0,
    ),
    location: "Marketing Suite",
    start: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 10),
      0,
    ),
    title: "Project Kickoff",
  },
  {
    id: "w1-6",
    color: "violet",
    description: "First round interview",
    end: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 15),
      0,
    ),
    location: "HR Office",
    start: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 14),
      0,
    ),
    title: "Interview: UX Designer",
  },
  {
    id: "w1-7",
    color: "emerald",
    description: "Monthly company update",
    end: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 10),
      30,
    ),
    location: "Main Auditorium",
    start: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 9),
      0,
    ),
    title: "Company All-Hands",
  },
  {
    id: "w1-8",
    color: "blue",
    description: "Demo new features to stakeholders",
    end: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 15),
      0,
    ),
    location: "Demo Room",
    start: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 13),
      45,
    ),
    title: "Product Demo",
  },
  {
    id: "w1-9",
    color: "rose",
    description: "Morning routine with kids",
    end: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 7),
      30,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 7),
      0,
    ),
    title: "Family Time",
  },
  {
    id: "w1-10",
    color: "rose",
    description: "Breakfast with family",
    end: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 10),
      30,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 10),
      0,
    ),
    title: "Family Time",
  },
  {
    id: "5e",
    color: "rose",
    description: "Some time to spend with family",
    end: setMinutes(
      setHours(addDays(currentDate, -7 + daysUntilNextSunday), 13),
      30,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, -7 + daysUntilNextSunday), 10),
      0,
    ),
    title: "Family Time",
  },
  {
    id: "1b",
    color: "orange",
    description: "Strategic planning for next year",
    end: setMinutes(
      setHours(addDays(currentDate, -6 + daysUntilNextSunday), 8),
      0,
    ),
    location: "Main Conference Hall",
    start: setMinutes(
      setHours(addDays(currentDate, -6 + daysUntilNextSunday), 7),
      0,
    ),
    title: "Meeting w/ Ely",
  },
  {
    id: "1c",
    color: "blue",
    description: "Weekly team sync",
    end: setMinutes(
      setHours(addDays(currentDate, -6 + daysUntilNextSunday), 11),
      0,
    ),
    location: "Main Conference Hall",
    start: setMinutes(
      setHours(addDays(currentDate, -6 + daysUntilNextSunday), 8),
      15,
    ),
    title: "Team Catch-up",
  },
  {
    id: "1d",
    color: "blue",
    description: "Coordinate operations",
    end: setMinutes(
      setHours(addDays(currentDate, -6 + daysUntilNextSunday), 16),
      0,
    ),
    location: "Main Conference Hall",
    start: setMinutes(
      setHours(addDays(currentDate, -6 + daysUntilNextSunday), 15),
      0,
    ),
    title: "Checkin w/ Pedra",
  },
  {
    id: "1e",
    color: "emerald",
    description: "Introduce team members",
    end: setMinutes(
      setHours(addDays(currentDate, -5 + daysUntilNextSunday), 9),
      30,
    ),
    location: "Main Conference Hall",
    start: setMinutes(
      setHours(addDays(currentDate, -5 + daysUntilNextSunday), 8),
      15,
    ),
    title: "Teem Intro",
  },
  {
    id: "1f",
    color: "emerald",
    description: "Present tasks",
    end: setMinutes(
      setHours(addDays(currentDate, -5 + daysUntilNextSunday), 13),
      30,
    ),
    location: "Main Conference Hall",
    start: setMinutes(
      setHours(addDays(currentDate, -5 + daysUntilNextSunday), 10),
      45,
    ),
    title: "Task Presentation",
  },
  {
    id: "5",
    color: "orange",
    description: "Discuss product requirements",
    end: setMinutes(
      setHours(addDays(currentDate, -4 + daysUntilNextSunday), 11),
      30,
    ),
    location: "Downtown Cafe",
    start: setMinutes(
      setHours(addDays(currentDate, -4 + daysUntilNextSunday), 9),
      0,
    ),
    title: "Product Meeting",
  },
  {
    id: "5b",
    color: "violet",
    description: "Discuss new project requirements",
    end: setMinutes(
      setHours(addDays(currentDate, -4 + daysUntilNextSunday), 14),
      0,
    ),
    location: "Downtown Cafe",
    start: setMinutes(
      setHours(addDays(currentDate, -4 + daysUntilNextSunday), 13),
      30,
    ),
    title: "Team Meeting",
  },
  {
    id: "5c",
    color: "violet",
    description: "Talent review",
    end: setMinutes(
      setHours(addDays(currentDate, -3 + daysUntilNextSunday), 10),
      45,
    ),
    location: "Abbey Road Room",
    start: setMinutes(
      setHours(addDays(currentDate, -3 + daysUntilNextSunday), 9),
      45,
    ),
    title: "1:1 w/ Tommy",
  },
  {
    id: "5d",
    color: "violet",
    description: "Ultra fast call with Sonia",
    end: setMinutes(
      setHours(addDays(currentDate, -3 + daysUntilNextSunday), 11),
      30,
    ),
    location: "Abbey Road Room",
    start: setMinutes(
      setHours(addDays(currentDate, -3 + daysUntilNextSunday), 11),
      0,
    ),
    title: "Kick-off call",
  },
  {
    id: "5ef",
    color: "blue",
    description: "Manual process review",
    end: setMinutes(
      setHours(addDays(currentDate, -2 + daysUntilNextSunday), 9),
      45,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, -2 + daysUntilNextSunday), 8),
      45,
    ),
    title: "Weekly Review",
  },
  {
    id: "5f",
    color: "orange",
    description: "Explore new ideas",
    end: setMinutes(
      setHours(addDays(currentDate, -2 + daysUntilNextSunday), 15),
      30,
    ),
    location: "Main Conference Hall",
    start: setMinutes(
      setHours(addDays(currentDate, -2 + daysUntilNextSunday), 14),
      30,
    ),
    title: "Meeting w/ Mike",
  },
  {
    id: "5g",
    color: "rose",
    description: "Some time to spend with family",
    end: setMinutes(
      setHours(addDays(currentDate, -1 + daysUntilNextSunday), 7),
      30,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, -1 + daysUntilNextSunday), 7),
      0,
    ),
    title: "Family Time",
  },
  {
    id: "w3-1",
    color: "blue",
    description: "Plan next quarter objectives",
    end: setMinutes(setHours(addDays(currentDate, daysUntilNextSunday), 12), 0),
    location: "Planning Room",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday), 9),
      30,
    ),
    title: "Quarterly Planning",
  },
  {
    id: "w3-2",
    color: "violet",
    description: "Review vendor proposals",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 1), 8),
      30,
    ),
    location: "Meeting Room B",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 1), 7),
      0,
    ),
    title: "Vendor Meeting",
  },
  {
    id: "w3-3",
    color: "emerald",
    description: "Brainstorming session for new UI",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 1), 12),
      45,
    ),
    location: "Design Studio",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 1), 10),
      15,
    ),
    title: "Design Workshop",
  },
  {
    id: "w3-4",
    color: "orange",
    description: "Informal discussion about company vision",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 1), 14),
      30,
    ),
    location: "Executive Dining Room",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 1), 13),
      0,
    ),
    title: "Lunch with CEO",
  },
  {
    id: "w3-5",
    color: "blue",
    description: "Code review with engineering team",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 2), 12),
      30,
    ),
    location: "Engineering Lab",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 2), 11),
      0,
    ),
    title: "Technical Review",
  },
  {
    id: "w3-6",
    color: "violet",
    description: "Follow-up with key customer",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 2), 16),
      0,
    ),
    location: "Call Center",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 2), 15),
      15,
    ),
    title: "Customer Call",
  },
  {
    id: "w3-7",
    allDay: true,
    color: "emerald",
    description: "Offsite team building activity",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 3), 17),
      0,
    ),
    location: "Adventure Park",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 3), 9),
      0,
    ),
    title: "Team Building",
  },
  {
    id: "w3-8",
    color: "orange",
    description: "Review campaign performance",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 4), 10),
      15,
    ),
    location: "Marketing Room",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 4), 8),
      45,
    ),
    title: "Marketing Review",
  },
  {
    id: "w3-9",
    color: "blue",
    description: "Discuss product roadmap for next quarter",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 5), 16),
      30,
    ),
    location: "Strategy Room",
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 5), 14),
      0,
    ),
    title: "Product Roadmap",
  },
  {
    id: "w3-10",
    color: "rose",
    description: "Morning walk with family",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 6), 7),
      30,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 6), 7),
      0,
    ),
    title: "Family Time",
  },
  {
    id: "w3-11",
    color: "rose",
    description: "Brunch with family",
    end: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 6), 10),
      30,
    ),
    start: setMinutes(
      setHours(addDays(currentDate, daysUntilNextSunday + 6), 10),
      0,
    ),
    title: "Family Time",
  },
];

export default function Component() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
  const { isColorVisible } = useCalendarContext();

  // Filter events based on visible colors
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
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
