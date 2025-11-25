"use client";

import { useState, useEffect, useCallback } from "react";
import type { UIMessage } from "ai";
import type { ConversationMetadata } from "@/types/chat";
import { STORAGE_KEYS } from "@/lib/constants";

type UseConversationHistoryProps = {
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
};

type UseConversationHistoryReturn = {
  conversations: ConversationMetadata[];
  currentConversationId: string | null;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  handleNewConversation: () => void;
  handleLoadConversation: (conversationId: string) => void;
  handleDeleteConversation: (conversationId: string) => void;
};

export function useConversationHistory({
  messages,
  setMessages,
}: UseConversationHistoryProps): UseConversationHistoryReturn {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      const conversationId = currentConversationId || `conv-${Date.now()}`;
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }

      localStorage.setItem(
        `${STORAGE_KEYS.CONVERSATION_PREFIX}${conversationId}`,
        JSON.stringify(messages)
      );

      // Update conversation metadata
      const title =
        messages[0]?.parts[0]?.type === "text"
          ? (messages[0].parts[0] as { type: "text"; text: string }).text.substring(0, 50)
          : "Nova conversa";

      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.filter(
          (c) => c.id !== conversationId
        );
        updatedConversations.unshift({
          id: conversationId,
          title,
          timestamp: Date.now(),
          messageCount: messages.length,
        });

        localStorage.setItem(
          STORAGE_KEYS.CONVERSATIONS,
          JSON.stringify(updatedConversations)
        );

        return updatedConversations;
      });
    }
  }, [messages, currentConversationId]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, [setMessages]);

  const handleLoadConversation = useCallback(
    (conversationId: string) => {
      const savedMessages = localStorage.getItem(
        `${STORAGE_KEYS.CONVERSATION_PREFIX}${conversationId}`
      );
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
          setCurrentConversationId(conversationId);
          setShowHistory(false);
        } catch {
          // Invalid JSON, ignore
        }
      }
    },
    [setMessages]
  );

  const handleDeleteConversation = useCallback(
    (conversationId: string) => {
      localStorage.removeItem(`${STORAGE_KEYS.CONVERSATION_PREFIX}${conversationId}`);

      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.filter(
          (c) => c.id !== conversationId
        );
        localStorage.setItem(
          STORAGE_KEYS.CONVERSATIONS,
          JSON.stringify(updatedConversations)
        );
        return updatedConversations;
      });

      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    },
    [currentConversationId, handleNewConversation]
  );

  return {
    conversations,
    currentConversationId,
    showHistory,
    setShowHistory,
    handleNewConversation,
    handleLoadConversation,
    handleDeleteConversation,
  };
}

