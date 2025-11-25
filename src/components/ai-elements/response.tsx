"use client";

import { MarkdownRenderer } from "@/components/markdown/streamdown";
import { type ComponentProps, memo } from "react";
import { Streamdown, type MermaidErrorComponentProps } from "streamdown";

type ResponseProps = ComponentProps<typeof MarkdownRenderer>;

// Componente de erro customizado para Mermaid que mostra loading durante streaming
const MermaidErrorHandler = ({ error, chart }: MermaidErrorComponentProps) => {
  // Se o erro indica parsing incompleto (comum durante streaming), mostra loading
  const isParsingError = error.includes("Parse error");

  if (isParsingError) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-center gap-3">
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">
          Gerando diagrama...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-600">{error}</p>
    </div>
  );
};

export const Response = memo(
  ({ className, isAnimating, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      isAnimating={isAnimating}
      mermaid={{
        errorComponent: MermaidErrorHandler,
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isAnimating === nextProps.isAnimating
);

Response.displayName = "Response";
