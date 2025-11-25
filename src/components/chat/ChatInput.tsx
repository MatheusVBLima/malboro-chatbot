"use client";

import { useState } from "react";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { GlobeIcon, ImageIcon, BotIcon, InfoIcon } from "lucide-react";
import { MODELS } from "@/lib/constants";
import type { ChatStatus } from "@/types/chat";

type ChatInputProps = {
  input: string;
  model: string;
  webSearch: boolean;
  imageGeneration: boolean;
  status: ChatStatus;
  onInputChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onWebSearchToggle: () => void;
  onImageGenerationToggle: () => void;
  onSubmit: (message: PromptInputMessage) => void;
};

export function ChatInput({
  input,
  model,
  webSearch,
  imageGeneration,
  status,
  onInputChange,
  onModelChange,
  onWebSearchToggle,
  onImageGenerationToggle,
  onSubmit,
}: ChatInputProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const selectedModel = MODELS.find((m) => m.value === model);

  return (
    <PromptInput onSubmit={onSubmit} className="mt-4" globalDrop multiple>
      <PromptInputBody>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputTextarea
          onChange={(e) => onInputChange(e.target.value)}
          value={input}
          onKeyDown={(e) => {
            // Simple Enter sends (Shift+Enter for new line)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const form = e.currentTarget.form;
              if (form) {
                form.requestSubmit();
              }
            }
          }}
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputButton
            variant={webSearch ? "default" : "ghost"}
            onClick={onWebSearchToggle}
          >
            <GlobeIcon size={16} />
            <span className="hidden sm:inline">Pesquisa</span>
          </PromptInputButton>

          <PromptInputButton
            variant={imageGeneration ? "default" : "ghost"}
            onClick={onImageGenerationToggle}
          >
            <ImageIcon size={16} />
            <span className="hidden sm:inline">Imagem</span>
          </PromptInputButton>

          <div className="flex items-center gap-2">
            {/* Desktop: Normal Select */}
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <PromptInputModelSelect onValueChange={onModelChange} value={model}>
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue>
                    {selectedModel?.name || "Selecione um modelo"}
                  </PromptInputModelSelectValue>
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {MODELS.map((modelOption) => (
                    <PromptInputModelSelectItem
                      key={modelOption.value}
                      value={modelOption.value}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-2 py-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{modelOption.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {modelOption.speed}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {modelOption.description}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {modelOption.capabilities.map((cap, i) => (
                            <span
                              key={i}
                              className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-60 bg-primary">
                    {selectedModel && (
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{selectedModel.name}</p>
                        <div className="flex gap-1 flex-wrap">
                          {selectedModel.capabilities.map((cap, i) => (
                            <Badge
                              key={i}
                              className="px-1.5 py-0.5 rounded text-xs"
                              variant="secondary"
                            >
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Mobile: Drawer with robot icon */}
            <div className="sm:hidden">
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <PromptInputButton variant="ghost">
                    <BotIcon size={16} />
                  </PromptInputButton>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Selecionar Modelo</DrawerTitle>
                    <DrawerDescription>
                      Escolha o modelo de IA para sua conversa
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                    {MODELS.map((modelOption) => (
                      <button
                        key={modelOption.value}
                        onClick={() => {
                          onModelChange(modelOption.value);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          model === modelOption.value
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{modelOption.name}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {modelOption.speed}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {modelOption.description}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {modelOption.capabilities.map((cap, i) => (
                              <span
                                key={i}
                                className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <button className="w-full p-2 border rounded-lg bg-background hover:bg-accent transition-colors">
                        Fechar
                      </button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </PromptInputTools>
        <PromptInputSubmit disabled={status === "streaming"} status={status} />
      </PromptInputToolbar>
    </PromptInput>
  );
}

