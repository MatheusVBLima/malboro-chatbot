import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { getFile, setFile } from "@/lib/file-cache";

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
    imageGeneration,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
    imageGeneration: boolean;
  } = await req.json();

  // Processar mensagens para detectar solicitações
  const lastMessage = messages[messages.length - 1];
  const lastMessageText =
    lastMessage?.parts?.find((part) => part.type === "text")?.text || "";

  // Se o botão de geração de imagem está ativo
  if (imageGeneration && lastMessageText) {
    try {
      console.log("🎨 Gerando imagem com Gemini multimodal:", lastMessageText);

      // Usar o modelo selecionado pelo usuário (se suportar imagens) ou fallback
      let imageModel = model?.replace("google/", "") || "gemini-2.5-flash";

      // Verificar se o modelo suporta geração de imagens
      const imageCompatibleModels = [
        "gemini-2.5-flash-image-preview",
        "gemini-2.5-flash-exp",
        "gemini-2.0-flash-exp",
      ];

      if (!imageCompatibleModels.includes(imageModel)) {
        console.log(
          `⚠️ Modelo ${imageModel} não suporta imagens, usando gemini-2.5-flash-image-preview`
        );
        imageModel = "gemini-2.5-flash-image-preview";
      }

      console.log(`🎨 Usando modelo para imagens: ${imageModel}`);

      const result = await streamText({
        model: google(imageModel),
        messages: [
          {
            role: "user",
            content: `Gere uma imagem baseada nesta descrição: ${lastMessageText}`,
          },
        ],
        system:
          "Você é um assistente que gera imagens. Responda com uma descrição da imagem gerada e inclua a imagem na resposta.",
      });

      console.log("✅ Resposta do Gemini multimodal gerada");

      // Retornar o stream diretamente
      return result.toUIMessageStreamResponse({
        sendSources: false,
        sendReasoning: false,
      });
    } catch (error) {
      console.error("Erro na geração de imagem:", error);

      let errorMessage = "Houve um erro ao gerar a imagem.";
      if (error instanceof Error) {
        if (
          error.message.includes("safety") ||
          error.message.includes("filter")
        ) {
          errorMessage =
            "A imagem não pôde ser gerada devido a filtros de segurança. Tente um prompt diferente.";
        } else if (error.message.includes("No image generated")) {
          errorMessage =
            "Nenhuma imagem foi gerada. Tente reformular o prompt.";
        }
      }

      return streamText({
        model: google("gemini-2.0-flash-lite"),
        messages: [
          {
            role: "user",
            content: "Houve um erro ao gerar imagem",
          },
        ],
        system: `Responda exatamente: "${errorMessage}"`,
      }).toTextStreamResponse();
    }
  }

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
                const filePart = part as any;
                const candidateUrls: string[] = [];

                if (filePart.blobUrl) candidateUrls.push(filePart.blobUrl);
                if (filePart.uploadedUrl)
                  candidateUrls.push(filePart.uploadedUrl);
                if (filePart.url) candidateUrls.push(filePart.url);
                if (filePart.fallbackUrl)
                  candidateUrls.push(filePart.fallbackUrl);

                const fileId =
                  filePart.id ||
                  filePart.fileId ||
                  filePart.blobKey?.split("/")[0] ||
                  (filePart.url ? filePart.url.split("/").pop() : undefined);

                let cachedFile = fileId ? getFile(fileId) : undefined;

                if (!cachedFile) {
                  for (const candidate of candidateUrls) {
                    try {
                      if (!candidate) continue;

                      const targetUrl = candidate.startsWith("http")
                        ? candidate
                        : `${
                            process.env.VERCEL_URL
                              ? `https://${process.env.VERCEL_URL}`
                              : "http://localhost:3000"
                          }${candidate}`;

                      const response = await fetch(targetUrl);
                      if (!response.ok) continue;

                      const arrayBuffer = await response.arrayBuffer();
                      const contentType =
                        response.headers.get("content-type") ||
                        "application/octet-stream";
                      const filename =
                        filePart.filename ||
                        response.headers
                          .get("content-disposition")
                          ?.match(/filename="([^\"]+)"/)?.[1] ||
                        candidate.split("/").pop() ||
                        "file";

                      cachedFile = {
                        name: filename,
                        type: contentType,
                        size: arrayBuffer.byteLength,
                        data: Buffer.from(arrayBuffer),
                        uploadedAt: Date.now(),
                        storage: "memory",
                        blobKey: null,
                        blobUrl: null,
                      };
                      break;
                    } catch (fetchError) {
                      console.error(
                        "❌ Erro ao recuperar arquivo:",
                        fetchError
                      );
                    }
                  }

                  if (!cachedFile && fileId) {
                    try {
                      const { GET } = await import("@/app/api/file/[id]/route");
                      const { NextRequest } = await import("next/server");
                      const request = new NextRequest(
                        `http://localhost/api/file/${fileId}`
                      );
                      const params = Promise.resolve({ id: fileId });
                      const response = await GET(request, { params });

                      if (response.ok) {
                        const fileBuffer = await response.arrayBuffer();
                        const contentType =
                          response.headers.get("content-type") ||
                          "application/octet-stream";
                        const contentDisposition =
                          response.headers.get("content-disposition") || "";
                        const filename =
                          contentDisposition.match(
                            /filename="([^\"]+)"/
                          )?.[1] || "file";

                        cachedFile = {
                          name: filename,
                          type: contentType,
                          size: fileBuffer.byteLength,
                          data: Buffer.from(fileBuffer),
                          uploadedAt: Date.now(),
                          storage: "memory",
                          blobKey: null,
                          blobUrl: null,
                        };
                      }
                    } catch (directError) {
                      console.error(
                        "❌ Erro ao buscar arquivo diretamente:",
                        directError
                      );
                    }
                  }

                  if (fileId && cachedFile) {
                    setFile(fileId, cachedFile);
                  }
                }

                if (cachedFile) {
                  const base64Data = cachedFile.data.toString("base64");
                  return {
                    ...part,
                    url: `data:${cachedFile.type};base64,${base64Data}`,
                  };
                }

                console.error("❌ Arquivo não encontrado:", {
                  fileId,
                  candidateUrls,
                });
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
