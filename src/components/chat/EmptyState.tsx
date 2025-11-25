"use client";

import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import { SUGGESTION_PROMPTS, SUGGESTION_PROMPTS_MOBILE } from "@/lib/constants";

type EmptyStateProps = {
  onSuggestionClick: (suggestion: string) => void;
};

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Olá! Como posso ajudar?</h2>
        <p className="text-muted-foreground">
          Escolha uma sugestão ou digite sua pergunta
        </p>
      </div>
      <div className="w-full max-w-3xl">
        {/* Mobile: 3 suggestions */}
        <div className="sm:hidden">
          <Suggestions>
            {SUGGESTION_PROMPTS_MOBILE.map((prompt, i) => (
              <Suggestion
                key={i}
                suggestion={prompt}
                onClick={onSuggestionClick}
              />
            ))}
          </Suggestions>
        </div>
        {/* Desktop: 6 suggestions */}
        <div className="hidden sm:block">
          <Suggestions>
            {SUGGESTION_PROMPTS.map((prompt, i) => (
              <Suggestion
                key={i}
                suggestion={prompt}
                onClick={onSuggestionClick}
              />
            ))}
          </Suggestions>
        </div>
      </div>
    </div>
  );
}

