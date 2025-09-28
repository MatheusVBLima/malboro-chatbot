# AI Chatbot com Gemini

Um chatbot avançado construído com Next.js 15, AI SDK v5 e modelos Gemini do Google.

## Recursos

- ✅ **Modelos Gemini**: Suporte completo para Gemini 2.5 Pro, Flash, 2.0 Flash e 1.5 Pro/Flash
- ✅ **Reasoning**: Visualização do processo de raciocínio da IA
- ✅ **Tools/Ferramentas**: Calculadora, analisador de código e pesquisa web
- ✅ **Upload de Arquivos**: Suporte para upload e análise de imagens e documentos
- ✅ **Interface Moderna**: UI responsiva com shadcn/ui e Tailwind CSS
- ✅ **Streaming**: Respostas em tempo real com streaming
- ✅ **Multi-idioma**: Interface em português brasileiro

## Configuração

### 1. Clone o projeto

```bash
git clone <your-repo-url>
cd ai-chatbot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as API Keys

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Google AI API Key for Gemini (OBRIGATÓRIO)
GOOGLE_GENERATIVE_AI_API_KEY=sua_gemini_api_key_aqui

# Tavily API Key for Web Search (OPCIONAL - para pesquisa web real)
TAVILY_API_KEY=sua_tavily_api_key_aqui
```

#### Para obter as API keys:

**Gemini (Obrigatório):**

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie uma nova API key
3. Copie e cole no arquivo `.env.local`

**Tavily (Opcional - para pesquisa web real):**

1. Acesse [Tavily.com](https://tavily.com)
2. Crie uma conta gratuita (1.000 pesquisas/mês)
3. Obtenha sua API key no dashboard
4. Adicione no arquivo `.env.local`

> **Nota:** Sem a Tavily API key, o chatbot informará que não tem acesso à pesquisa web em tempo real e usará o conhecimento interno do Gemini.

### 4. Execute o projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Funcionalidades

### Tools Disponíveis

1. **Calculadora**: Realize cálculos matemáticos

   - Exemplo: "Calcule 25 \* 4 + 10"

2. **Analisador de Código**: Analise snippets de código

   - Exemplo: "Analise este código JavaScript: function hello() { return 'world'; }"

3. **Pesquisa Web**: Pesquise informações atualizadas (quando ativada)
   - Clique no botão "Search" para ativar
   - **Grátis**: 1.000 pesquisas/mês com Tavily API
   - Exemplo: "Pesquise as últimas notícias sobre IA"

### Upload de Arquivos

- Arraste e solte arquivos na área do chat
- Clique no botão "+" para selecionar arquivos
- Suporte para imagens e documentos
- Cole imagens diretamente da área de transferência

### Reasoning

- Veja como a IA "pensa" antes de responder
- Processo de raciocínio expandível/colapsável
- Útil para entender decisões complexas

## Tecnologias

- **Next.js 15**: Framework React com App Router
- **AI SDK v5**: SDK oficial da Vercel para IA
- **Google AI SDK**: Integração com modelos Gemini
- **shadcn/ui**: Componentes UI modernos
- **Tailwind CSS**: Estilização utilitária
- **TypeScript**: Tipagem estática
- **Zod**: Validação de esquemas

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/chat/route.ts    # API endpoint para chat
│   ├── layout.tsx           # Layout principal
│   └── page.tsx            # Página principal do chat
├── components/
│   ├── ai-elements/        # Componentes específicos da IA
│   └── ui/                 # Componentes UI base
└── lib/
    └── utils.ts            # Utilitários
```

## Personalização

### Adicionar Novos Modelos

Edite o array `models` em `src/app/page.tsx`:

```typescript
const models = [
  {
    name: "Seu Modelo",
    value: "google/seu-modelo",
  },
  // ...
];
```

### Criar Novas Tools

Adicione novas ferramentas em `src/app/api/chat/route.ts`:

```typescript
const suaNovaToolTool = tool({
  description: "Descrição da sua tool",
  parameters: z.object({
    parametro: z.string().describe("Descrição do parâmetro"),
  }),
  execute: async ({ parametro }) => {
    // Lógica da sua tool
    return { resultado: "seu resultado" };
  },
});
```

## Deploy

### Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório na [Vercel](https://vercel.com)
3. Configure a variável de ambiente `GOOGLE_GENERATIVE_AI_API_KEY`
4. Deploy automático!

### Outras Plataformas

Configure a variável de ambiente `GOOGLE_GENERATIVE_AI_API_KEY` na plataforma escolhida.

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se sua API key está configurada corretamente
2. Consulte a [documentação do AI SDK](https://sdk.vercel.ai/)
3. Abra uma issue no repositório

---

Feito com ❤️ usando AI SDK v5 e Gemini
