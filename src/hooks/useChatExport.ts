"use client"

import { useState, useCallback } from "react"
import type { UIMessage } from "ai"
import type { ExportFormat, PendingExport } from "@/types/chat"
import { htmlToPDF } from "@/lib/html-to-pdf"
import { markdownToHTML } from "@/lib/markdown-to-html"

type UseChatExportReturn = {
  exportOnlyAI: boolean
  setExportOnlyAI: (value: boolean) => void
  showExportDialog: boolean
  setShowExportDialog: (show: boolean) => void
  exportFileName: string
  setExportFileName: (name: string) => void
  pendingExport: PendingExport | null
  handleExportConversation: (format: ExportFormat, aiOnly?: boolean) => void
  handleExportSingleMessage: (messageText: string, format: ExportFormat, messageRole: "user" | "assistant") => void
  handleConfirmExport: (messages: UIMessage[]) => Promise<void>
}

export function useChatExport(): UseChatExportReturn {
  const [exportOnlyAI, setExportOnlyAI] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFileName, setExportFileName] = useState("")
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null)

  const handleExportConversation = useCallback((format: ExportFormat, aiOnly = false) => {
    setPendingExport({ format, aiOnly })
    setExportFileName("")
    setShowExportDialog(true)
  }, [])

  const handleExportSingleMessage = useCallback(
    (messageText: string, format: ExportFormat, messageRole: "user" | "assistant") => {
      setPendingExport({ format, messageText, messageRole })
      setExportFileName("")
      setShowExportDialog(true)
    },
    [],
  )

  const executeExportConversation = useCallback(
    async (messages: UIMessage[]) => {
      if (!pendingExport) return

      const { format, aiOnly = false } = pendingExport
      const fileName = exportFileName.trim() || `conversa-${Date.now()}`

      if (format === "pdf") {
        try {
          // Process messages to extract text
          const processedMessages = messages
            .filter((msg) => (aiOnly ? msg.role === "assistant" : true))
            .map((msg) => {
              const textPart = msg.parts?.find((p: any) => p.type === "text") as any
              return {
                role: msg.role,
                text: textPart?.text || "",
              }
            })
            .filter((msg) => msg.text)

          if (processedMessages.length === 0) {
            alert("Nenhuma mensagem com texto encontrada")
            setShowExportDialog(false)
            setPendingExport(null)
            return
          }

          // Generate HTML from messages
          const htmlContent = generateConversationHTML(processedMessages, {
            title: fileName,
            showUserMessages: !aiOnly,
            metadata: {
              date: new Date(),
              messageCount: processedMessages.length,
            },
          })

          // Convert HTML to PDF using html2canvas + jsPDF (client-side)
          const pdfBytes = await htmlToPDF(htmlContent, {
            format: "a4",
            orientation: "portrait",
            margin: 10, // 10mm margin
          })

          // Download PDF
          downloadPDF(pdfBytes, `${fileName}.pdf`)

          setShowExportDialog(false)
          setPendingExport(null)
          return
        } catch (error: any) {
          console.error("Erro ao exportar PDF:", error)
          alert(`Erro ao exportar PDF: ${error.message || "Erro desconhecido"}`)
          setShowExportDialog(false)
          setPendingExport(null)
          return
        }
      }

      let content = ""
      let fileExtension = ""
      let mimeType = ""

      const messagesToExport = aiOnly ? messages.filter((msg) => msg.role === "assistant") : messages

      if (format === "markdown") {
        content = messagesToExport
          .map((msg) => {
            const textPart = msg.parts.find((p) => p.type === "text")
            const text = textPart && textPart.type === "text" ? textPart.text : ""
            if (aiOnly) {
              return text
            }
            const role = msg.role === "user" ? "**Voce**" : "**Assistente**"
            return `${role}:\n${text}\n`
          })
          .join(aiOnly ? "\n\n---\n\n" : "\n---\n\n")
        fileExtension = "md"
        mimeType = "text/markdown"
      } else {
        // Plain text format (Word compatible) - strip markdown formatting
        content = messagesToExport
          .map((msg) => {
            const textPart = msg.parts.find((p) => p.type === "text")
            const text = textPart && textPart.type === "text" ? textPart.text : ""
            // Strip markdown formatting
            let cleanText = text
              .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
              .replace(/\*(.+?)\*/g, "$1") // Remove italic
              .replace(/`(.+?)`/g, "$1") // Remove inline code
              .replace(/```[\s\S]*?```/g, (match) => {
                return match.replace(/```\w*\n?/g, "")
              })
              .replace(/#{1,6}\s+/g, "") // Remove headers
              .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1") // Remove links, keep text
              .replace(/^\s*[-*+]\s+/gm, "• ") // Convert lists to bullets
              .replace(/^\s*\d+\.\s+/gm, "• ") // Convert numbered lists to bullets
            // Remove lines with only --- or ===
            cleanText = cleanText.replace(/^[-=]{3,}\s*$/gm, "")
            // Remove multiple consecutive empty lines
            cleanText = cleanText.replace(/\n{3,}/g, "\n\n")
            if (aiOnly) {
              return cleanText.trim()
            }
            const role = msg.role === "user" ? "VOCE" : "ASSISTENTE"
            return `${role}:\n${cleanText}\n`
          })
          .join(aiOnly ? "\n\n" + "=".repeat(50) + "\n\n" : "\n" + "=".repeat(50) + "\n\n")
        fileExtension = "txt"
        mimeType = "text/plain"
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${fileName}.${fileExtension}`
      a.click()
      URL.revokeObjectURL(url)
      setShowExportDialog(false)
      setPendingExport(null)
    },
    [pendingExport, exportFileName],
  )

  const executeExportSingleMessage = useCallback(async () => {
    if (!pendingExport || !pendingExport.messageText || !pendingExport.messageRole) return

    const { format, messageText, messageRole } = pendingExport
    const fileName = exportFileName.trim() || `mensagem-${Date.now()}`

    if (format === "pdf") {
      try {
        // Generate HTML from single message
        const htmlContent = generateConversationHTML(
          [
            {
              role: messageRole,
              text: messageText,
            } as any,
          ],
          {
            title: fileName,
            showUserMessages: true,
            metadata: {
              date: new Date(),
              messageCount: 1,
            },
          },
        )

        // Convert HTML to PDF using html2canvas + jsPDF (client-side)
        const pdfBytes = await htmlToPDF(htmlContent, {
          format: "a4",
          orientation: "portrait",
          margin: 10,
        })

        // Download PDF
        downloadPDF(pdfBytes, `${fileName}.pdf`)

        setShowExportDialog(false)
        setPendingExport(null)
        return
      } catch (error: any) {
        console.error("Erro ao exportar PDF:", error)
        alert(`Erro ao exportar PDF: ${error.message || "Erro desconhecido"}`)
        setShowExportDialog(false)
        setPendingExport(null)
        return
      }
    }

    let content = ""
    let fileExtension = ""
    let mimeType = ""

    if (format === "markdown") {
      content = messageText
      fileExtension = "md"
      mimeType = "text/markdown"
    } else {
      // Plain text format - strip markdown formatting
      content = messageText
        .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
        .replace(/\*(.+?)\*/g, "$1") // Remove italic
        .replace(/`(.+?)`/g, "$1") // Remove inline code
        .replace(/```[\s\S]*?```/g, (match) => {
          return match.replace(/```\w*\n?/g, "")
        })
        .replace(/#{1,6}\s+/g, "") // Remove headers
        .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1") // Remove links, keep text
        .replace(/^\s*[-*+]\s+/gm, "• ") // Convert lists to bullets
        .replace(/^\s*\d+\.\s+/gm, "• ") // Convert numbered lists to bullets
      // Remove lines with only --- or ===
      content = content.replace(/^[-=]{3,}\s*$/gm, "")
      // Remove multiple consecutive empty lines
      content = content.replace(/\n{3,}/g, "\n\n")
      content = content.trim()
      fileExtension = "txt"
      mimeType = "text/plain"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.${fileExtension}`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
    setPendingExport(null)
  }, [pendingExport, exportFileName])

  const handleConfirmExport = useCallback(
    async (messages: UIMessage[]) => {
      if (pendingExport?.messageText) {
        await executeExportSingleMessage()
      } else {
        await executeExportConversation(messages)
      }
    },
    [pendingExport, executeExportSingleMessage, executeExportConversation],
  )

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
  }
}

// Helper function to download PDF bytes
function downloadPDF(data: Uint8Array, filename: string) {
  const blob = new Blob([data as BlobPart], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function generateConversationHTML(
  messages: any[],
  options: {
    title?: string
    showUserMessages?: boolean
    metadata?: {
      date?: Date
      messageCount?: number
      chatbotName?: string
    }
  },
): string {
  const { title = "Conversa", showUserMessages = true, metadata } = options
  const chatbotName = metadata?.chatbotName || "Malboro ChatBot"

  // Convert all messages markdown to HTML
  const messagesHTML = messages
    .map((msg) => {
      const isUser = msg.role === "user"
      const roleLabel = isUser ? "Você" : "Assistente"
      const roleColor = isUser ? "#57534e" : "#44403c"

      // Convert markdown to HTML
      const htmlContent = markdownToHTML(msg.text)

      return `
      <div style="margin-bottom: 24px; padding: 20px; background: ${isUser ? "#fafaf9" : "#ffffff"}; border-radius: 12px; border: 1px solid #e7e5e4;">
        <div style="display: flex; align-items: center; margin-bottom: 12px; gap: 8px;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: ${roleColor};"></div>
          <span style="font-size: 12px; font-weight: 600; color: ${roleColor}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; letter-spacing: 0.02em;">${roleLabel}</span>
        </div>
        <div style="font-size: 14px; line-height: 1.7; word-wrap: break-word; color: #1c1917; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;">
          ${htmlContent}
        </div>
      </div>
    `
    })
    .join("\n")

  const dateStr = metadata?.date
    ? metadata.date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("pt-BR")
  const messageCount = metadata?.messageCount ?? messages.length

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: #1c1917;
      background: #ffffff;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .page-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    
    /* Hero Section */
    .hero-section {
      padding: 32px 48px;
      background: #0c0a09;
      border-bottom: 1px solid #292524;
      text-align: center;
    }

    /* Badge no estilo shadcn/ui */
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 4px 10px;
      background: #292524;
      border: 1px solid #44403c;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      color: #a8a29e;
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      line-height: 1;
      vertical-align: middle;
    }

    .badge-icon {
      width: 11px;
      height: 11px;
      fill: #78716c;
      flex-shrink: 0;
      display: block;
    }

    /* Hero title */
    .hero-title {
      font-size: 24px;
      font-weight: 600;
      color: #fafaf9;
      margin-bottom: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .hero-description {
      font-size: 13px;
      color: #78716c;
      font-weight: 400;
      max-width: 650px;
      margin: 0 auto;
      line-height: 1.5;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    }
    
    /* Clean content area */
    .conversation-container { 
      padding: 48px;
      flex: 1;
    }
    
    /* Footer */
    .footer {
      margin-top: auto;
      padding: 32px 48px;
      border-top: 1px solid #1c1917;
      background: #0c0a09;
      text-align: center;
    }
    
    .footer-content {
      color: #a8a29e;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    }
    
    .footer-content p { 
      margin: 4px 0; 
      font-weight: 500; 
    }
    
    .footer-content .date { 
      font-size: 14px;
      color: #d6d3d1; 
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .footer-content .separator { 
      color: #57534e; 
      margin: 0 8px; 
    }
    
    .footer-content .brand { 
      color: #fafaf9; 
      font-weight: 600;
    }
    
    /* Markdown elements */
    h1 { 
      font-size: 20px; 
      font-weight: 700; 
      color: #0c0a09; 
      margin: 1.5em 0 0.75em; 
      line-height: 1.3; 
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; 
      letter-spacing: -0.02em; 
    }
    h2 { 
      font-size: 18px; 
      font-weight: 700; 
      color: #0c0a09; 
      margin: 1.5em 0 0.75em; 
      line-height: 1.3; 
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; 
      letter-spacing: -0.01em; 
    }
    h3 { 
      font-size: 16px; 
      font-weight: 600; 
      color: #1c1917; 
      margin: 1.5em 0 0.75em; 
      line-height: 1.4; 
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; 
    }
    h4 { 
      font-size: 14px; 
      font-weight: 600; 
      color: #292524; 
      margin: 1.25em 0 0.5em; 
      line-height: 1.4; 
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; 
    }
    h5, h6 { 
      font-size: 13px; 
      font-weight: 600; 
      color: #44403c; 
      margin: 1.25em 0 0.5em; 
      line-height: 1.4; 
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; 
    }
    p { 
      margin: 0.75em 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; 
    }
    strong, b { font-weight: 600; color: #0c0a09; }
    em, i { font-style: italic; color: #292524; }
    a { 
      color: #57534e; 
      text-decoration: none; 
      border-bottom: 1px solid #d6d3d1;
    }
    
    ul, ol { margin: 1em 0; padding-left: 1.75em; }
    ul { list-style-type: none; }
    ul li::before {
      content: "•";
      color: #57534e;
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
    }
    ol { list-style-type: decimal; color: #57534e; }
    ol li { color: #1c1917; }
    li { margin: 0.5em 0; line-height: 1.7; }
    
    blockquote {
      margin: 1.5em 0;
      padding: 12px 16px;
      border-left: 3px solid #57534e;
      background: #f5f5f4;
      color: #44403c;
      border-radius: 0 6px 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    }
    
    code {
      font-family: 'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
      background: #f5f5f4;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      color: #1c1917;
      border: 1px solid #e7e5e4;
    }
    
    pre {
      margin: 1.5em 0;
      padding: 16px;
      background: #1c1917;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid #292524;
    }
    
    pre code {
      background: transparent;
      padding: 0;
      border: none;
      color: #fafaf9;
      font-size: 13px;
      line-height: 1.6;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5em 0;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      overflow: hidden;
    }
    
    thead {
      background: #f5f5f4;
    }
    
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e7e5e4;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    }
    
    th {
      font-weight: 600;
      color: #1c1917;
      font-size: 13px;
    }
    
    td {
      color: #292524;
      font-size: 13px;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    tbody tr:nth-child(even) {
      background: #fafaf9;
    }
    
    hr {
      border: none;
      border-top: 1px solid #e7e5e4;
      margin: 2em 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1em 0;
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="badge">
        <svg class="badge-icon" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2.5C3 2.22386 3.22386 2 3.5 2H9.08579C9.21839 2 9.34557 2.05268 9.43934 2.14645L11.8536 4.56066C11.9473 4.65443 12 4.78161 12 4.91421V12.5C12 12.7761 11.7761 13 11.5 13H3.5C3.22386 13 3 12.7761 3 12.5V2.5Z"/>
        </svg>
        Exportado
      </div>
      <h1 class="hero-title">${title}</h1>
      <p class="hero-description">Conversa gerada pelo ${chatbotName}</p>
    </div>
    
    <div class="conversation-container">
      ${messagesHTML}
    </div>
    
    <div class="footer">
      <div class="footer-content">
        <p class="date">Gerado em ${dateStr}</p>
        <p>${messageCount} mensagens <span class="separator">•</span> <span class="brand">${chatbotName}</span></p>
      </div>
    </div>
  </div>
</body>
</html>`
}
