import "server-only";

import {
  Agent,
  type AgentEvent,
  type AgentMessage,
  type AgentTool,
} from "@earendil-works/pi-agent-core";
import {
  Type,
  type Api,
  type AssistantMessage,
  type Model,
  type ToolResultMessage,
} from "@earendil-works/pi-ai";
import type {
  AgentMode,
  ChatMessage,
  ChatStreamEvent,
  JsonValue,
  RequestChatConfig,
} from "@/lib/chat";
import { getSupportedModel, piModels } from "@/lib/pi-models";

const prompts: Record<AgentMode, string> = {
  controlled: `You are demonstrating controlled Generative UI.
When the user provides or asks for metrics, call render_metric_snapshot.
Keep titles, descriptions, labels, values, and trends concise.
Use two to four metrics. Do not invent a different UI component.`,
  open: `You are demonstrating open Generative UI.
When the user asks for a visual, interactive widget, dashboard, diagram, calculator, or explainer, call render_open_ui.
Pass a complete, self-contained HTML document in the html argument. Put all CSS and JavaScript inline and do not use Markdown fences, external assets, network requests, storage, navigation, or popups.
Build a compact, single-purpose interface on a light #FAFAFA canvas with #171717 text, Geist-style typography, a 4px spacing grid, achromatic surfaces, shadow rings instead of borders, and blue reserved for interaction and focus.
Use 6px controls, 12px cards, accessible labels and contrast, and font weights 400, 500, or 600 only. Do not use decorative gradients or transform-based hover effects.
If the user asks a conceptual question that does not benefit from an interface, answer normally without calling the tool.`,
};

const metricTool: AgentTool = {
  name: "render_metric_snapshot",
  label: "Render metric snapshot",
  description:
    "Render a compact, read-only metric dashboard from two to four KPIs.",
  parameters: Type.Object({
    title: Type.String({ description: "A short title for the metric group" }),
    summary: Type.String({
      description: "One concise sentence explaining the snapshot",
    }),
    period: Type.String({
      description: "The reporting period, such as This week",
    }),
    metrics: Type.Array(
      Type.Object({
        label: Type.String({ description: "A short metric label" }),
        value: Type.String({ description: "A formatted metric value" }),
        change: Type.String({
          description: "A short change label, such as +12%",
        }),
        trend: Type.Union([
          Type.Literal("up"),
          Type.Literal("down"),
          Type.Literal("steady"),
        ]),
      }),
      { minItems: 2, maxItems: 4 },
    ),
  }),
  async execute() {
    return {
      content: [
        {
          type: "text",
          text: "The metric snapshot was rendered for the user.",
        },
      ],
      details: { rendered: true },
      terminate: true,
    };
  },
};

const openUITool: AgentTool = {
  name: "render_open_ui",
  label: "Render open interface",
  description:
    "Render a self-contained interactive HTML interface in an isolated iframe.",
  parameters: Type.Object({
    title: Type.String({
      description: "A short accessible title for the generated interface",
    }),
    html: Type.String({
      description: "A complete self-contained HTML document",
    }),
  }),
  async execute() {
    return {
      content: [
        {
          type: "text",
          text: "The interactive interface was rendered for the user.",
        },
      ],
      details: { rendered: true },
      terminate: true,
    };
  },
};

function emptyUsage(): AssistantMessage["usage"] {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      total: 0,
    },
  };
}

function toAgentMessages(
  messages: ChatMessage[],
  model: Model<Api>,
): AgentMessage[] {
  return messages.flatMap<AgentMessage>((message): AgentMessage[] => {
    if (message.role === "user") {
      return [
        {
          role: "user" as const,
          content: message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n"),
          timestamp: message.createdAt,
        },
      ];
    }

    const content: AssistantMessage["content"] = message.parts.map((part) => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }

      return {
        type: "toolCall" as const,
        id: part.toolCallId,
        name: part.toolName,
        arguments: part.args,
      };
    });
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      content,
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: emptyUsage(),
      stopReason: content.some((part) => part.type === "toolCall")
        ? "toolUse"
        : message.status === "error"
          ? "error"
          : "stop",
      timestamp: message.createdAt,
    };
    const toolResults: ToolResultMessage[] = message.parts.flatMap((part) => {
      if (part.type !== "tool" || part.result === undefined) {
        return [];
      }

      return [
        {
          role: "toolResult" as const,
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          content: [
            {
              type: "text" as const,
              text: part.isError
                ? "The interface could not be rendered."
                : "The interface was rendered for the user.",
            },
          ],
          isError: Boolean(part.isError),
          timestamp: message.createdAt,
        },
      ];
    });

    return [assistantMessage, ...toolResults];
  });
}

function asJsonObject(value: unknown): { [key: string]: JsonValue } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as { [key: string]: JsonValue };
}

