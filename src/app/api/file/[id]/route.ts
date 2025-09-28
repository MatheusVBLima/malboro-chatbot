import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/file-cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;

    if (!fileId) {
      return NextResponse.json({ error: "ID do arquivo não fornecido" }, { status: 400 });
    }

    const file = getFile(fileId);
    if (!file) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    // Retornar arquivo com headers apropriados
    return new NextResponse(file.data as unknown as BodyInit, {
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
        'Content-Disposition': `inline; filename="${file.name}"`,
      },
    });

  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}