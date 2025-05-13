export interface CalendarEvent {
  id: string;
  end: Date;
  start: Date;
  title: string;
  allDay?: boolean;
  calendarId?: string;
  color?: EventColor;
  description?: string;
  label?: string;
  location?: string;
}

export type CalendarView = "agenda" | "day" | "month" | "week";

export type EventColor = "blue" | "emerald" | "orange" | "rose" | "violet";
