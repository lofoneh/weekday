"use client";

import { useRef, useState } from "react";

import type { ToolInvocation, Message as UIMessage } from "ai";

import { type UseChatOptions, useChat } from "@ai-sdk/react";
import {
  addMinutes,
  format,
  formatDistanceToNowStrict,
  isToday,
  startOfDay,
} from "date-fns";
import { CalendarDays, PencilRuler } from "lucide-react";
import { nanoid } from "nanoid";

import { ChatContainer } from "@/components/prompt-kit/chat-container";
import { Markdown } from "@/components/prompt-kit/markdown";
import { Message, MessageContent } from "@/components/prompt-kit/message";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { Button } from "@/components/ui/button";
import { useChat as useChatProvider } from "@/providers/chat-provider";

import type { CalendarEvent } from "../event-calendar/types";

import { EventItem } from "../event-calendar/event-item";
import { CalendarDaysIcon } from "../ui/calendar-days";
import { ChatPromptInput } from "./chat-prompt-input";

const groupEventsByDate = (
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> => {
  const grouped = new Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    const eventDate = startOfDay(new Date(event.start)).toISOString();
    if (!grouped.has(eventDate)) {
      grouped.set(eventDate, []);
    }
    grouped.get(eventDate)!.push(event);
  });
  return grouped;
};

