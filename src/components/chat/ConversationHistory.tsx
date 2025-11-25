"use client";

import { TrashIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConversationMetadata } from "@/types/chat";

type ConversationHistoryProps = {
  conversations: ConversationMetadata[];
  onLoadConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
};

export function ConversationHistory({
  conversations,
  onLoadConversation,
  onDeleteConversation,
}: ConversationHistoryProps) {
  return (
    <div className="mb-4 bg-background/50 backdrop-blur-sm rounded-lg border">
      <div className="p-4 pb-2">
        <h3 className="font-semibold">Conversas anteriores</h3>
      </div>
      <ScrollArea className="h-52 px-4 pb-4">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma conversa salva ainda
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <button
                  onClick={() => onLoadConversation(conv.id)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium truncate">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.timestamp).toLocaleDateString()} -{" "}
                    {conv.messageCount} mensagens
                  </p>
                </button>
                <button
                  onClick={() => onDeleteConversation(conv.id)}
                  className="p-1 hover:bg-destructive/20 rounded"
                >
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

