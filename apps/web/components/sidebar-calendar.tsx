"use client";

import { useEffect, useState } from "react";

import { endOfWeek, isWithinInterval, startOfWeek } from "date-fns";

import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface SidebarCalendarProps {
  className?: string;
}

export default function SidebarCalendar({ className }: SidebarCalendarProps) {
  const { currentDate, setCurrentDate } = useCalendarContext();
  const [calendarMonth, setCalendarMonth] = useState<Date>(currentDate);

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  useEffect(() => {
    setCalendarMonth(currentDate);
  }, [currentDate]);

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <Calendar
        selected={currentDate}
        onMonthChange={setCalendarMonth}
        onSelect={handleSelect}
        classNames={{
          day_button:
            "transition-none! hover:not-in-data-selected:bg-sidebar-accent text-sidebar-foreground rounded-sm!",
          outside: "data-selected:bg-sidebar-accent/50",
          today: "*:after:transition-none",
        }}
        mode="single"
        modifiers={{
          currentWeekEnd,
          currentWeekStart,
          currentWeek: (date) =>
            isWithinInterval(date, {
              end: currentWeekEnd,
              start: currentWeekStart,
            }),
        }}
        modifiersClassNames={{
          currentWeek: "bg-sidebar-accent text-sidebar-foreground",
          currentWeekEnd: "rounded-e-sm",
          currentWeekStart: "rounded-s-sm",
        }}
        month={calendarMonth}
      />
    </div>
  );
}
