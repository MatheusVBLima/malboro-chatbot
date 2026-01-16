"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [conversations, setConversations] = useState<ConversationMetadata[]>(
    []
  );
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [showHistory, setShowHistory] = useState(false);

  // Refs for debounced save (js-cache-function-results optimization)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef(messages);
  const conversationIdRef = useRef(currentConversationId);

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

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

  // Debounced save to localStorage (reduces writes by ~90% during streaming)
  useEffect(() => {
    if (messages.length > 0) {
      const conversationId = currentConversationId || `conv-${Date.now()}`;
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }

      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 500ms
      saveTimeoutRef.current = setTimeout(() => {
        const currentMessages = messagesRef.current;
        const currentId = conversationIdRef.current || conversationId;

        localStorage.setItem(
          `${STORAGE_KEYS.CONVERSATION_PREFIX}${currentId}`,
          JSON.stringify(currentMessages)
        );

        // Update conversation metadata
        const title =
          currentMessages[0]?.parts[0]?.type === "text"
            ? (
                currentMessages[0].parts[0] as { type: "text"; text: string }
              ).text.substring(0, 50)
            : "Nova conversa";

        setConversations((prevConversations) => {
          const updatedConversations = prevConversations.filter(
            (c) => c.id !== currentId
          );
          updatedConversations.unshift({
            id: currentId,
            title,
            timestamp: Date.now(),
            messageCount: currentMessages.length,
          });

          localStorage.setItem(
            STORAGE_KEYS.CONVERSATIONS,
            JSON.stringify(updatedConversations)
          );

          return updatedConversations;
        });
      }, 500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, currentConversationId]);

  // Save immediately on unmount to prevent data loss
  useEffect(() => {
    return () => {
      const currentMessages = messagesRef.current;
      const currentId = conversationIdRef.current;
      if (currentMessages.length > 0 && currentId) {
        localStorage.setItem(
          `${STORAGE_KEYS.CONVERSATION_PREFIX}${currentId}`,
          JSON.stringify(currentMessages)
        );
      }
    };
  }, []);

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

