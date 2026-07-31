import { z } from "zod";
import {
  bridgeAgentEvents,
  createChatAgent,
} from "@/lib/agent/create-chat-agent";
import type {
  AgentMode,
  ChatStreamEvent,
  JsonValue,
} from "@/lib/chat";
import { getRequestChatConfig } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

const chatPartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    sourceIndex: z.number().int().nonnegative(),
    text: z.string().max(100_000),
  }),
  z.object({
    type: z.literal("tool"),
    sourceIndex: z.number().int().nonnegative(),
    toolCallId: z.string().min(1).max(256),
    toolName: z.string().min(1).max(128),
    argsText: z.string().max(250_000),
    args: z.record(jsonValueSchema),
    result: jsonValueSchema.optional(),
    isError: z.boolean().optional(),
  }),
]);

const chatRequestSchema = z.object({
  threadId: z.string().min(1).max(128),
  messages: z
    .array(
      z.object({
        id: z.string().min(1).max(128),
        role: z.enum(["assistant", "user"]),
        parts: z.array(chatPartSchema).max(32),
        status: z.enum(["complete", "error", "running"]),
        createdAt: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(100),
});

function isAgentMode(value: string): value is AgentMode {
  return value === "controlled" || value === "open";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mode: string }> },
) {
  const { mode } = await params;

  if (!isAgentMode(mode)) {
    return Response.json({ error: "Unknown agent mode." }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "The chat request is invalid." },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "The chat request is invalid." },
      { status: 400 },
    );
  }

  let run: Awaited<ReturnType<typeof createChatAgent>>;

  try {
    run = await createChatAgent(
      mode,
      getRequestChatConfig(request.headers),
      parsed.data.messages,
      parsed.data.threadId,
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The chat could not start.",
      },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  let closed = false;

  async function send(event: ChatStreamEvent) {
    if (closed) {
      return;
    }

    try {
      await writer.write(encoder.encode(`${JSON.stringify(event)}\n`));
    } catch {
      closed = true;
    }
  }

  run.agent.subscribe(bridgeAgentEvents(send));

  const abort = () => run.agent.abort();
  request.signal.addEventListener("abort", abort, { once: true });

  void run.agent
    .prompt({
      role: "user",
      content: run.prompt.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
      timestamp: run.prompt.createdAt,
    })
    .catch(async (error) => {
      if (!request.signal.aborted) {
        await send({
          type: "error",
          message:
            error instanceof Error ? error.message : "The chat run failed.",
        });
      }
    })
    .finally(async () => {
      request.signal.removeEventListener("abort", abort);

      if (!closed) {
        closed = true;

        try {
          await writer.close();
        } catch {
          // The browser can close the stream before the agent observes abort.
        }
      }
    });

  return new Response(stream.readable, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
