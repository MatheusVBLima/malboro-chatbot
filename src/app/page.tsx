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
import { Fragment, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextInputUsage,
  ContextOutputUsage,
  ContextContentFooter,
} from "@/components/ai-elements/context";
import {
  GlobeIcon,
  RefreshCcwIcon,
  CopyIcon,
  CheckIcon,
  InfoIcon,
  ImageIcon,
  BotIcon,
  StopCircleIcon,
  DownloadIcon,
  PlusIcon,
  MessageSquareIcon,
  TrashIcon,
  EditIcon,
  FileTextIcon,
  FileIcon,
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { StarsBackground } from "@/components/ui/stars-background";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { Checkbox } from "@/components/ui/checkbox";

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

const suggestionPrompts = [
  "Explique como funciona a computação quântica",
  "Crie uma receita saudável com frango",
  "Qual a diferença entre React e Vue?",
  "Me ajude a escrever um e-mail profissional",
  "Sugira ideias para um projeto pessoal",
  "Como funciona o machine learning?",
];

// Tipos para histórico de conversas
type ConversationMetadata = {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
};

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [imageGeneration, setImageGeneration] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [conversations, setConversations] = useState<ConversationMetadata[]>(
    []
  );
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [showHistory, setShowHistory] = useState(false);
  const [exportOnlyAI, setExportOnlyAI] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });
  const { messages, sendMessage, status, regenerate, stop, setMessages } =
    useChat();

  // Debug: Log changes
  console.log("🔍 messages count:", messages.length);
  console.log("🔍 last message:", messages[messages.length - 1]);

  // Carregar conversas do localStorage ao iniciar
  useEffect(() => {
    const savedConversations = localStorage.getItem("conversations");
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
  }, []);

  // Salvar mensagens no localStorage quando mudarem
  useEffect(() => {
    if (messages.length > 0) {
      const conversationId =
        currentConversationId || `conv-${Date.now()}`;
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }

      localStorage.setItem(
        `conversation-${conversationId}`,
        JSON.stringify(messages)
      );

      // Atualizar metadados da conversa
      const title =
        messages[0]?.parts[0]?.type === "text"
          ? messages[0].parts[0].text.substring(0, 50)
          : "Nova conversa";

      const updatedConversations = conversations.filter(
        (c) => c.id !== conversationId
      );
      updatedConversations.unshift({
        id: conversationId,
        title,
        timestamp: Date.now(),
        messageCount: messages.length,
      });

      setConversations(updatedConversations);
      localStorage.setItem(
        "conversations",
        JSON.stringify(updatedConversations)
      );

      // Calcular tokens estimados (aproximação: 1 token ≈ 4 caracteres)
      let inputTokens = 0;
      let outputTokens = 0;

      messages.forEach((msg) => {
        const textContent = msg.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join(" ");
        const estimatedTokens = Math.ceil(textContent.length / 4);

        if (msg.role === "user") {
          inputTokens += estimatedTokens;
        } else {
          outputTokens += estimatedTokens;
        }
      });

      setTotalTokens({ input: inputTokens, output: outputTokens });
    }
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+N: Nova conversa
      if (e.ctrlKey && e.shiftKey && e.key === "N") {
        e.preventDefault();
        handleNewConversation();
      }
      // Esc: Parar geração
      if (e.key === "Escape") {
        if (status === "streaming" || status === "submitted") {
          e.preventDefault();
          stop();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, stop]);

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
  };

  const handleLoadConversation = (conversationId: string) => {
    const savedMessages = localStorage.getItem(
      `conversation-${conversationId}`
    );
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    localStorage.removeItem(`conversation-${conversationId}`);
    const updatedConversations = conversations.filter(
      (c) => c.id !== conversationId
    );
    setConversations(updatedConversations);
    localStorage.setItem("conversations", JSON.stringify(updatedConversations));

    if (currentConversationId === conversationId) {
      handleNewConversation();
    }
  };

  const removeMarkdownFormatting = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/`(.+?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, (match) => {
        // Remove code block markers but keep content
        return match.replace(/```\w*\n?/g, "");
      })
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, "• ") // Convert lists to bullets
      .replace(/^\s*\d+\.\s+/gm, "• "); // Convert numbered lists to bullets
  };

  const handleExportConversation = async (
    format: "markdown" | "txt" | "pdf",
    aiOnly: boolean = false
  ) => {
    if (format === "pdf") {
      try {
        const response = await fetch("/api/export-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            aiOnly,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao gerar PDF");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversa-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        alert("Erro ao exportar PDF. Tente novamente.");
      }
      return;
    }

    let content = "";
    let fileExtension = "";
    let mimeType = "";

    const messagesToExport = aiOnly
      ? messages.filter((msg) => msg.role === "assistant")
      : messages;

    if (format === "markdown") {
      content = messagesToExport
        .map((msg) => {
          const text = msg.parts.find((p) => p.type === "text")?.text || "";
          if (aiOnly) {
            return text;
          }
          const role = msg.role === "user" ? "**Você**" : "**Assistente**";
          return `${role}:\n${text}\n`;
        })
        .join(aiOnly ? "\n\n---\n\n" : "\n---\n\n");
      fileExtension = "md";
      mimeType = "text/markdown";
    } else {
      // Formato texto simples (compatível com Word) - sem markdown
      content = messagesToExport
        .map((msg) => {
          const text = msg.parts.find((p) => p.type === "text")?.text || "";
          let cleanText = removeMarkdownFormatting(text);
          // Remove linhas com apenas --- ou ===
          cleanText = cleanText.replace(/^[-=]{3,}\s*$/gm, "");
          // Remove múltiplas linhas vazias consecutivas
          cleanText = cleanText.replace(/\n{3,}/g, "\n\n");
          if (aiOnly) {
            return cleanText.trim();
          }
          const role = msg.role === "user" ? "VOCÊ" : "ASSISTENTE";
          return `${role}:\n${cleanText}\n`;
        })
        .join(aiOnly ? "\n\n" + "=".repeat(50) + "\n\n" : "\n" + "=".repeat(50) + "\n\n");
      fileExtension = "txt";
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversa-${Date.now()}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSingleMessage = async (
    messageText: string,
    format: "markdown" | "txt" | "pdf",
    messageRole: "user" | "assistant"
  ) => {
    if (format === "pdf") {
      try {
        const response = await fetch("/api/export-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: messageRole,
                parts: [{ type: "text", text: messageText }],
              },
            ],
            aiOnly: true, // Para mensagens individuais, não mostrar o label de papel
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao gerar PDF");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mensagem-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        alert("Erro ao exportar PDF. Tente novamente.");
      }
      return;
    }

    let content = "";
    let fileExtension = "";
    let mimeType = "";

    if (format === "markdown") {
      content = messageText;
      fileExtension = "md";
      mimeType = "text/markdown";
    } else {
      content = removeMarkdownFormatting(messageText);
      // Remove linhas com apenas --- ou ===
      content = content.replace(/^[-=]{3,}\s*$/gm, "");
      // Remove múltiplas linhas vazias consecutivas
      content = content.replace(/\n{3,}/g, "\n\n");
      content = content.trim();
      fileExtension = "txt";
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mensagem-${Date.now()}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    // Parar geração se estiver em andamento
    if (status === "streaming" || status === "submitted") {
      stop();
    }

    setEditingMessageId(messageId);
    setEditingText(currentText);
  };

  const handleSaveEdit = (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Parar qualquer geração em andamento
    if (status === "streaming" || status === "submitted") {
      stop();
    }

    // Atualizar a mensagem editada
    const updatedMessages = [...messages];
    const message = updatedMessages[messageIndex];

    if (message.parts[0]?.type === "text") {
      message.parts[0].text = editingText;
    }

    // Remover todas as mensagens após a editada
    const newMessages = updatedMessages.slice(0, messageIndex + 1);
    setMessages(newMessages);

    // Aguardar um momento antes de reenviar para garantir que o stop foi processado
    setTimeout(() => {
      sendMessage(
        { text: editingText },
        {
          body: {
            model: model,
            webSearch: webSearch,
            imageGeneration: imageGeneration,
          },
        }
      );
    }, 100);

    setEditingMessageId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

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
          {/* Header com botões de ação */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewConversation}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nova conversa (Ctrl+Shift+N)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <MessageSquareIcon className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Histórico de conversas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && totalTokens.input + totalTokens.output > 0 && (
                <Context
                  usedTokens={totalTokens.input + totalTokens.output}
                  maxTokens={1000000}
                  usage={{
                    inputTokens: totalTokens.input,
                    outputTokens: totalTokens.output,
                    totalTokens: totalTokens.input + totalTokens.output,
                  }}
                  modelId="gemini-2.0-flash"
                >
                  <ContextTrigger />
                  <ContextContent>
                    <ContextContentHeader />
                    <ContextContentBody>
                      <div className="space-y-2">
                        <ContextInputUsage />
                        <ContextOutputUsage />
                      </div>
                    </ContextContentBody>
                    <ContextContentFooter />
                  </ContextContent>
                </Context>
              )}
              {messages.length > 0 && (
                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                            <DownloadIcon className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Exportar conversa</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Exportar conversa</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={exportOnlyAI}
                      onCheckedChange={(checked) => setExportOnlyAI(checked)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      Apenas respostas da IA
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExportConversation("txt", exportOnlyAI)}>
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      <span>Texto (.txt)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportConversation("markdown", exportOnlyAI)}>
                      <FileIcon className="mr-2 h-4 w-4" />
                      <span>Markdown (.md)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportConversation("pdf", exportOnlyAI)}>
                      <FileIcon className="mr-2 h-4 w-4" />
                      <span>PDF (.pdf)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Histórico de conversas */}
          {showHistory && (
            <div className="mb-4 p-4 bg-background/50 backdrop-blur-sm rounded-lg border max-h-60 overflow-y-auto">
              <h3 className="font-semibold mb-3">Conversas anteriores</h3>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma conversa salva ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <button
                        onClick={() => handleLoadConversation(conv.id)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.timestamp).toLocaleDateString()} -{" "}
                          {conv.messageCount} mensagens
                        </p>
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(conv.id)}
                        className="p-1 hover:bg-destructive/20 rounded"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Conversation className="h-full">
            <ConversationContent>
              {/* Sugestões quando não há mensagens */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 px-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">
                      Olá! Como posso ajudar?
                    </h2>
                    <p className="text-muted-foreground">
                      Escolha uma sugestão ou digite sua pergunta
                    </p>
                  </div>
                  <div className="w-full max-w-3xl">
                    <Suggestions>
                      {suggestionPrompts.map((prompt, i) => (
                        <Suggestion
                          key={i}
                          suggestion={prompt}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </Suggestions>
                  </div>
                </div>
              )}

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
                                {/* Modo de edição para mensagens do usuário */}
                                {message.role === "user" &&
                                editingMessageId === message.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editingText}
                                      onChange={(e) =>
                                        setEditingText(e.target.value)
                                      }
                                      className="w-full p-2 border rounded-lg bg-background resize-none"
                                      rows={3}
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleSaveEdit(message.id)
                                        }
                                        className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
                                      >
                                        Salvar e reenviar
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm hover:bg-secondary/80"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </MessageContent>
                            </Message>
                            {message.role === "assistant" &&
                              i === message.parts.length - 1 &&
                              message.id ===
                                messages[messages.length - 1]?.id && (
                                <Actions className="mt-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Action
                                          onClick={() => regenerate()}
                                          label="Retry"
                                        >
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
                                      <DropdownMenuLabel>Exportar mensagem</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleExportSingleMessage(part.text, "txt", message.role as "user" | "assistant")}>
                                        <FileTextIcon className="mr-2 h-4 w-4" />
                                        <span>Texto (.txt)</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleExportSingleMessage(part.text, "markdown", message.role as "user" | "assistant")}>
                                        <FileIcon className="mr-2 h-4 w-4" />
                                        <span>Markdown (.md)</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleExportSingleMessage(part.text, "pdf", message.role as "user" | "assistant")}>
                                        <FileIcon className="mr-2 h-4 w-4" />
                                        <span>PDF (.pdf)</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                  {/* Botão de editar para mensagens do usuário */}
                  {message.role === "user" && editingMessageId !== message.id && (
                    <div className="flex w-full justify-end">
                      <Actions className="mt-1">
                        <Action
                          onClick={() => {
                            const textPart = message.parts.find(
                              (p) => p.type === "text"
                            );
                            if (textPart && textPart.type === "text") {
                              handleEditMessage(message.id, textPart.text);
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
              {(status === "streaming" || status === "submitted") && (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={stop}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                  >
                    <StopCircleIcon className="h-4 w-4" />
                    <span className="text-sm">Parar geração (Esc)</span>
                  </button>
                </div>
              )}
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
                onKeyDown={(e) => {
                  // Enter simples envia (Shift+Enter para nova linha)
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }}
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
                  <span className="hidden sm:inline">Pesquisa</span>
                </PromptInputButton>
                <PromptInputButton
                  variant={imageGeneration ? "default" : "ghost"}
                  onClick={() => setImageGeneration(!imageGeneration)}
                >
                  <ImageIcon size={16} />
                  <span className="hidden sm:inline">Imagem</span>
                </PromptInputButton>
                <div className="flex items-center gap-2">
                  {/* Desktop: Select normal */}
                  <div className="hidden sm:flex sm:items-center sm:gap-2">
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

                  {/* Mobile: Drawer com ícone de robô */}
                  <div className="sm:hidden">
                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                      <DrawerTrigger asChild>
                        <PromptInputButton variant="ghost">
                          <BotIcon size={16} />
                        </PromptInputButton>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>Selecionar Modelo</DrawerTitle>
                          <DrawerDescription>
                            Escolha o modelo de IA para sua conversa
                          </DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                          {models.map((modelOption) => (
                            <button
                              key={modelOption.value}
                              onClick={() => {
                                setModel(modelOption.value);
                                setIsDrawerOpen(false);
                              }}
                              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                model === modelOption.value
                                  ? "bg-primary/10 border-primary"
                                  : "bg-background border-border hover:bg-accent"
                              }`}
                            >
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{modelOption.name}</span>
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                    {modelOption.speed}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {modelOption.description}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                  {modelOption.capabilities.map((cap, i) => (
                                    <span
                                      key={i}
                                      className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <button className="w-full p-2 border rounded-lg bg-background hover:bg-accent transition-colors">
                              Fechar
                            </button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </div>
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
