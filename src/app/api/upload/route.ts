import { NextRequest, NextResponse } from "next/server";
import { setFile, getFile, cleanupOldFiles } from "@/lib/file-cache";
import { put } from "@vercel/blob";

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

    // Armazenar no cache em memória (útil para desenvolvimento/local)
    const cached = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: buffer,
      uploadedAt: Date.now(),
      storage: "memory" as "memory" | "blob",
      blobKey: null as string | null,
      blobUrl: null as string | null,
      fallbackUrl: `/api/file/${fileId}`,
    };

    setFile(fileId, cached);

    const fallbackUrl = `/api/file/${fileId}`;
    let publicUrl = fallbackUrl;
    let storage: "blob" | "memory" = "memory";
    let blobKey: string | null = null;

    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    console.log("📦 Upload config:", {
      hasBlobToken,
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    if (hasBlobToken) {
      try {
        const safeName = file.name?.replace(/[^a-zA-Z0-9_.-]+/g, "_") || "file";
        blobKey = `uploads/${fileId}-${safeName}`;
        const blob = await put(blobKey, buffer, {
          access: "public",
          contentType: file.type || "application/octet-stream",
          addRandomSuffix: true, // Previne sobrescrita acidental
          cacheControlMaxAge: 3600, // 1 hora de cache (mínimo 60s)
        });
        publicUrl = blob.url;
        storage = "blob";
        cached.storage = "blob";
        cached.blobKey = blobKey;
        cached.blobUrl = publicUrl;
        console.log("✅ Arquivo salvo no Vercel Blob", { fileId, blobKey });
      } catch (blobError) {
        console.error(
          "❌ Falha ao salvar no Vercel Blob. Usando fallback em memória.",
          blobError
        );
      }
    }

    // Cleanup em background (não bloqueia a resposta)
    cleanupOldFiles().catch(error =>
      console.error("Erro no cleanup:", error)
    );

    const responseData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      storage,
      blobKey,
      blobUrl: storage === "blob" ? publicUrl : null,
      fallbackUrl,
    };
    console.log("✅ Upload response:", { ...responseData, url: responseData.url?.substring(0, 50) + "..." });
    return NextResponse.json(responseData);
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
