"use client";

import { useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { StarsBackground } from "@/components/ui/stars-background";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  ChatHeader,
  ChatInput,
  ConversationHistory,
  EmptyState,
  ExportDialog,
  MessageList,
} from "@/components/chat";
import {
  useConversationHistory,
  useChatExport,
  useMessageEdit,
  useKeyboardShortcuts,
  useTokenCounter,
} from "@/hooks";
import { DEFAULT_MODEL } from "@/lib/constants";
import type { ChatStatus } from "@/types/chat";

export default function ChatPage() {
  // UI state
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [webSearch, setWebSearch] = useState(false);
  const [imageGeneration, setImageGeneration] = useState(false);

  // Chat hook from AI SDK
  const { messages, sendMessage, status, regenerate, stop, setMessages } =
    useChat();

  // Custom hooks
  const {
    conversations,
    showHistory,
    setShowHistory,
    handleNewConversation,
    handleLoadConversation,
    handleDeleteConversation,
  } = useConversationHistory({ messages, setMessages });

  const {
    exportOnlyAI,
    setExportOnlyAI,
    showExportDialog,
    setShowExportDialog,
    exportFileName,
    setExportFileName,
    pendingExport,
    handleExportConversation,
    handleExportSingleMessage,
    handleConfirmExport,
  } = useChatExport();

  const chatOptions = {
    model,
    webSearch,
    imageGeneration,
  };

  const {
    editingMessageId,
    editingText,
    setEditingText,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
  } = useMessageEdit({
    messages,
    setMessages,
    status: status as ChatStatus,
    stop,
    sendMessage,
    chatOptions,
  });

  const { totalTokens } = useTokenCounter({ messages });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    status: status as ChatStatus,
    stop,
    onNewConversation: handleNewConversation,
  });

  // Handlers
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      sendMessage(
        {
          text: message.text || "Sent with attachments",
          files: message.files,
        },
        {
          body: chatOptions,
        }
      );
      setInput("");
    },
    [sendMessage, chatOptions]
  );

  const handleConfirmExportClick = useCallback(() => {
    handleConfirmExport(messages);
  }, [handleConfirmExport, messages]);

  return (
    <ErrorBoundary>
      <StarsBackground className="fixed inset-0 z-0" />
      <ShootingStars className="fixed inset-0 z-0" />

      <div className="max-w-7xl mx-auto p-6 relative size-full h-screen">
        <div className="flex flex-col h-full relative z-10">
          <ChatHeader
            messagesCount={messages.length}
            totalTokens={totalTokens}
            showHistory={showHistory}
            exportOnlyAI={exportOnlyAI}
            onNewConversation={handleNewConversation}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onExportOnlyAIChange={setExportOnlyAI}
            onExportConversation={handleExportConversation}
          />

          {showHistory && (
            <ConversationHistory
              conversations={conversations}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          )}

          <Conversation className="h-full">
            <ConversationContent>
              {messages.length === 0 ? (
                <EmptyState onSuggestionClick={handleSuggestionClick} />
              ) : (
                <MessageList
                  messages={messages}
                  status={status as ChatStatus}
                  imageGeneration={imageGeneration}
                  editingMessageId={editingMessageId}
                  editingText={editingText}
                  onEditingTextChange={setEditingText}
                  onEditMessage={handleEditMessage}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onRegenerate={regenerate}
                  onStop={stop}
                  onExportSingleMessage={handleExportSingleMessage}
                />
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <ChatInput
            input={input}
            model={model}
            webSearch={webSearch}
            imageGeneration={imageGeneration}
            status={status as ChatStatus}
            onInputChange={setInput}
            onModelChange={setModel}
            onWebSearchToggle={() => setWebSearch(!webSearch)}
            onImageGenerationToggle={() => setImageGeneration(!imageGeneration)}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        pendingExport={pendingExport}
        fileName={exportFileName}
        onFileNameChange={setExportFileName}
        onConfirm={handleConfirmExportClick}
      />
    </ErrorBoundary>
  );
}
