"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PendingExport } from "@/types/chat";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingExport: PendingExport | null;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onConfirm: () => void;
};

export function ExportDialog({
  open,
  onOpenChange,
  pendingExport,
  fileName,
  onFileNameChange,
  onConfirm,
}: ExportDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nome do arquivo</DialogTitle>
          <DialogDescription>
            Digite o nome para o arquivo{" "}
            {pendingExport?.format?.toUpperCase() || ""}. A extensão será
            adicionada automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filename">Nome do arquivo</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder={`${pendingExport?.messageText ? "mensagem" : "conversa"}-${Date.now()}`}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Exportar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

