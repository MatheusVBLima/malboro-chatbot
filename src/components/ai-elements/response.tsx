"use client";

import { MarkdownRenderer } from "@/components/markdown/streamdown";
import { type ComponentProps, memo } from "react";

type ResponseProps = ComponentProps<typeof MarkdownRenderer>;

/**
 * Componente Response otimizado para renderização de markdown em mensagens de chat.
 * Usa Streamdown com configurações avançadas para streaming, segurança e dark mode.
 */
export const Response = memo(
  (props: ResponseProps) => (
    <MarkdownRenderer {...props} />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
