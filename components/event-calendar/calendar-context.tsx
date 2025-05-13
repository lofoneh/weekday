"use client";

import { type ReactNode, createContext, useContext, useState } from "react";

interface CalendarContextType {
  // Date management
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Calendar visibility management
  visibleCalendarIds: string[];
  isCalendarVisible: (id: string | undefined) => boolean;
  toggleCalendarVisibility: (id: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider",
    );
  }
  return context;
}

interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>([]);

  const toggleCalendarVisibility = (id: string) => {
    setVisibleCalendarIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      return [...prev, id];
    });
  };

  const isCalendarVisible = (id: string | undefined) => {
    if (!id) return true;
    if (visibleCalendarIds.length === 0) return true;
    return visibleCalendarIds.includes(id);
  };

  const value = {
    currentDate,
    isCalendarVisible,
    setCurrentDate,
    toggleCalendarVisibility,
    visibleCalendarIds,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
