"use client";

import * as React from "react";

import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

type ChatContextProps = {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
};

const ChatContext = React.createContext<ChatContextProps | null>(null);

const chatPanelAtom = atomWithStorage<boolean>("weekday_chat_panel", true);

export function useChat() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useAtom(chatPanelAtom);

  const toggleChat = React.useCallback(() => {
    setIsChatOpen((prev: boolean) => !prev);
  }, [setIsChatOpen]);

  const contextValue = React.useMemo(
    () => ({
      isChatOpen,
      setIsChatOpen,
      toggleChat,
    }),
    [isChatOpen, setIsChatOpen, toggleChat],
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}
