"use client";

import { useRef, useState } from "react";

import type { ToolInvocation, Message as UIMessage } from "ai";

import { type UseChatOptions, useChat } from "@ai-sdk/react";
import { FileText, PencilRuler } from "lucide-react";
import { nanoid } from "nanoid";

import { ChatContainer } from "@/components/prompt-kit/chat-container";
import { Markdown } from "@/components/prompt-kit/markdown";
import { Message, MessageContent } from "@/components/prompt-kit/message";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { Button } from "@/components/ui/button";
import { useChat as useChatProvider } from "@/providers/chat-provider";

import { ChatPromptInput } from "./chat-prompt-input";

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
                          className="bg-sidebar text-primary-foreground prose-invert"
                          markdown
                        >
                          {part.text}
                        </MessageContent>
                      );
                    } else if (part.type === "tool-invocation") {
                      const toolInvocation =
                        part.toolInvocation as ToolInvocation;
                      const toolCallId = toolInvocation.toolCallId;

                      if (toolInvocation.toolName === "readDocument") {
                        return (
                          <div
                            key={toolCallId}
                            className="flex items-center gap-2 p-2"
                          >
                            <FileText className="h-4 w-4" />

                            <p>Reading {document?.title ?? "document"}</p>
                          </div>
                        );
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
