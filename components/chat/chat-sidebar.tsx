"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { useChat } from "@/providers/chat-provider";

export function ChatSidebar() {
  const { isChatOpen } = useChat();

  if (!isChatOpen) return null;

  return (
    <SidebarInset className="w-1/5">
      <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI Chat</h2>
        </div>
        <div className="text-muted-foreground flex flex-1 items-center justify-center">
          <p>Chat functionality coming soon</p>
        </div>
        <div className="mt-auto">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Type your message..."
            type="text"
          />
        </div>
      </div>
    </SidebarInset>
  );
}
