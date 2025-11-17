"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo, useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import type { BundledTheme } from "shiki";

type MarkdownRendererProps = ComponentProps<typeof Streamdown> & {
  /**
   * Se deve detectar automaticamente o tema dark baseado na classe .dark
   * @default true
   */
  autoDetectTheme?: boolean;
  /**
   * Tema Shiki para light mode
   * @default "github-light"
   */
  lightTheme?: BundledTheme;
  /**
   * Tema Shiki para dark mode
   * @default "github-dark"
   */
  darkTheme?: BundledTheme;
  /**
   * Prefixos de links permitidos para segurança
   * @default ["https://", "http://"]
   */
  allowedLinkPrefixes?: string[];
  /**
   * Prefixos de imagens permitidos para segurança
   * @default ["https://", "http://", "data:"]
   */
  allowedImagePrefixes?: string[];
  /**
   * Se deve parsear markdown incompleto (útil para streaming)
   * @default true
   */
  parseIncompleteMarkdown?: boolean;
  /**
   * Origem padrão para links relativos
   * @default window.location.origin (detectado automaticamente)
   */
  defaultOrigin?: string;
};

/**
 * Componente wrapper para Streamdown com configurações otimizadas
 * para uso em chatbots com streaming, segurança e suporte a dark mode.
 */
export const MarkdownRenderer = memo(
  ({
    className,
    autoDetectTheme = true,
    lightTheme = "github-light",
    darkTheme = "github-dark",
    allowedLinkPrefixes = ["https://", "http://"],
    allowedImagePrefixes = ["https://", "http://", "data:"],
    parseIncompleteMarkdown = true,
    defaultOrigin,
    ...props
  }: MarkdownRendererProps) => {
    const [isDark, setIsDark] = useState(false);
    const [origin, setOrigin] = useState<string | undefined>(defaultOrigin);

    // Detecta a origem padrão se não fornecida
    useEffect(() => {
      if (defaultOrigin) {
        setOrigin(defaultOrigin);
        return;
      }

      // Detecta automaticamente a origem do navegador
      if (typeof window !== "undefined") {
        setOrigin(window.location.origin);
      }
    }, [defaultOrigin]);

    // Detecta o tema dark automaticamente
    useEffect(() => {
      if (!autoDetectTheme) return;

      const checkDarkMode = () => {
        setIsDark(document.documentElement.classList.contains("dark"));
      };

      // Verifica inicialmente
      checkDarkMode();

      // Observa mudanças no atributo class do html
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    }, [autoDetectTheme]);

    // Determina o tema Shiki - deve ser um array [light, dark]
    const shikiTheme: [BundledTheme, BundledTheme] = [lightTheme, darkTheme];

    // Garante que temos uma origem válida antes de renderizar
    // Se não tiver origem ainda, usa um valor padrão temporário
    const effectiveOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    return (
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          // Estilos para melhorar a renderização de markdown
          "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:text-sm",
          "[&_code]:rounded [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary/80",
          "[&_img]:rounded-lg [&_img]:border [&_img]:max-w-full [&_img]:h-auto",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-4",
          "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
          "[&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2",
          "[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2",
          "[&_li]:my-1",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4",
          "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3",
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
          "[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-2",
          "[&_h5]:text-base [&_h5]:font-semibold [&_h5]:mt-2 [&_h5]:mb-1",
          "[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:mt-2 [&_h6]:mb-1",
          "[&_hr]:my-6 [&_hr]:border-t [&_hr]:border-border",
          className
        )}
        parseIncompleteMarkdown={parseIncompleteMarkdown}
        allowedLinkPrefixes={allowedLinkPrefixes}
        allowedImagePrefixes={allowedImagePrefixes}
        defaultOrigin={effectiveOrigin}
        shikiTheme={shikiTheme}
        {...props}
      />
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MarkdownRenderer.displayName = "MarkdownRenderer";

