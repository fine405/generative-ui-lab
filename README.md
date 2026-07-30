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
- Vercel AI SDK 6 with AI Gateway
- Vercel OIDC in production and for authenticated local development
- TypeScript, Zod, ESLint, and the React Compiler

The runtime uses CopilotKit's multi-route handler. Controlled UI registers a
typed frontend component with `useComponent`; Open UI enables
`openGenerativeUI` and renders generated interfaces in CopilotKit's sandbox.

## Run locally

Requirements: Node.js 20 or later, pnpm, and access to the linked Vercel
project.

```bash
pnpm install
pnpm dlx vercel@58.4.0 link --yes --scope <your-team> --project generative-ui-lab
pnpm dlx vercel@58.4.0 env pull .env.local --yes
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The pulled
`VERCEL_OIDC_TOKEN` is short-lived and `.env.local` is ignored by Git. Re-run
the environment pull when the token expires.

For development outside Vercel, copy `.env.example` to `.env.local` and set an
`AI_GATEWAY_API_KEY`. Do not expose either credential via a `NEXT_PUBLIC_`
variable.

Vercel AI Gateway requires an enabled billing method before it serves model
requests, even when OIDC authentication is valid.

## Verify

```bash
pnpm check
```

This runs ESLint, TypeScript, and a production Next.js build. With the
development server running, `/api/health` reports whether server-side AI
authentication is configured without returning credential values.

## Project map

```text
src/
├── app/
│   ├── api/copilotkit/[...path]/       # Controlled runtime
│   ├── api/copilotkit-open/[...path]/  # Open UI runtime
│   ├── api/health/                     # Configuration readiness
│   └── examples/                       # Example pages
├── features/
│   ├── controlled/
│   └── open/
└── lib/
    ├── copilotkit/create-agent.ts
    └── env.ts
```

## References

- [CopilotKit quickstart](https://docs.copilotkit.ai/quickstart)
- [CopilotKit architecture](https://docs.copilotkit.ai/concepts/architecture)
- [Tool-based Generative UI](https://docs.copilotkit.ai/built-in-agent/generative-ui/tool-based)
- [Open Generative UI](https://docs.copilotkit.ai/generative-ui/open-generative-ui)
- [Vercel AI Gateway authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc)
