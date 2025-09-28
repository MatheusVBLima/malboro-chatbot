// Cache compartilhado para arquivos temporários
export interface CachedFile {
  name: string;
  type: string;
  size: number;
  data: Buffer;
  uploadedAt: number;
  extractedText?: string; // Para PDFs - texto extraído
}

// Cache em memória global
const fileCache = new Map<string, CachedFile>();

export function setFile(id: string, file: CachedFile) {
  fileCache.set(id, file);
}

export function getFile(id: string): CachedFile | undefined {
  return fileCache.get(id);
}

export function deleteFile(id: string): boolean {
  return fileCache.delete(id);
}

export function cleanupOldFiles() {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();

  for (const [id, file] of fileCache.entries()) {
    if (now - file.uploadedAt > oneHour) {
      fileCache.delete(id);
    }
  }
}

export function getAllFiles(): Map<string, CachedFile> {
  return fileCache;
}