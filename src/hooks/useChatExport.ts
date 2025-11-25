"use client";

import { useState, useCallback } from "react";
import type { UIMessage } from "ai";
import type { ExportFormat, PendingExport } from "@/types/chat";

type UseChatExportReturn = {
  exportOnlyAI: boolean;
  setExportOnlyAI: (value: boolean) => void;
  showExportDialog: boolean;
  setShowExportDialog: (show: boolean) => void;
  exportFileName: string;
  setExportFileName: (name: string) => void;
  pendingExport: PendingExport | null;
  handleExportConversation: (format: ExportFormat, aiOnly?: boolean) => void;
  handleExportSingleMessage: (
    messageText: string,
    format: ExportFormat,
    messageRole: "user" | "assistant"
  ) => void;
  handleConfirmExport: (messages: UIMessage[]) => Promise<void>;
};

// Utility function to remove markdown formatting
function removeMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.+?)\*/g, "$1") // Remove italic
    .replace(/`(.+?)`/g, "$1") // Remove inline code
    .replace(/```[\s\S]*?```/g, (match) => {
      // Remove code block markers but keep content
      return match.replace(/```\w*\n?/g, "");
    })
    .replace(/#{1,6}\s+/g, "") // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/^\s*[-*+]\s+/gm, "• ") // Convert lists to bullets
    .replace(/^\s*\d+\.\s+/gm, "• "); // Convert numbered lists to bullets
}

export function useChatExport(): UseChatExportReturn {
  const [exportOnlyAI, setExportOnlyAI] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState("");
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null);

  const handleExportConversation = useCallback(
    (format: ExportFormat, aiOnly: boolean = false) => {
      setPendingExport({ format, aiOnly });
      setExportFileName("");
      setShowExportDialog(true);
    },
    []
  );

  const handleExportSingleMessage = useCallback(
    (
      messageText: string,
      format: ExportFormat,
      messageRole: "user" | "assistant"
    ) => {
      setPendingExport({ format, messageText, messageRole });
      setExportFileName("");
      setShowExportDialog(true);
    },
    []
  );

  const executeExportConversation = useCallback(
    async (messages: UIMessage[]) => {
      if (!pendingExport) return;

      const { format, aiOnly = false } = pendingExport;
      const fileName = exportFileName.trim() || `conversa-${Date.now()}`;

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
              title: fileName,
            }),
          });

          if (!response.ok) {
            throw new Error("Erro ao gerar PDF");
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Erro ao exportar PDF:", error);
          alert("Erro ao exportar PDF. Tente novamente.");
        }
        setShowExportDialog(false);
        setPendingExport(null);
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
            const textPart = msg.parts.find((p) => p.type === "text");
            const text = textPart && textPart.type === "text" ? textPart.text : "";
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
        // Plain text format (Word compatible) - no markdown
        content = messagesToExport
          .map((msg) => {
            const textPart = msg.parts.find((p) => p.type === "text");
            const text = textPart && textPart.type === "text" ? textPart.text : "";
            let cleanText = removeMarkdownFormatting(text);
            // Remove lines with only --- or ===
            cleanText = cleanText.replace(/^[-=]{3,}\s*$/gm, "");
            // Remove multiple consecutive empty lines
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
      a.download = `${fileName}.${fileExtension}`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
      setPendingExport(null);
    },
    [pendingExport, exportFileName]
  );

  const executeExportSingleMessage = useCallback(async () => {
    if (!pendingExport || !pendingExport.messageText || !pendingExport.messageRole)
      return;

    const { format, messageText, messageRole } = pendingExport;
    const fileName = exportFileName.trim() || `mensagem-${Date.now()}`;

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
            aiOnly: true,
            title: fileName,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao gerar PDF");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        alert("Erro ao exportar PDF. Tente novamente.");
      }
      setShowExportDialog(false);
      setPendingExport(null);
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
      // Remove lines with only --- or ===
      content = content.replace(/^[-=]{3,}\s*$/gm, "");
      // Remove multiple consecutive empty lines
      content = content.replace(/\n{3,}/g, "\n\n");
      content = content.trim();
      fileExtension = "txt";
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
    setPendingExport(null);
  }, [pendingExport, exportFileName]);

  const handleConfirmExport = useCallback(
    async (messages: UIMessage[]) => {
      if (pendingExport?.messageText) {
        await executeExportSingleMessage();
      } else {
        await executeExportConversation(messages);
      }
    },
    [pendingExport, executeExportSingleMessage, executeExportConversation]
  );

  return {
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
  };
}

