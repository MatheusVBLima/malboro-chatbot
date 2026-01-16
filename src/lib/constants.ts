import type { ModelConfig } from "@/types/chat";

export const MODELS: ModelConfig[] = [
  {
    name: "Gemini 3 Flash",
    value: "google/gemini-3-flash-preview",
    description:
      "Modelo mais recente da Google com performance superior ao 2.5 Pro, 3x mais rápido. 78% SWE-bench, 90.4% GPQA Diamond. Contexto de 1M tokens.",
    capabilities: ["Texto", "Imagens", "Áudio", "Vídeo", "PDFs"],
    speed: "Muito rápido",
  },
  {
    name: "GLM-4.7",
    value: "zhipu/glm-4.7",
    description:
      "Modelo open-source da Zhipu AI com 355B parâmetros, contexto de 200K tokens e excelente performance em código (73.8% SWE-bench).",
    capabilities: ["Texto", "Código", "Raciocínio"],
    speed: "Rápido",
  },
  {
    name: "Gemini 2.5 Pro",
    value: "google/gemini-2.5-pro",
    description:
      "Modelo profissional mais avançado com maior capacidade de raciocínio e análise. Suporte completo multimodal.",
    capabilities: ["Texto", "Imagens", "Áudio", "Vídeo", "Documentos"],
    speed: "Mais lento",
  },
  {
    name: "Gemini 2.5 Flash",
    value: "google/gemini-2.5-flash",
    description:
      "Versão otimizada para velocidade mantendo alta qualidade. Suporte multimodal completo.",
    capabilities: ["Texto", "Imagens", "Áudio", "Documentos"],
    speed: "Rápido",
  },
  {
    name: "Gemini 2.5 Flash Lite",
    value: "google/gemini-2.5-flash-lite",
    description:
      "Versão leve e econômica, focada principalmente em texto com suporte básico a imagens.",
    capabilities: ["Texto", "Imagens básicas"],
    speed: "Muito rápido",
  },
  {
    name: "Gemini 2.0 Flash",
    value: "google/gemini-2.0-flash",
    description:
      "Modelo mais recente com suporte a texto, imagens, áudio e vídeo. Ideal para tarefas multimodais complexas.",
    capabilities: ["Texto", "Imagens", "Áudio", "Vídeo"],
    speed: "Rápido",
  },
  {
    name: "Gemini 2.0 Flash Lite",
    value: "google/gemini-2.0-flash-lite",
    description:
      "Versão compacta ideal para tarefas simples de texto e processamento rápido.",
    capabilities: ["Texto"],
    speed: "Muito rápido",
  },
];

export const DEFAULT_MODEL = MODELS[0].value;

export const SUGGESTION_PROMPTS = [
  "Explique como funciona a computação quântica",
  "Crie uma receita saudável com frango",
  "Qual a diferença entre React e Vue?",
  "Me ajude a escrever um e-mail profissional",
  "Sugira ideias para um projeto pessoal",
  "Como funciona o machine learning?",
];

export const SUGGESTION_PROMPTS_MOBILE = [
  "Explique como funciona a computação quântica",
  "Qual a diferença entre React e Vue?",
  "Como funciona o machine learning?",
];

// Storage keys
export const STORAGE_KEYS = {
  CONVERSATIONS: "conversations",
  CONVERSATION_PREFIX: "conversation-",
} as const;

// Token estimation (approximate: 1 token ≈ 4 characters)
export const CHARS_PER_TOKEN = 4;

// Max tokens for context display
export const MAX_CONTEXT_TOKENS = 1000000;