export function ChatSidebar() {
  const { isChatOpen } = useChatProvider();

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState(nanoid());

  const { input, messages, setInput, setMessages, status, stop, handleSubmit } =
    useChat({
      id: chatId,
      api: "/api/ai/chat",
    } satisfies UseChatOptions);

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim()) {
      return;
    }

    handleSubmit(e);
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(nanoid());
  };

  const isLoading = status === "submitted" || status === "streaming";

  if (!isChatOpen) {
    return null;
  }

  return (
    <div className="bg-background flex h-full flex-1 flex-col gap-4 rounded-2xl pt-0">
      <div className="relative flex h-[calc(100vh-1rem)] w-full flex-col overflow-hidden">
        <div className="flex w-full items-center justify-between border-b p-3">
          <div />
          <Button size="sm" onClick={handleNewChat}>
            New Chat
          </Button>
        </div>

        <ChatContainer
          ref={containerRef}
          className="flex-1 space-y-4 border-t p-4"
          scrollToRef={bottomRef}
        >
          {messages.map((message: UIMessage) => {
            const isAssistant = message.role === "assistant";

            console.log(message);

            return (
              <Message key={message.id}>
                <div className="flex-1 space-y-2">
                  {message.parts?.map((part, index) => {
                    if (part.type === "text") {
                      return isAssistant ? (
                        <div
                          key={`${message.id}-text-${index}`}
                          className="text-foreground prose rounded-lg p-2"
                        >
                          <Markdown className="prose dark:prose-invert">
                            {part.text}
                          </Markdown>
                        </div>
                      ) : (
                        <MessageContent
                          key={`${message.id}-text-${index}`}
                          className="bg-sidebar text-primary-foreground dark:text-foreground prose-invert"
                          markdown
                        >
                          {part.text}
                        </MessageContent>
                      );
                    } else if (part.type === "tool-invocation") {
                      const toolInvocation =
                        part.toolInvocation as ToolInvocation;
                      const toolCallId = toolInvocation.toolCallId;

                      if (toolInvocation.toolName === "getEvents") {
                        if (toolInvocation.state === "call") {
                          return (
                            <div
                              key={toolCallId}
                              className="flex items-center gap-2 p-2"
                            >
                              <CalendarDaysIcon className="h-4 w-4" />

                              <p>Getting events...</p>
                            </div>
                          );
                        }

                        if (toolInvocation.state === "result") {
                          const events = toolInvocation.result
                            .events as CalendarEvent[];

                          const groupedEvents = groupEventsByDate(events);
                          const uniqueDates = Array.from(groupedEvents.keys());

                          return (
                            <div
                              key={toolCallId}
                              className="flex flex-col gap-2 p-3"
                            >
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                  Calendar Events
                                </p>
                              </div>

                              {events && events.length > 0 ? (
                                uniqueDates.length === 1 ? (
                                  <div className="mt-2 flex flex-col space-y-2">
                                    {events.map((event: CalendarEvent) => (
                                      <EventItem
                                        key={event.id || nanoid()}
                                        onClick={() =>
                                          console.log(
                                            "Event clicked in chat:",
                                            event,
                                          )
                                        }
                                        event={event}
                                        view="agenda"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-2 flex flex-col">
                                    {uniqueDates.map((dateStr) => {
                                      const dayEvents =
                                        groupedEvents.get(dateStr) || [];
                                      if (dayEvents.length === 0) return null;

                                      const groupStartDate = new Date(dateStr);

                                      let maxEndDateForGroup = groupStartDate;
                                      for (const event of dayEvents) {
                                        if (event.end) {
                                          const eventEndDate = new Date(
                                            event.end,
                                          );
                                          if (!isNaN(eventEndDate.getTime())) {
                                            if (
                                              eventEndDate > maxEndDateForGroup
                                            ) {
                                              maxEndDateForGroup = eventEndDate;
                                            }
                                          }
                                        }
                                      }

                                      let dateDisplayString: string;
                                      if (
                                        startOfDay(maxEndDateForGroup) >
                                        startOfDay(groupStartDate)
                                      ) {
                                        dateDisplayString = `${format(
                                          groupStartDate,
                                          "d MMM",
                                        )} - ${format(
                                          maxEndDateForGroup,
                                          "d MMM, EEEE",
                                        )}`;
                                      } else {
                                        dateDisplayString = format(
                                          groupStartDate,
                                          "d MMM, EEEE",
                                        );
                                      }

                                      return (
                                        <div
                                          key={dateStr}
                                          className="border-border/70 relative my-4 border-t pt-1 first:mt-2 first:border-t-0"
                                        >
                                          <span
                                            className="bg-background text-muted-foreground absolute -top-2.5 left-0 flex h-5 items-center pe-2 text-[10px] uppercase data-today:font-semibold sm:text-xs"
                                            data-today={
                                              isToday(groupStartDate) ||
                                              undefined
                                            }
                                          >
                                            {dateDisplayString}
                                          </span>
                                          <div className="mt-4 space-y-2">
                                            {dayEvents.map(
                                              (event: CalendarEvent) => (
                                                <EventItem
                                                  key={event.id || nanoid()}
                                                  onClick={() =>
                                                    console.log(
                                                      "Event clicked in chat:",
                                                      event,
                                                    )
                                                  }
                                                  event={event}
                                                  view="agenda"
                                                />
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )
                              ) : (
                                <p className="pl-6 text-sm text-gray-500 dark:text-gray-400">
                                  No events found.
                                </p>
                              )}
                            </div>
                          );
                        }
                      }

                      if (toolInvocation.toolName === "editDocument") {
                        return (
                          <div
                            key={toolInvocation.toolCallId}
                            className="bg-muted text-muted-foreground flex items-center gap-2 rounded p-2"
                          >
                            <PencilRuler className="h-4 w-4 flex-shrink-0" />
                            <p className="text-sm italic">
                              Editing document...
                            </p>
                          </div>
                        );
                      }

                      if (toolInvocation.toolName === "getNextUpcomingEvent") {
                        if (toolInvocation.state === "call") {
                          return (
                            <div
                              key={toolCallId}
                              className="flex items-center gap-2 p-2"
                            >
                              <CalendarDaysIcon className="h-4 w-4" />
                              <p>Getting next upcoming event...</p>
                            </div>
                          );
                        }

                        if (toolInvocation.state === "result") {
                          const {
                            event,
                            minutesToStart,
                            status: eventStatus,
                          } = toolInvocation.result as {
                            event: CalendarEvent;
                            minutesToStart: number;
                            status: string;
                          };

                          if (!event) {
                            return (
                              <div
                                key={toolCallId}
                                className="flex flex-col gap-2 p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-gray-500" />
                                  <p className="font-medium text-gray-700 dark:text-gray-300">
                                    Next Upcoming Event
                                  </p>
                                </div>
                                <p className="pl-6 text-sm text-gray-500 dark:text-gray-400">
                                  No upcoming event found.
                                </p>
                              </div>
                            );
                          }

                          let statusText = "";
                          if (eventStatus === "upcoming") {
                            if (minutesToStart < 0) {
                              statusText = "Starting now";
                            } else {
                              const now = new Date();
                              const startTime = addMinutes(now, minutesToStart);
                              statusText = `Starts ${formatDistanceToNowStrict(startTime, { addSuffix: true })}`;
                            }
                          } else if (eventStatus === "ongoing") {
                            statusText = "Ongoing";
                          }

                          return (
                            <div
                              key={toolCallId}
                              className="flex flex-col gap-3 px-2 py-3"
                            >
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                  Next Upcoming Event
                                </p>
                              </div>
                              <EventItem
                                onClick={() =>
                                  console.log("Event clicked in chat:", event)
                                }
                                event={event}
                                view="agenda"
                              />
                              {statusText && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {statusText}
                                </p>
                              )}
                            </div>
                          );
                        }
                      }
                    }
                    return null;
                  })}

                  {!message.parts && (
                    <>
                      {isAssistant ? (
                        <div className="bg-secondary text-foreground prose rounded-lg p-2">
                          <Markdown className="prose dark:prose-invert">
                            {message.content}
                          </Markdown>
                        </div>
                      ) : (
                        <MessageContent
                          className="bg-primary text-primary-foreground prose-invert"
                          markdown
                        >
                          {message.content}
                        </MessageContent>
                      )}
                    </>
                  )}
                </div>
              </Message>
            );
          })}
          <div ref={bottomRef} />
        </ChatContainer>

        <div className="border-border relative border-t p-2">
          <ChatPromptInput
            value={input}
            onSubmit={handleFormSubmit}
            onValueChange={setInput}
            isLoading={isLoading}
          />
        </div>

        <div className="absolute right-7 bottom-20">
          <ScrollButton
            className="shadow-sm"
            containerRef={containerRef}
            scrollRef={bottomRef}
          />
        </div>
      </div>
    </div>
  );
}
