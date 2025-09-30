import { NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  messageContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
  },
  userMessage: {
    backgroundColor: "#e3f2fd",
  },
  assistantMessage: {
    backgroundColor: "#f5f5f5",
  },
  messageRole: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1976d2",
  },
  assistantRole: {
    color: "#388e3c",
  },
  messageText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
  },
  separator: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
});

// Função para remover formatação markdown
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
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links, keep text
    .replace(/^\s*[-*+]\s+/gm, "• ") // Convert lists to bullets
    .replace(/^\s*\d+\.\s+/gm, "• "); // Convert numbered lists to bullets
}

// Função para criar o documento PDF usando React.createElement
function createConversationPDF(messages: any[], aiOnly: boolean, title?: string) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, title || "Malboro ChatBot"),
      ...messages.map((msg, index) => {
        const cleanText = removeMarkdownFormatting(msg.text);
        const showRole = !aiOnly || msg.role === "user";

        return React.createElement(
          React.Fragment,
          { key: index },
          React.createElement(
            View,
            {
              style: [
                styles.messageContainer,
                msg.role === "user" ? styles.userMessage : styles.assistantMessage,
              ],
            },
            showRole && React.createElement(
              Text,
              {
                style:
                  msg.role === "assistant"
                    ? [styles.messageRole, styles.assistantRole]
                    : styles.messageRole,
              },
              msg.role === "user" ? "VOCÊ" : "ASSISTENTE"
            ),
            React.createElement(Text, { style: styles.messageText }, cleanText)
          ),
          index < messages.length - 1 &&
            React.createElement(View, { style: styles.separator })
        );
      }),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          null,
          `Gerado em ${new Date().toLocaleString("pt-BR")} • ${messages.length} ${
            messages.length === 1 ? "mensagem" : "mensagens"
          }`
        )
      )
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, aiOnly = false, title } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma mensagem fornecida" },
        { status: 400 }
      );
    }

    // Processar mensagens para extrair apenas texto
    const processedMessages = messages
      .filter((msg) => (aiOnly ? msg.role === "assistant" : true))
      .map((msg) => {
        const textPart = msg.parts?.find((p: any) => p.type === "text");
        return {
          role: msg.role,
          text: textPart?.text || "",
        };
      })
      .filter((msg) => msg.text); // Remover mensagens sem texto

    if (processedMessages.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma mensagem com texto encontrada" },
        { status: 400 }
      );
    }

    // Gerar o PDF
    const pdfDoc = createConversationPDF(processedMessages, aiOnly, title);
    const pdfStream = await pdf(pdfDoc).toBlob();

    // Retornar o PDF
    return new NextResponse(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="conversa-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}