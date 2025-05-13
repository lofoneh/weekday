"use client";

import { Arrow } from "@radix-ui/react-tooltip";
import { ArrowUp, Square } from "lucide-react";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";

interface ChatPromptInputProps {
  isLoading: boolean;
  value: string;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
}

export function ChatPromptInput({
  isLoading,
  value,
  onSubmit,
  onValueChange,
}: ChatPromptInputProps) {
  return (
    <PromptInput
      className="border-input bg-background w-full max-w-(--breakpoint-md) rounded-[calc(1rem-4px)] border px-3 py-1 pl-1.5 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)]"
      value={value}
      onSubmit={onSubmit}
      onValueChange={onValueChange}
      isLoading={isLoading}
    >
      <PromptInputTextarea
        className="text-base placeholder:text-base"
        placeholder="Ask anything..."
      />
      <PromptInputActions className="mt-0 mb-2 flex h-auto items-center justify-between gap-2 sm:mt-5">
        <div className="flex items-center gap-x-1.5">
          {/* <PromptInputAction
            className="duration-0 data-[state=closed]:duration-0"
            delayDuration={0}
            tooltip={
              <div className="bg-black">
                <Arrow className="fill-black" />
                <span className="text-xs font-semibold leading-none text-white">
                  Attach files
                </span>
              </div>
            }
          >
            <Button
              size="icon"
              variant="ghost"
              className="border-input bg-background text-secondary-foreground hover:bg-secondary h-9 w-9 rounded-full border p-1 text-xs font-semibold focus-visible:outline-black [&_svg]:size-[18px]"
              aria-label="Attach files"
            >
              <Plus />
            </Button>
          </PromptInputAction>
          <PromptInputAction
            className="duration-0 data-[state=closed]:duration-0"
            delayDuration={0}
            tooltip={
              <div className="bg-black">
                <Arrow className="fill-black" />
                <span className="text-xs font-semibold leading-none text-white">
                  Search the web
                </span>
              </div>
            }
          >
            <Button
              size="icon"
              variant="ghost"
              className="border-input bg-background text-secondary-foreground hover:bg-secondary h-9 w-auto rounded-full border p-2 text-xs font-semibold focus-visible:outline-black [&_svg]:size-[18px]"
              aria-label="Search the web"
            >
              <Globe />
              Search
            </Button>
          </PromptInputAction>
          <PromptInputAction
            className="duration-0 data-[state=closed]:duration-0"
            delayDuration={0}
            tooltip={
              <div className="bg-black">
                <Arrow className="fill-black" />
                <span className="text-xs font-semibold leading-none text-white">
                  View tools
                </span>
              </div>
            }
          >
            <Button
              size="icon"
              variant="ghost"
              className="border-input bg-background text-secondary-foreground hover:bg-secondary h-9 w-9 rounded-full border p-1 text-xs font-semibold focus-visible:outline-black [&_svg]:size-[18px]"
              aria-label="View tools"
            >
              <Ellipsis />
            </Button>
          </PromptInputAction> */}
        </div>
        <PromptInputAction
          className="duration-0 data-[state=closed]:duration-0"
          delayDuration={0}
          tooltip={
            <div className="bg-black">
              <Arrow className="fill-black duration-0" />
              <span className="text-xs leading-none font-semibold text-white">
                {isLoading ? "Stop generation" : "Send message"}
              </span>
            </div>
          }
        >
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9 rounded-full p-1 [&_svg]:size-6"
            disabled={isLoading || !value.trim()}
            onClick={onSubmit}
          >
            {isLoading ? <Square /> : <ArrowUp />}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
