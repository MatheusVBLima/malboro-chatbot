"use client";

import { useEffect } from "react";
import type { ChatStatus } from "@/types/chat";

type UseKeyboardShortcutsProps = {
  status: ChatStatus;
  stop: () => void;
  onNewConversation: () => void;
};

export function useKeyboardShortcuts({
  status,
  stop,
  onNewConversation,
}: UseKeyboardShortcutsProps): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+N: New conversation
      if (e.ctrlKey && e.shiftKey && e.key === "N") {
        e.preventDefault();
        onNewConversation();
      }
      // Esc: Stop generation
      if (e.key === "Escape") {
        if (status === "streaming" || status === "submitted") {
          e.preventDefault();
          stop();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, stop, onNewConversation]);
}

