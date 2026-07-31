# Generative UI Lab

A runnable collection of Generative UI patterns built with CopilotKit. Each
example focuses on the boundary between what an agent produces and what the
host application owns.

## Examples

| Example | Agent produces | Host owns | Status |
| --- | --- | --- | --- |
| [Controlled UI](./src/app/examples/controlled) | A typed tool call | React component, styling, and behavior | Runnable |
| [Open UI](./src/app/examples/open) | HTML, CSS, and interaction logic | Sandboxed iframe and communication bridge | Runnable |
| Declarative UI / A2UI | A schema-constrained component tree | Catalog and renderer | Planned |
| MCP Apps | A tool-linked UI resource | App host and sandbox | Planned |

The planned rows are research directions, not placeholder implementations.

## Stack

- Next.js 16 App Router and React 19
- CopilotKit Runtime v2 and React Core v2
- CopilotKit `BuiltInAgent` with a custom AG-UI stream adapter
- `@earendil-works/pi-ai` for provider catalogs, auth, and model streaming
- TypeScript, Zod, ESLint, and the React Compiler

The app registers DeepSeek, OpenAI, Anthropic, and Google through their pi-ai
provider factories. It does not implement provider URLs, request formats, or
auth resolution itself.

## Chat configuration

The chat panel lists a focused set of models:

| Provider | Models |
| --- | --- |
| DeepSeek | DeepSeek V4 Flash, DeepSeek V4 Pro |
| OpenAI | GPT-5.4 mini, GPT-5.4 |
| Anthropic | Claude Haiku 4.5, Claude Sonnet 4.6 |
| Google | Gemini 3.5 Flash, Gemini 3.1 Pro Preview |

Models are disabled until their provider has a server environment key or a
browser-session key. A browser key takes precedence for the selected provider.

### Local environment

Copy the template and add one or more provider keys:

```bash
cp .env.example .env.local
```

```dotenv
DEEPSEEK_API_KEY=your-deepseek-api-key
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

CHAT_DEFAULT_MODEL=deepseek/deepseek-v4-flash
```

`.env.local` is ignored by Git. None of these variables should use the
`NEXT_PUBLIC_` prefix.

### Vercel environment

Configure the same variables under Project Settings → Environment Variables,
or use the interactive CLI:

```bash
vercel env add DEEPSEEK_API_KEY --sensitive
vercel env add OPENAI_API_KEY --sensitive
vercel env add ANTHROPIC_API_KEY --sensitive
vercel env add GEMINI_API_KEY --sensitive
vercel env add CHAT_DEFAULT_MODEL
```

Each configured provider key immediately enables that provider's models. On a
public deployment, this lets any visitor spend against the corresponding
provider account; only configure server keys when the deployment has suitable
access control and rate limits.

### Browser session key

Each example has a **Settings** entry. A visitor can choose a provider and paste
an API key to enable its models without changing the deployment:

- keys are stored by provider in `sessionStorage`, scoped to the current tab;
- it is sent to this app in the `x-chat-api-key` request header;
- it is never written to the repository, Vercel, or a server-side store;
- closing the tab clears it.

The selected model is sent in `x-chat-model` and checked against the server
allowlist. The browser cannot supply a provider URL or arbitrary model ID.

## Run locally

Requirements: Node.js 24 and pnpm 10.

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). When
no server key is configured, open either example and use
**Settings → Provider API key**.

## Verify

```bash
pnpm check
```

This runs ESLint, TypeScript, and a production Next.js build. With the
development server running, `/api/health` reports which providers and models
are enabled without returning credential values.

## Project map

```text
src/
├── app/
│   ├── api/copilotkit/[...path]/       # Controlled runtime
│   ├── api/copilotkit-open/[...path]/  # Open UI runtime
│   ├── api/health/                     # Safe configuration status
│   └── examples/                       # Example pages
├── components/chat-runtime.tsx         # Session key and settings UI
├── features/
│   ├── controlled/
│   └── open/
└── lib/
    ├── chat.ts                         # Serializable chat contracts
    ├── copilotkit/create-agent.ts      # pi-ai → AG-UI event adapter
    ├── env.ts                          # Server/browser request config
    └── pi-models.ts                    # pi-ai providers and model allowlist
```

## References

- [CopilotKit quickstart](https://docs.copilotkit.ai/quickstart)
- [Tool-based Generative UI](https://docs.copilotkit.ai/built-in-agent/generative-ui/tool-based)
- [Open Generative UI](https://docs.copilotkit.ai/generative-ui/open-generative-ui)
- [pi-ai provider and model API](https://github.com/earendil-works/pi/tree/main/packages/ai)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
