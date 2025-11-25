"use client";

import { useState, useEffect } from "react";
import type { UIMessage } from "ai";
import type { TokenUsage } from "@/types/chat";
import { CHARS_PER_TOKEN } from "@/lib/constants";

type UseTokenCounterProps = {
  messages: UIMessage[];
};

type UseTokenCounterReturn = {
  totalTokens: TokenUsage;
};

export function useTokenCounter({
  messages,
}: UseTokenCounterProps): UseTokenCounterReturn {
  const [totalTokens, setTotalTokens] = useState<TokenUsage>({ input: 0, output: 0 });

  useEffect(() => {
    if (messages.length === 0) {
      setTotalTokens({ input: 0, output: 0 });
      return;
    }

    let inputTokens = 0;
    let outputTokens = 0;

    messages.forEach((msg) => {
      const textContent = msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ");
      const estimatedTokens = Math.ceil(textContent.length / CHARS_PER_TOKEN);

      if (msg.role === "user") {
        inputTokens += estimatedTokens;
      } else {
        outputTokens += estimatedTokens;
      }
    });

    setTotalTokens({ input: inputTokens, output: outputTokens });
  }, [messages]);

  return { totalTokens };
}

