"use client";

import { useRef, useState } from "react";

import type { ToolInvocation, Message as UIMessage } from "ai";

import { type UseChatOptions, useChat } from "@ai-sdk/react";
import { nanoid } from "nanoid";

import { ChatContainer } from "@/components/prompt-kit/chat-container";
import { Markdown } from "@/components/prompt-kit/markdown";
import { Message, MessageContent } from "@/components/prompt-kit/message";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { Button } from "@/components/ui/button";
import { useChat as useChatProvider } from "@/providers/chat-provider";
import { api } from "@/trpc/react";

import { ChatPromptInput } from "./chat-prompt-input";
import { CreateEventCall, CreateEventResult } from "./tools/create-event";
import { GetEventCall, GetEventResult } from "./tools/get-event";
import {
  GetUpcomingEventCall,
  GetUpcomingEventResult,
} from "./tools/get-upcoming-event";
import { UpdateEventCall, UpdateEventResult } from "./tools/update-event";

export function ChatSidebar() {
  const { isChatOpen } = useChatProvider();
  const utils = api.useUtils();

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState(nanoid());

  const { input, messages, setInput, setMessages, status, stop, handleSubmit } =
    useChat({
      id: chatId,
      api: "/api/ai/chat",

      onFinish: (message) => {
        if (message.parts) {
          for (const part of message.parts) {
            if (part.type === "tool-invocation") {
              const toolInvocation = part.toolInvocation as ToolInvocation;
              if (
                (toolInvocation.toolName === "createEvent" ||
                  toolInvocation.toolName === "updateEvent") &&
                toolInvocation.state === "result" &&
                !toolInvocation.result.error
              ) {
                utils.calendar.getEvents.invalidate();
                break;
              }
            }
          }
        }
      },
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
                          return <GetEventCall key={toolCallId} />;
                        }

                        if (toolInvocation.state === "result") {
                          return (
                            <GetEventResult
                              key={toolCallId}
                              toolInvocation={toolInvocation}
                            />
                          );
                        }
                      }

                      if (toolInvocation.toolName === "createEvent") {
                        if (toolInvocation.state === "call") {
                          return <CreateEventCall key={toolCallId} />;
                        }

                        if (toolInvocation.state === "result") {
                          return (
                            <CreateEventResult
                              key={toolCallId}
                              toolInvocation={toolInvocation}
                            />
                          );
                        }
                      }

                      if (toolInvocation.toolName === "updateEvent") {
                        if (toolInvocation.state === "call") {
                          return (
                            <UpdateEventCall
                              key={toolCallId}
                              toolInvocation={toolInvocation}
                            />
                          );
                        }

                        if (toolInvocation.state === "result") {
                          return (
                            <UpdateEventResult
                              key={toolCallId}
                              message={message}
                              toolInvocation={toolInvocation}
                            />
                          );
                        }
                      }

                      if (toolInvocation.toolName === "getNextUpcomingEvent") {
                        if (toolInvocation.state === "call") {
                          return <GetUpcomingEventCall key={toolCallId} />;
                        }

                        if (toolInvocation.state === "result") {
                          return (
                            <GetUpcomingEventResult
                              key={toolCallId}
                              toolInvocation={toolInvocation}
                            />
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
