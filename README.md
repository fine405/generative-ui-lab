# Generative UI Lab

A runnable collection of Generative UI patterns built from first principles.
Each example keeps the agent loop, wire protocol, browser state, and UI renderer
visible in this repository so the boundary between model output and host-owned
UI is easy to inspect.

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
- `@earendil-works/pi-agent-core` for the stateful agent loop and tool execution
- `@earendil-works/pi-ai` for provider catalogs, auth, and model streaming
- A project-owned NDJSON event protocol and browser reducer
- `assistant-ui` headless primitives with a project-owned chat model adapter
- TypeScript, Zod, ESLint, and the React Compiler

There is no CopilotKit, AG-UI, or AI SDK adapter. The app registers DeepSeek,
OpenAI, Anthropic, and Google through pi-ai provider factories, but owns the
agent-to-UI bridge itself.

## How a run works

```text
assistant-ui composer
  → POST /api/chat/:mode
  → pi-agent-core Agent
  → model text / tool-call / tool-result events
  → bridgeAgentEvents()
  → newline-delimited JSON
  → applyChatStreamEvent()
  → assistant-ui local runtime view
  → host tool renderer
```

The transport intentionally exposes a small event vocabulary:

- `message.start`, `text.delta`, and `message.end` build assistant messages;
- `tool.start`, `tool.args.delta`, and `tool.args.complete` expose streamed tool
  construction;
- `tool.result` records execution completion or failure;
- `error` and `run.end` close the run lifecycle.

The controlled example validates tool arguments and renders an allowlisted
React component in the host tree. The open example accepts a self-contained
HTML document and mounts it in an iframe with a restrictive CSP and
`sandbox="allow-scripts"`.

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
│   ├── api/chat/[mode]/                # Custom streaming route
│   ├── api/health/                     # Safe configuration status
│   └── examples/                       # Example pages
├── components/
│   ├── chat-runtime.tsx                # Model and session-key settings
│   └── chat-thread.tsx                 # assistant-ui custom model adapter
├── features/
│   ├── controlled/                     # Typed component renderer
│   └── open/                           # Sandboxed document renderer
└── lib/
    ├── agent/create-chat-agent.ts      # Agent, tools, event bridge
    ├── chat.ts                         # Serializable protocol contracts
    ├── chat-stream.ts                  # Browser event reducer
    ├── env.ts                          # Server/browser request config
    └── pi-models.ts                    # pi-ai providers and model allowlist
```

## References

- [Project design language](./DESIGN.md)
- [pi-agent-core](https://github.com/earendil-works/pi/tree/main/packages/agent)
- [pi-ai provider and model API](https://github.com/earendil-works/pi/tree/main/packages/ai)
- [assistant-ui custom runtimes](https://www.assistant-ui.com/docs/runtimes/custom/overview)
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
