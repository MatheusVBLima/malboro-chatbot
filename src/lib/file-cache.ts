import { del } from "@vercel/blob";

// Cache compartilhado para arquivos temporários
export interface CachedFile {
  name: string;
  type: string;
  size: number;
  data: Buffer;
  uploadedAt: number;
  extractedText?: string; // Para PDFs - texto extraído
  storage: "memory" | "blob";
  blobKey: string | null;
  blobUrl: string | null;
  fallbackUrl?: string | null;
}

// Cache em memória global
const fileCache = new Map<string, CachedFile>();

export function setFile(id: string, file: CachedFile) {
  fileCache.set(id, file);
}

export function getFile(id: string): CachedFile | undefined {
  return fileCache.get(id);
}

export async function deleteFile(id: string): Promise<boolean> {
  const file = fileCache.get(id);

  if (file) {
    // Se arquivo estava no Blob, deletar de lá também
    if (file.storage === "blob" && file.blobKey) {
      try {
        await del(file.blobKey);
        console.log("🗑️ Arquivo deletado do Vercel Blob:", file.blobKey);
      } catch (error) {
        console.error("❌ Erro ao deletar do Blob:", error);
      }
    }
  }

  return fileCache.delete(id);
}

export async function cleanupOldFiles() {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();

  for (const [id, file] of fileCache.entries()) {
    if (now - file.uploadedAt > oneHour) {
      // Se arquivo estava no Blob, deletar de lá também
      if (file.storage === "blob" && file.blobKey) {
        try {
          await del(file.blobKey);
          console.log("🗑️ Arquivo deletado do Vercel Blob:", file.blobKey);
        } catch (error) {
          console.error("❌ Erro ao deletar do Blob:", error);
        }
      }

      // Deletar do cache local
      fileCache.delete(id);
      console.log("🗑️ Arquivo removido do cache:", id);
    }
  }
}

export function getAllFiles(): Map<string, CachedFile> {
  return fileCache;
}
