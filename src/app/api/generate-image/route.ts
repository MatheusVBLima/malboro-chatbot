import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se as variáveis de ambiente estão configuradas
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

    if (!projectId) {
      return NextResponse.json(
        { error: "GOOGLE_CLOUD_PROJECT_ID não configurado. Adicione GOOGLE_CLOUD_PROJECT_ID ao seu .env.local" },
        { status: 500 }
      );
    }

    console.log("🎨 Gerando imagem com prompt:", prompt);

    // Usar a API REST do Vertex AI diretamente
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    // Preparar dados para Imagen
    const requestData = {
      instances: [
        {
          prompt: prompt,
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };

    // Obter token de acesso - suporte para localhost e produção
    let accessToken;
    try {
      const { GoogleAuth } = require('google-auth-library');

      // Para produção (Vercel): usar variáveis de ambiente
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const authClient = await auth.getClient();
        const tokenResponse = await authClient.getAccessToken();
        accessToken = tokenResponse.token;
      }
      // Para localhost: usar arquivo JSON
      else {
        const auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const authClient = await auth.getClient();
        const tokenResponse = await authClient.getAccessToken();
        accessToken = tokenResponse.token;
      }
    } catch (authError) {
      console.error("Erro de autenticação:", authError);
      return NextResponse.json(
        { error: "Erro de autenticação. Configure GOOGLE_APPLICATION_CREDENTIALS (localhost) ou GOOGLE_SERVICE_ACCOUNT_KEY (produção)" },
        { status: 401 }
      );
    }

    // Fazer requisição para a API do Vertex AI usando Bearer token
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Vertex AI:", errorText);
      return NextResponse.json(
        { error: `Erro da API Vertex AI: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!result.predictions || result.predictions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma imagem foi gerada" },
        { status: 500 }
      );
    }

    // Extrair a imagem gerada
    const prediction = result.predictions[0];
    const base64Image = prediction.bytesBase64Encoded;
    const mimeType = "image/png";

    console.log("✅ Imagem gerada com sucesso");

    return NextResponse.json({
      success: true,
      image: {
        data: base64Image,
        mimeType: mimeType,
        dataUrl: `data:${mimeType};base64,${base64Image}`,
      },
      prompt: prompt,
      model: "imagen-3.0-generate-001",
    });
  } catch (error) {
    console.error("❌ Erro na geração de imagem:", error);

    // Tratamento de erros específicos
    if (error instanceof Error) {
      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "Cota de geração de imagens esgotada" },
          { status: 429 }
        );
      }
      if (error.message.includes("authentication")) {
        return NextResponse.json(
          { error: "Erro de autenticação do Google Cloud" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}