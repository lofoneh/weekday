"use client";

import * as React from "react";

type ChatContextProps = {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
};

const ChatContext = React.createContext<ChatContextProps | null>(null);

export function useChat() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const toggleChat = React.useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      isChatOpen,
      setIsChatOpen,
      toggleChat,
    }),
    [isChatOpen, toggleChat],
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}
