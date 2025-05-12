"use client";

import { useDroppable } from "@dnd-kit/core";

import { useCalendarDnd } from "@/components/event-calendar";
import { cn } from "@/lib/utils";

interface DroppableCellProps {
  id: string;
  date: Date;
  children?: React.ReactNode;
  className?: string;
  time?: number; // For week/day views, represents hours (e.g., 9.25 for 9:15)
  onClick?: () => void;
}

export function DroppableCell({
  id,
  children,
  className,
  date,
  time,
  onClick,
}: DroppableCellProps) {
  const { activeEvent } = useCalendarDnd();

  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      date,
      time,
    },
  });

  // Format time for display in tooltip (only for debugging)
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, "0")}`
      : null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "data-dragging:bg-accent flex h-full flex-col px-0.5 py-1 sm:px-1",
        className,
      )}
      onClick={onClick}
      title={formattedTime ? `${formattedTime}` : undefined}
      data-dragging={isOver && activeEvent ? true : undefined}
    >
      {children}
    </div>
  );
}
