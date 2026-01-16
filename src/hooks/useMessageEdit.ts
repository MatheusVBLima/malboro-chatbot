"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { UIMessage } from "ai";
import type { ChatStatus, ChatOptions } from "@/types/chat";

type UseMessageEditProps = {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  status: ChatStatus;
  stop: () => void;
  sendMessage: (
    message: { text: string },
    options: { body: ChatOptions }
  ) => void;
  chatOptions: ChatOptions;
};

type UseMessageEditReturn = {
  editingMessageId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  handleEditMessage: (messageId: string, currentText: string) => void;
  handleSaveEdit: (messageId: string) => void;
  handleCancelEdit: () => void;
};

export function useMessageEdit({
  messages,
  setMessages,
  status,
  stop,
  sendMessage,
  chatOptions,
}: UseMessageEditProps): UseMessageEditReturn {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Use ref to track editingText to avoid callback thrashing (rerender-dependencies optimization)
  // This prevents handleSaveEdit from being recreated on every keystroke
  const editingTextRef = useRef(editingText);
  useEffect(() => {
    editingTextRef.current = editingText;
  }, [editingText]);

  const handleEditMessage = useCallback(
    (messageId: string, currentText: string) => {
      // Stop generation if in progress
      if (status === "streaming" || status === "submitted") {
        stop();
      }

      setEditingMessageId(messageId);
      setEditingText(currentText);
    },
    [status, stop]
  );

  const handleSaveEdit = useCallback(
    (messageId: string) => {
      const currentEditingText = editingTextRef.current;
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Stop any ongoing generation
      if (status === "streaming" || status === "submitted") {
        stop();
      }

      // Update the edited message
      const updatedMessages = [...messages];
      const message = updatedMessages[messageIndex];

      if (message.parts[0]?.type === "text") {
        (message.parts[0] as { type: "text"; text: string }).text =
          currentEditingText;
      }

      // Remove all messages after the edited one
      const newMessages = updatedMessages.slice(0, messageIndex + 1);
      setMessages(newMessages);

      // Wait a moment before resending to ensure stop was processed
      setTimeout(() => {
        sendMessage(
          { text: currentEditingText },
          {
            body: chatOptions,
          }
        );
      }, 100);

      setEditingMessageId(null);
      setEditingText("");
    },
    [messages, setMessages, status, stop, sendMessage, chatOptions]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText("");
  }, []);

  return {
    editingMessageId,
    editingText,
    setEditingText,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
  };
}

