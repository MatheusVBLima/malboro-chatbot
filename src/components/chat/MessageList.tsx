"use client";

import { Fragment, useState, useCallback } from "react";
import type { UIMessage, ToolUIPart } from "ai";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCcwIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  StopCircleIcon,
  EditIcon,
  FileTextIcon,
  FileIcon,
} from "lucide-react";
import type { ChatStatus, ExportFormat } from "@/types/chat";

type MessageListProps = {
  messages: UIMessage[];
  status: ChatStatus;
  imageGeneration: boolean;
  editingMessageId: string | null;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onEditMessage: (messageId: string, currentText: string) => void;
  onSaveEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  onRegenerate: () => void;
  onStop: () => void;
  onExportSingleMessage: (
    messageText: string,
    format: ExportFormat,
    messageRole: "user" | "assistant"
  ) => void;
};

export function MessageList({
  messages,
  status,
  imageGeneration,
  editingMessageId,
  editingText,
  onEditingTextChange,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onRegenerate,
  onStop,
  onExportSingleMessage,
}: MessageListProps) {
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const handleCopy = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopiedMessageIds((prev) => new Set(prev).add(messageId));

    setTimeout(() => {
      setCopiedMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }, 2000);
  }, []);

  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {/* Sources for assistant messages */}
          {message.role === "assistant" &&
            message.parts.filter((part) => part.type === "source-url").length >
              0 && (
              <Sources>
                <SourcesTrigger
                  count={
                    message.parts.filter((part) => part.type === "source-url")
                      .length
                  }
                />
                {message.parts
                  .filter((part) => part.type === "source-url")
                  .map((part, i) => (
                    <SourcesContent key={`${message.id}-${i}`}>
                      <Source
                        key={`${message.id}-${i}`}
                        href={(part as { type: "source-url"; url: string }).url}
                        title={(part as { type: "source-url"; url: string }).url}
                      />
                    </SourcesContent>
                  ))}
              </Sources>
            )}

          {/* Message parts */}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "file": {
                const filePart = part as { type: "file"; url: string };
                if (filePart.url?.startsWith("data:image/")) {
                  return (
                    <Fragment key={`${message.id}-${i}`}>
                      <div className="mt-4">
                        <img
                          src={filePart.url}
                          alt="Imagem gerada pelo Gemini"
                          className="max-w-full h-auto rounded-lg border"
                          style={{ maxHeight: "400px" }}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Gerada com Gemini 2.5 Flash
                        </p>
                      </div>
                    </Fragment>
                  );
                }
                return null;
              }

              case "text": {
                const textPart = part as { type: "text"; text: string };
                let displayText = textPart.text;
                let imageData: { dataUrl: string } | null = null;

                const imageMatch = textPart.text.match(
                  /\[AI_SDK_IMAGE:(data:image\/[^;]+;base64,[^\]]+)\]/
                );
                if (imageMatch) {
                  imageData = { dataUrl: imageMatch[1] };
                  displayText = textPart.text
                    .replace(/\[AI_SDK_IMAGE:[^\]]+\]/, "")
                    .trim();
                }

                return (
                  <Fragment key={`${message.id}-${i}`}>
                    <Message from={message.role}>
                      <MessageContent>
                        {/* Edit mode for user messages */}
                        {message.role === "user" &&
                        editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingText}
                              onChange={(e) =>
                                onEditingTextChange(e.target.value)
                              }
                              className="w-full p-2 border rounded-lg bg-background resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => onSaveEdit(message.id)}
                                className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
                              >
                                Salvar e reenviar
                              </button>
                              <button
                                onClick={onCancelEdit}
                                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Response>{displayText}</Response>
                            {imageData && (
                              <div className="mt-4">
                                <img
                                  src={imageData.dataUrl}
                                  alt="Imagem gerada"
                                  className="max-w-full h-auto rounded-lg border"
                                  style={{ maxHeight: "400px" }}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Gerada com Imagen 3.0
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </MessageContent>
                    </Message>

                    {/* Actions for last assistant message */}
                    {message.role === "assistant" &&
                      i === message.parts.length - 1 &&
                      message.id === messages[messages.length - 1]?.id && (
                        <Actions className="mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Action onClick={onRegenerate} label="Retry">
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Regenerar resposta</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Action
                                  onClick={() =>
                                    handleCopy(
                                      textPart.text,
                                      `${message.id}-${i}`
                                    )
                                  }
                                  label={
                                    copiedMessageIds.has(`${message.id}-${i}`)
                                      ? "Copied!"
                                      : "Copy"
                                  }
                                >
                                  {copiedMessageIds.has(`${message.id}-${i}`) ? (
                                    <CheckIcon className="size-3" />
                                  ) : (
                                    <CopyIcon className="size-3" />
                                  )}
                                </Action>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {copiedMessageIds.has(`${message.id}-${i}`)
                                    ? "Copiado!"
                                    : "Copiar mensagem"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuTrigger asChild>
                                    <Action label="Export">
                                      <DownloadIcon className="size-3" />
                                    </Action>
                                  </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Exportar mensagem</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuLabel>
                                Exportar mensagem
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  onExportSingleMessage(
                                    textPart.text,
                                    "txt",
                                    message.role as "user" | "assistant"
                                  )
                                }
                              >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                <span>Texto (.txt)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  onExportSingleMessage(
                                    textPart.text,
                                    "markdown",
                                    message.role as "user" | "assistant"
                                  )
                                }
                              >
                                <FileIcon className="mr-2 h-4 w-4" />
                                <span>Markdown (.md)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  onExportSingleMessage(
                                    textPart.text,
                                    "pdf",
                                    message.role as "user" | "assistant"
                                  )
                                }
                              >
                                <FileIcon className="mr-2 h-4 w-4" />
                                <span>PDF (.pdf)</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Actions>
                      )}
                  </Fragment>
                );
              }

              case "reasoning": {
                const reasoningPart = part as { type: "reasoning"; text: string };
                return (
                  <Reasoning
                    key={`${message.id}-${i}`}
                    className="w-full"
                    isStreaming={
                      status === "streaming" &&
                      i === message.parts.length - 1 &&
                      message.id === messages.at(-1)?.id
                    }
                  >
                    <ReasoningTrigger />
                    <ReasoningContent>{reasoningPart.text}</ReasoningContent>
                  </Reasoning>
                );
              }

              default: {
                // Handle tool calls that start with 'tool-'
                if (
                  part.type.startsWith("tool-") &&
                  "state" in part &&
                  "input" in part
                ) {
                  const toolPart = part as {
                    type: `tool-${string}`;
                    state: ToolUIPart["state"];
                    input: unknown;
                    output?: unknown;
                    errorText?: string;
                  };
                  return (
                    <Tool key={`${message.id}-${i}`} defaultOpen>
                      <ToolHeader
                        title={toolPart.type.replace("tool-", "")}
                        type={toolPart.type}
                        state={toolPart.state}
                      />
                      <ToolContent>
                        <ToolInput input={toolPart.input} />
                        <ToolOutput
                          output={toolPart.output}
                          errorText={toolPart.errorText}
                        />
                      </ToolContent>
                    </Tool>
                  );
                }
                return null;
              }
            }
          })}

          {/* Edit button for user messages */}
          {message.role === "user" && editingMessageId !== message.id && (
            <div className="flex w-full justify-end">
              <Actions className="mt-1">
                <Action
                  onClick={() => {
                    const textPart = message.parts.find(
                      (p) => p.type === "text"
                    );
                    if (textPart && textPart.type === "text") {
                      onEditMessage(
                        message.id,
                        (textPart as { type: "text"; text: string }).text
                      );
                    }
                  }}
                  label="Editar"
                >
                  <EditIcon className="size-3" />
                </Action>
              </Actions>
            </div>
          )}
        </div>
      ))}

      {/* Loading state */}
      {status === "submitted" &&
        (imageGeneration ? (
          <Message from="assistant">
            <MessageContent>
              <ImageSkeleton />
            </MessageContent>
          </Message>
        ) : (
          <Loader />
        ))}

      {/* Stop button */}
      {(status === "streaming" || status === "submitted") && (
        <div className="flex justify-center mt-2">
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
          >
            <StopCircleIcon className="h-4 w-4" />
            <span className="text-sm">Parar geração (Esc)</span>
          </button>
        </div>
      )}
    </>
  );
}