function asJsonValue(value: unknown): JsonValue {
  if (value === undefined) {
    return null;
  }

  return value as JsonValue;
}

export async function createChatAgent(
  mode: AgentMode,
  config: RequestChatConfig,
  messages: ChatMessage[],
  threadId: string,
) {
  if (config.issue || !config.modelId) {
    throw new Error(config.issue ?? "No chat model was selected.");
  }

  const selected = getSupportedModel(config.modelId);

  if (!selected) {
    throw new Error(`Unsupported chat model "${config.modelId}".`);
  }

  if (!config.apiKey) {
    const auth = await piModels.checkAuth(selected.model.provider);

    if (!auth) {
      throw new Error(
        `No API key is configured for ${selected.model.provider}.`,
      );
    }
  }

  const latestMessage = messages.at(-1);

  if (!latestMessage || latestMessage.role !== "user") {
    throw new Error("A chat run must end with a user message.");
  }

  const agent = new Agent({
    initialState: {
      systemPrompt: prompts[mode],
      model: selected.model,
      messages: toAgentMessages(messages.slice(0, -1), selected.model),
      tools: mode === "controlled" ? [metricTool] : [openUITool],
    },
    streamFn: piModels.streamSimple.bind(piModels),
    ...(config.apiKey ? { getApiKey: () => config.apiKey } : {}),
    sessionId: threadId,
    toolExecution: "sequential",
  });

  return { agent, prompt: latestMessage };
}

export function bridgeAgentEvents(
  send: (event: ChatStreamEvent) => Promise<void>,
) {
  let currentMessageId: string | undefined;
  let currentMessageErrorSent = false;
  const toolCalls = new Map<
    string,
    { messageId: string; sourceIndex: number }
  >();

  return async (event: AgentEvent) => {
    if (event.type === "message_start" && event.message.role === "assistant") {
      currentMessageId = crypto.randomUUID();
      currentMessageErrorSent = false;
      await send({ type: "message.start", messageId: currentMessageId });
      return;
    }

    if (event.type === "message_update" && currentMessageId) {
      const update = event.assistantMessageEvent;

      if (update.type === "text_delta" && update.delta) {
        await send({
          type: "text.delta",
          messageId: currentMessageId,
          sourceIndex: update.contentIndex,
          delta: update.delta,
        });
      } else if (update.type === "toolcall_start") {
        const part = update.partial.content[update.contentIndex];

        if (part?.type === "toolCall") {
          toolCalls.set(part.id, {
            messageId: currentMessageId,
            sourceIndex: update.contentIndex,
          });
          await send({
            type: "tool.start",
            messageId: currentMessageId,
            sourceIndex: update.contentIndex,
            toolCallId: part.id,
            toolName: part.name,
          });
        }
      } else if (update.type === "toolcall_delta" && update.delta) {
        const part = update.partial.content[update.contentIndex];

        if (part?.type === "toolCall") {
          await send({
            type: "tool.args.delta",
            toolCallId: part.id,
            delta: update.delta,
          });
        }
      } else if (update.type === "toolcall_end") {
        if (!toolCalls.has(update.toolCall.id)) {
          toolCalls.set(update.toolCall.id, {
            messageId: currentMessageId,
            sourceIndex: update.contentIndex,
          });
          await send({
            type: "tool.start",
            messageId: currentMessageId,
            sourceIndex: update.contentIndex,
            toolCallId: update.toolCall.id,
            toolName: update.toolCall.name,
          });
        }

        await send({
          type: "tool.args.complete",
          toolCallId: update.toolCall.id,
          args: asJsonObject(update.toolCall.arguments),
        });
      } else if (update.type === "error" && update.reason !== "aborted") {
        currentMessageErrorSent = true;
        await send({
          type: "error",
          message: update.error.errorMessage ?? "The model request failed.",
        });
      }

      return;
    }

    if (event.type === "tool_execution_start") {
      const location = toolCalls.get(event.toolCallId);

      if (location) {
        await send({
          type: "tool.args.complete",
          toolCallId: event.toolCallId,
          args: asJsonObject(event.args),
        });
      }
      return;
    }

    if (event.type === "tool_execution_end") {
      await send({
        type: "tool.result",
        toolCallId: event.toolCallId,
        result: asJsonValue(event.result?.details),
        isError: event.isError,
      });
      return;
    }

    if (event.type === "message_end" && event.message.role === "assistant") {
      if (
        event.message.stopReason === "error" &&
        event.message.errorMessage &&
        !currentMessageErrorSent
      ) {
        await send({
          type: "error",
          message: event.message.errorMessage,
        });
      }

      if (currentMessageId) {
        await send({ type: "message.end", messageId: currentMessageId });
      }
      currentMessageId = undefined;
      currentMessageErrorSent = false;
      return;
    }

    if (event.type === "agent_end") {
      await send({ type: "run.end" });
    }
  };
}
