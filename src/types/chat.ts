import type { UIMessage, ToolUIPart } from "ai";

// Model configuration
export type ModelConfig = {
  name: string;
  value: string;
  description: string;
  capabilities: string[];
  speed: string;
};

// Conversation metadata for history
export type ConversationMetadata = {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
};

// Export types
export type ExportFormat = "markdown" | "txt" | "pdf";

export type PendingExport = {
  format: ExportFormat;
  aiOnly?: boolean;
  messageText?: string;
  messageRole?: "user" | "assistant";
};

// Token usage tracking
export type TokenUsage = {
  input: number;
  output: number;
};

// Chat status from AI SDK
export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

// Message part types for better type safety
export type TextPart = {
  type: "text";
  text: string;
};

export type FilePart = {
  type: "file";
  url: string;
  filename?: string;
};

export type SourceUrlPart = {
  type: "source-url";
  url: string;
};

export type ReasoningPart = {
  type: "reasoning";
  text: string;
};

export type ToolPart = {
  type: `tool-${string}`;
  state: ToolUIPart["state"];
  input: unknown;
  output?: unknown;
  errorText?: string;
};

export type MessagePart = TextPart | FilePart | SourceUrlPart | ReasoningPart | ToolPart;

// Re-export UIMessage for convenience
export type { UIMessage };

// Chat options for sending messages
export type ChatOptions = {
  model: string;
  webSearch: boolean;
  imageGeneration: boolean;
};

