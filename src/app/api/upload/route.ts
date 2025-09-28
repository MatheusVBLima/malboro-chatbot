import { NextRequest, NextResponse } from "next/server";
import { setFile, getFile, cleanupOldFiles } from "@/lib/file-cache";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo encontrado" },
        { status: 400 }
      );
    }

    // Verificar tamanho do arquivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 10MB." },
        { status: 400 }
      );
    }

    // Gerar ID único para o arquivo
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Converter arquivo para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Armazenar no cache (sem processamento - deixar para o AI SDK)
    setFile(fileId, {
      name: file.name,
      type: file.type,
      size: file.size,
      data: buffer,
      uploadedAt: Date.now(),
    });

    // Limpar arquivos antigos
    cleanupOldFiles();

    return NextResponse.json({
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: `/api/file/${fileId}`,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para recuperar arquivo
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("id");

  if (!fileId) {
    return NextResponse.json(
      { error: "ID do arquivo não fornecido" },
      { status: 400 }
    );
  }

  const file = getFile(fileId);
  if (!file) {
    return NextResponse.json(
      { error: "Arquivo não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: fileId,
    name: file.name,
    type: file.type,
    size: file.size,
    data: file.data.toString("base64"),
  });
}
