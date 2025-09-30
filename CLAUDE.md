# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI chatbot application built with Next.js 15, AI SDK v5, and Google's Gemini models. The chatbot supports multimodal interactions (text, images, audio, documents), web search via Tavily API, reasoning visualization, conversation history, and PDF export functionality.

## Development Commands

```bash
# Development with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start
```

## Environment Variables

Required `.env.local` file:
```bash
# Required - Google AI API Key for Gemini models
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Optional - Tavily API for real-time web search (1,000 searches/month free tier)
TAVILY_API_KEY=your_tavily_api_key_here
```

## Architecture

### Core Chat Flow

1. **Frontend** (`src/app/page.tsx`): Main chatbot UI using AI SDK's `useChat()` hook
   - Manages conversation state, model selection, tool toggles (web search, image generation)
   - Handles file attachments, message editing, conversation history (localStorage)
   - Supports keyboard shortcuts (Ctrl+Shift+N for new conversation, Esc to stop generation)

2. **API Route** (`src/app/api/chat/route.ts`): Main chat endpoint
   - Processes multimodal messages with file attachments
   - Handles web search integration (Tavily API)
   - Manages image generation requests with Gemini multimodal models
   - Converts file parts to base64 for Gemini API consumption
   - Returns streaming responses with reasoning and sources

3. **File Management** (`src/lib/file-cache.ts`): In-memory file caching system
   - Stores uploaded files temporarily (1 hour TTL)
   - Supports both memory and Vercel Blob storage
   - Provides file retrieval and cleanup utilities

### API Endpoints

- `POST /api/chat` - Main chat endpoint with streaming responses
- `POST /api/upload` - File upload handler (stores in file cache)
- `GET /api/file/[id]` - File retrieval by ID
- `POST /api/export-pdf` - Conversation export to PDF using @react-pdf/renderer

### Available Gemini Models

Configured in `src/app/page.tsx`:
- `gemini-2.5-pro` - Most advanced, full multimodal (text, images, audio, video, documents)
- `gemini-2.5-flash` - Fast with multimodal support
- `gemini-2.5-flash-lite` - Lightweight, text + basic images
- `gemini-2.0-flash` - Latest with text, images, audio, video
- `gemini-2.0-flash-lite` - Fast, text-only

### Key Features

1. **File Attachments**: Files are uploaded to `/api/upload`, cached in memory, then retrieved as base64 data URLs when processing messages in chat route
2. **Web Search**: When enabled, uses Tavily API for real-time search; falls back to Gemini's internal knowledge if API unavailable
3. **Reasoning**: Gemini provides thinking process in `reasoning` message parts
4. **Conversation History**: Stored in localStorage with metadata (title, timestamp, message count)
5. **Message Editing**: Edit user messages and regenerate responses from that point
6. **Export**: Conversations/messages exportable as Markdown, TXT (Word-compatible), or PDF

### UI Components

- **AI Elements** (`src/components/ai-elements/`): Specialized components for chat UI (message, response, reasoning, sources, tool, etc.)
- **Base UI** (`src/components/ui/`): shadcn/ui components with Tailwind CSS v4
- Uses Radix UI primitives for accessible components
- Includes animated background with stars and shooting stars

### System Prompt Characteristics

The chatbot is configured to:
- Respond in Brazilian Portuguese but maintain code/technical terms in original language
- Show process of reasoning (when available)
- Include source links when using external information
- Handle medical questions (user is specified as a doctor in system prompt)
- Warn users when web search is unavailable but requested

## Code Patterns

### Adding New Tools

To add new AI tools, modify the `streamText` call in `src/app/api/chat/route.ts`. The current implementation doesn't use explicit tool definitions but could be extended with the `tool()` function from AI SDK.

### File Processing Pipeline

1. File uploaded → `/api/upload` → stored in `file-cache`
2. Message sent with file reference → `/api/chat` retrieves from cache
3. File converted to base64 data URL for Gemini API
4. Response streams back with file context included

### Token Estimation

Approximate token calculation: 1 token ≈ 4 characters (implemented in `src/app/page.tsx`)

## Important Notes

- Files are cached in memory with 1-hour TTL (cleaned up automatically)
- Web search requires Tavily API key; gracefully degrades without it
- Image generation uses specific Gemini models that support multimodal output
- TypeScript paths use `@/*` alias for `./src/*`
- Uses Next.js 15 App Router with React Server Components
- Tailwind CSS v4 with @tailwindcss/postcss
- shadcn CLI tool available via `npx shadcn@latest add`