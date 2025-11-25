"use client";

import {
  PlusIcon,
  MessageSquareIcon,
  DownloadIcon,
  FileTextIcon,
  FileIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextInputUsage,
  ContextOutputUsage,
  ContextContentFooter,
} from "@/components/ai-elements/context";
import type { TokenUsage, ExportFormat } from "@/types/chat";
import { MAX_CONTEXT_TOKENS } from "@/lib/constants";

type ChatHeaderProps = {
  messagesCount: number;
  totalTokens: TokenUsage;
  showHistory: boolean;
  exportOnlyAI: boolean;
  onNewConversation: () => void;
  onToggleHistory: () => void;
  onExportOnlyAIChange: (checked: boolean) => void;
  onExportConversation: (format: ExportFormat, aiOnly: boolean) => void;
};

export function ChatHeader({
  messagesCount,
  totalTokens,
  showHistory,
  exportOnlyAI,
  onNewConversation,
  onToggleHistory,
  onExportOnlyAIChange,
  onExportConversation,
}: ChatHeaderProps) {
  const hasMessages = messagesCount > 0;
  const hasTokens = totalTokens.input + totalTokens.output > 0;

  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onNewConversation}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nova conversa (Ctrl+Shift+N)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleHistory}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <MessageSquareIcon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Histórico de conversas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2">
        {hasMessages && hasTokens && (
          <Context
            usedTokens={totalTokens.input + totalTokens.output}
            maxTokens={MAX_CONTEXT_TOKENS}
            usage={{
              inputTokens: totalTokens.input,
              outputTokens: totalTokens.output,
              totalTokens: totalTokens.input + totalTokens.output,
            }}
            modelId="gemini-2.0-flash"
          >
            <ContextTrigger />
            <ContextContent>
              <ContextContentHeader />
              <ContextContentBody>
                <div className="space-y-2">
                  <ContextInputUsage />
                  <ContextOutputUsage />
                </div>
              </ContextContentBody>
              <ContextContentFooter />
            </ContextContent>
          </Context>
        )}

        {hasMessages && (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                      <DownloadIcon className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar conversa</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Exportar conversa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={exportOnlyAI}
                onCheckedChange={onExportOnlyAIChange}
                onSelect={(e) => e.preventDefault()}
              >
                Apenas respostas da IA
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onExportConversation("txt", exportOnlyAI)}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                <span>Texto (.txt)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExportConversation("markdown", exportOnlyAI)}
              >
                <FileIcon className="mr-2 h-4 w-4" />
                <span>Markdown (.md)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExportConversation("pdf", exportOnlyAI)}
              >
                <FileIcon className="mr-2 h-4 w-4" />
                <span>PDF (.pdf)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

