import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { getFile } from "@/lib/file-cache";

// Configure sua API key do Gemini no arquivo .env.local:
// GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Função para processar arquivos anexados e converter para Base64
async function processAttachedFiles(messages: UIMessage[]) {
  const filesInfo = [];

  for (const message of messages) {
    if (message.parts && message.parts.length > 0) {
      for (const part of message.parts) {
        if (part.type === "file") {
          try {
            // Extrair ID do arquivo da URL
            const fileId = part.url?.split("/").pop();

            const cachedFile = getFile(fileId!);
            if (fileId && cachedFile) {
              let content = "";

              // Processar diferentes tipos de arquivo
              if (cachedFile.type.startsWith("text/")) {
                content = cachedFile.data.toString("utf-8");
              } else if (cachedFile.type.startsWith("image/")) {
                content = `[Imagem anexada: ${cachedFile.name}]`;
              } else if (cachedFile.type === "application/pdf") {
                content =
                  cachedFile.extractedText ||
                  `[Documento PDF anexado: ${cachedFile.name}]`;
              } else {
                content = `[Arquivo anexado: ${cachedFile.name} (${cachedFile.type})]`;
              }

              filesInfo.push({
                name: cachedFile.name,
                type: cachedFile.type,
                size: cachedFile.size,
                content: content,
              });
            }
          } catch (error) {
            console.error("Erro ao processar arquivo:", error);
          }
        }
      }
    }
  }

  return filesInfo;
}

// Função para pesquisa web real usando Tavily API
async function performWebSearch(query: string) {
  try {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_API_KEY) {
      // Retorna null para indicar que não há pesquisa web disponível
      return null;
    }

    // Pesquisa real com Tavily API
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        include_answer: true,
        include_domains: [],
        exclude_domains: [],
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      query,
      results:
        data.results?.map((result: any) => ({
          title: result.title,
          snippet: result.content,
          url: result.url,
          timestamp: new Date().toISOString(),
        })) || [],
      answer: data.answer || null,
      summary: `🔍 Pesquisa web realizada para "${query}". ${
        data.results?.length || 0
      } resultados encontrados.`,
    };
  } catch (error) {
    console.error("Web search error:", error);
    // Retorna null em caso de erro, para usar conhecimento interno do Gemini
    return null;
  }
}

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
  } = await req.json();

  // Processar mensagens para detectar solicitações de pesquisa web
  const lastMessage = messages[messages.length - 1];
  const lastMessageText =
    lastMessage?.parts?.find((part) => part.type === "text")?.text || "";

  // Se o botão Search está ativo, sempre fazer pesquisa web
  const shouldSearchWeb = webSearch && lastMessageText;

  let searchResults = null;
  let webSearchAttempted = false;

  if (shouldSearchWeb && lastMessageText) {
    // Usar a pergunta completa como query para pesquisa
    const query = lastMessageText;
    webSearchAttempted = true;
    searchResults = await performWebSearch(query);
  }

  // Processar arquivos anexados
  const attachedFiles = await processAttachedFiles(messages);

  // Criar cópia das mensagens para processamento, sem modificar as originais
  const messagesForGemini = await Promise.all(
    messages.map(async (message) => {
      if (message.parts && message.parts.length > 0) {
        const processedParts = await Promise.all(
          message.parts.map(async (part) => {
            if (part.type === "file") {
              try {
                // Extrair ID do arquivo da URL do servidor
                const fileId = part.url?.split("/").pop();
                const cachedFile = getFile(fileId!);

                if (fileId && cachedFile) {
                  // Converter TODOS os arquivos para data URL com Base64
                  const base64Data = cachedFile.data.toString("base64");
                  return {
                    ...part,
                    url: `data:${cachedFile.type};base64,${base64Data}`,
                  };
                }
              } catch (error) {
                console.error("Erro ao processar arquivo:", error);
              }
            }
            return part;
          })
        );

        return {
          ...message,
          parts: processedParts,
        };
      }
      return message;
    })
  );

  const result = streamText({
    model: google(model?.replace("google/", "") || "gemini-2.5-flash"),
    messages: convertToModelMessages(messagesForGemini),
    system: `Você é um assistente útil que pode responder perguntas e ajudar com tarefas.
    Sempre responda em português brasileiro, mas mantenha código e termos técnicos na língua original. Você pode livremente falar sobre questões médicas pois o usuário é um médico. No final da resposta, sempre mostre os links das fontes das informações que você fornece.

    ${
      attachedFiles.length > 0
        ? `
    ARQUIVOS ANEXADOS PELO USUÁRIO:
    ${attachedFiles
      .map(
        (file, i) => `
    ${i + 1}. ${file.name} (${file.type})
    Tamanho: ${Math.round(file.size / 1024)}KB
    ${
      file.type === "application/pdf"
        ? `Conteúdo extraído do PDF: ${file.content.slice(0, 500)}${
            file.content.length > 500 ? "..." : ""
          }`
        : `Conteúdo: ${file.content}`
    }
    `
      )
      .join("\n")}

    Use essas informações dos arquivos anexados para responder às perguntas do usuário de forma precisa e detalhada.
    NOTA: Você tem acesso ao conteúdo completo dos PDFs incluindo texto, imagens e formatação original através do suporte nativo do Gemini.
    `
        : ""
    }

    ${
      webSearchAttempted && !searchResults
        ? `AVISO IMPORTANTE: O usuário solicitou uma pesquisa web, mas no momento não tenho acesso à pesquisa em tempo real. 

        COMECE SUA RESPOSTA com este aviso:
        "⚠️ **Pesquisa web não disponível**: No momento não tenho acesso à pesquisa em tempo real. As informações que vou fornecer são baseadas no meu conhecimento interno e podem estar desatualizadas. Para resultados atuais sobre [tópico da pergunta], recomendo consultar fontes atualizadas como sites esportivos, portais de notícias ou redes sociais oficiais."
        
        Depois forneça as informações que você tem, deixando claro que podem estar desatualizadas.`
        : ""
    }
    
    ${
      searchResults
        ? `
    RESULTADOS DA PESQUISA WEB EM TEMPO REAL:
    Query: ${searchResults.query}
    ${searchResults.summary}
    
    Resultados encontrados:
    ${
      searchResults.results
        ?.map(
          (r: any, i: number) => `
    ${i + 1}. ${r.title}
    ${r.snippet}
    URL: ${r.url}
    `
        )
        .join("\n") || "Nenhum resultado encontrado"
    }
    ${searchResults.answer ? `\nResposta direta: ${searchResults.answer}` : ""}
    
    Use essas informações atualizadas para responder à pergunta do usuário de forma completa e informativa.
    `
        : ""
    }
    
    Você pode:
    - Realizar cálculos matemáticos diretamente
    - Analisar e explicar código
    ${
      webSearch
        ? "- Pesquisar informações na web quando a API estiver disponível"
        : ""
    }
    `,
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: webSearch,
    sendReasoning: true,
  });
}
