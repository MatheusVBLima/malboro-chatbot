"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Actions, Action } from "@/components/ai-elements/actions";
import { Fragment, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import {
  GlobeIcon,
  RefreshCcwIcon,
  CopyIcon,
  CheckIcon,
  InfoIcon,
  ImageIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Badge } from "@/components/ui/badge";
import { StarsBackground } from "@/components/ui/stars-background";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import { ShootingStars } from "@/components/ui/shooting-stars";

const models = [
  {
    name: "Gemini 2.5 Pro",
    value: "google/gemini-2.5-pro",
    description:
      "Modelo profissional mais avançado com maior capacidade de raciocínio e análise. Suporte completo multimodal.",
    capabilities: ["Texto", "Imagens", "Áudio", "Vídeo", "Documentos"],
    speed: "Mais lento",
  },
  {
    name: "Gemini 2.5 Flash",
    value: "google/gemini-2.5-flash",
    description:
      "Versão otimizada para velocidade mantendo alta qualidade. Suporte multimodal completo.",
    capabilities: ["Texto", "Imagens", "Áudio", "Documentos"],
    speed: "Rápido",
  },
  {
    name: "Gemini 2.5 Flash Lite",
    value: "google/gemini-2.5-flash-lite",
    description:
      "Versão leve e econômica, focada principalmente em texto com suporte básico a imagens.",
    capabilities: ["Texto", "Imagens básicas"],
    speed: "Muito rápido",
  },
  {
    name: "Gemini 2.0 Flash",
    value: "google/gemini-2.0-flash",
    description:
      "Modelo mais recente com suporte a texto, imagens, áudio e vídeo. Ideal para tarefas multimodais complexas.",
    capabilities: ["Texto", "Imagens", "Áudio", "Vídeo"],
    speed: "Rápido",
  },
  {
    name: "Gemini 2.0 Flash Lite",
    value: "google/gemini-2.0-flash-lite",
    description:
      "Versão compacta ideal para tarefas simples de texto e processamento rápido.",
    capabilities: ["Texto"],
    speed: "Muito rápido",
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [imageGeneration, setImageGeneration] = useState(false);
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const { messages, sendMessage, status, regenerate } = useChat();

  // Debug: Log changes
  console.log("🔍 messages count:", messages.length);
  console.log("🔍 last message:", messages[messages.length - 1]);

  const handleSubmit = (message: PromptInputMessage) => {
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
        body: {
          model: model,
          webSearch: webSearch,
          imageGeneration: imageGeneration,
        },
      }
    );
    setInput("");
  };

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    // Adicionar o messageId ao conjunto de copiados
    setCopiedMessageIds((prev) => new Set(prev).add(messageId));

    // Remover o feedback após 2 segundos
    setTimeout(() => {
      setCopiedMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }, 2000);
  };

  return (
    <>
      <StarsBackground className="fixed inset-0 z-0" />
      <ShootingStars className="fixed inset-0 z-0" />
      <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
        <div className="flex flex-col h-full relative z-10">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === "assistant" &&
                    message.parts.filter((part) => part.type === "source-url")
                      .length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              (part) => part.type === "source-url"
                            ).length
                          }
                        />
                        {message.parts
                          .filter((part) => part.type === "source-url")
                          .map((part, i) => (
                            <SourcesContent key={`${message.id}-${i}`}>
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            </SourcesContent>
                          ))}
                      </Sources>
                    )}
                  {message.parts.map((part, i) => {
                    console.log("🔍 Processing part:", {
                      type: part.type,
                      hasUrl: !!(part as any).url,
                      urlPreview: (part as any).url?.substring(0, 50),
                    });
                    switch (part.type) {
                      case "file":
                        // Processar imagens geradas pelo Gemini multimodal
                        const filePart = part as any;
                        if (
                          filePart.url &&
                          filePart.url.startsWith("data:image/")
                        ) {
                          console.log(
                            "🖼️ Imagem encontrada como file part do Gemini!"
                          );
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
                      case "text":
                        // Procurar por marcador de imagem no texto
                        let displayText = part.text;
                        let imageData = null;

                        const imageMatch = part.text.match(
                          /\[AI_SDK_IMAGE:(data:image\/[^;]+;base64,[^\]]+)\]/
                        );
                        if (imageMatch) {
                          imageData = { dataUrl: imageMatch[1] };
                          displayText = part.text
                            .replace(/\[AI_SDK_IMAGE:[^\]]+\]/, "")
                            .trim();
                          console.log(
                            "🖼️ Imagem encontrada no texto via AI SDK!"
                          );
                        }

                        console.log("🖼️ Text processing:", {
                          hasMatch: !!imageMatch,
                          hasImageData: !!imageData,
                          textLength: part.text.length,
                          textPreview: part.text.substring(0, 200),
                          containsMarker: part.text.includes("[AI_SDK_IMAGE:"),
                        });

                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{displayText}</Response>
                                {/* Renderizar imagem se extraída do texto */}
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
                              </MessageContent>
                            </Message>
                            {message.role === "assistant" &&
                              i === message.parts.length - 1 &&
                              message.id ===
                                messages[messages.length - 1]?.id && (
                                <Actions className="mt-2">
                                  <Action
                                    onClick={() => regenerate()}
                                    label="Retry"
                                  >
                                    <RefreshCcwIcon className="size-3" />
                                  </Action>
                                  <Action
                                    onClick={() =>
                                      handleCopy(
                                        part.text,
                                        `${message.id}-${i}`
                                      )
                                    }
                                    label={
                                      copiedMessageIds.has(`${message.id}-${i}`)
                                        ? "Copied!"
                                        : "Copy"
                                    }
                                  >
                                    {copiedMessageIds.has(
                                      `${message.id}-${i}`
                                    ) ? (
                                      <CheckIcon className="size-3" />
                                    ) : (
                                      <CopyIcon className="size-3" />
                                    )}
                                  </Action>
                                </Actions>
                              )}
                          </Fragment>
                        );
                      case "reasoning":
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
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        // Handle tool calls that start with 'tool-'
                        if (
                          part.type.startsWith("tool-") &&
                          "state" in part &&
                          "input" in part
                        ) {
                          return (
                            <Tool key={`${message.id}-${i}`} defaultOpen>
                              <ToolHeader
                                title={part.type.replace("tool-", "")}
                                type={part.type as `tool-${string}`}
                                state={part.state}
                              />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  output={part.output}
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        }
                        return null;
                    }
                  })}
                </div>
              ))}
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
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleSubmit}
            className="mt-4"
            globalDrop
            multiple
          >
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
              />
            </PromptInputBody>
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  variant={webSearch ? "default" : "ghost"}
                  onClick={() => setWebSearch(!webSearch)}
                >
                  <GlobeIcon size={16} />
                  <span>Pesquisa</span>
                </PromptInputButton>
                <PromptInputButton
                  variant={imageGeneration ? "default" : "ghost"}
                  onClick={() => setImageGeneration(!imageGeneration)}
                >
                  <ImageIcon size={16} />
                  <span>Imagem</span>
                </PromptInputButton>
                <div className="flex items-center gap-2">
                  <PromptInputModelSelect
                    onValueChange={(value) => {
                      setModel(value);
                    }}
                    value={model}
                  >
                    <PromptInputModelSelectTrigger>
                      <PromptInputModelSelectValue>
                        {models.find((m) => m.value === model)?.name ||
                          "Selecione um modelo"}
                      </PromptInputModelSelectValue>
                    </PromptInputModelSelectTrigger>
                    <PromptInputModelSelectContent>
                      {models.map((model) => (
                        <PromptInputModelSelectItem
                          key={model.value}
                          value={model.value}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-2 py-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {model.speed}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {model.description}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {model.capabilities.map((cap, i) => (
                                <span
                                  key={i}
                                  className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs"
                                >
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                        </PromptInputModelSelectItem>
                      ))}
                    </PromptInputModelSelectContent>
                  </PromptInputModelSelect>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-60 bg-primary"
                      >
                        {(() => {
                          const selectedModel = models.find(
                            (m) => m.value === model
                          );
                          if (!selectedModel) return null;

                          return (
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {selectedModel.name}
                              </p>
                              <div className="flex gap-1 flex-wrap">
                                {selectedModel.capabilities.map((cap, i) => (
                                  <Badge
                                    key={i}
                                    className="px-1.5 py-0.5 rounded text-xs"
                                    variant="secondary"
                                  >
                                    {cap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={status === "streaming"}
                status={status}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </>
  );
};

export default ChatBotDemo;
