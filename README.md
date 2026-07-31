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
- CopilotKit `BuiltInAgent` in per-request factory mode
- Vercel AI SDK 6 with an OpenAI-compatible provider
- TypeScript, Zod, ESLint, and the React Compiler

The default provider configuration targets DeepSeek. `CHAT_BASE_URL`,
`CHAT_MODEL`, and `CHAT_PROVIDER` can point the same runtime at another
OpenAI-compatible service.

## Chat configuration

Chat has two credential sources. A browser key takes precedence when both are
available.

### Local environment

Copy the template and add a key:

```bash
cp .env.example .env.local
```

```dotenv
CHAT_ENABLED=true
CHAT_API_KEY=your-deepseek-api-key
CHAT_PROVIDER=deepseek
CHAT_BASE_URL=https://api.deepseek.com
CHAT_MODEL=deepseek-v4-flash
```

`.env.local` is ignored by Git. None of these variables should use the
`NEXT_PUBLIC_` prefix.

### Vercel environment

Configure the same variables under Project Settings → Environment Variables,
or use the interactive CLI:

```bash
vercel env add CHAT_ENABLED
vercel env add CHAT_API_KEY --sensitive
vercel env add CHAT_PROVIDER
vercel env add CHAT_BASE_URL
vercel env add CHAT_MODEL
```

Set `CHAT_ENABLED=true` to make the server key the default. A public deployment
with server chat enabled lets any visitor spend against that provider account;
keep it disabled unless the deployment has suitable access control and rate
limits.

### Browser session key

Each example has a **Settings** entry. A visitor can paste an API key to enable
chat without changing the deployment:

- the key is stored in `sessionStorage`, scoped to the current browser tab;
- it is sent to this app in the `x-chat-api-key` request header;
- it is never written to the repository, Vercel, or a server-side store;
- closing the tab clears it.

The server-controlled provider URL and model still apply, so this input cannot
turn the runtime into an arbitrary upstream proxy.

## Run locally

Requirements: Node.js 24 and pnpm 10.

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). When
`CHAT_ENABLED=false`, open either example and use **Settings → Chat API key**.

## Verify

```bash
pnpm check
```

This runs ESLint, TypeScript, and a production Next.js build. With the
development server running, `/api/health` reports the server chat switch,
provider, model, and browser-key support without returning credential values.

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
    ├── copilotkit/create-agent.ts
    └── env.ts
```

## References

- [CopilotKit quickstart](https://docs.copilotkit.ai/quickstart)
- [Tool-based Generative UI](https://docs.copilotkit.ai/built-in-agent/generative-ui/tool-based)
- [Open Generative UI](https://docs.copilotkit.ai/generative-ui/open-generative-ui)
- [AI SDK OpenAI-compatible provider](https://ai-sdk.dev/providers/openai-compatible-providers)
- [DeepSeek API documentation](https://api-docs.deepseek.com/)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
