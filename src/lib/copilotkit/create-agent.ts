import { EventType, type BaseEvent, type RunAgentInput } from "@ag-ui/client";
import {
  Type,
  type Api,
  type AssistantMessage,
  type Context,
  type Model,
  type TSchema,
  type Tool,
  type UserMessage,
} from "@earendil-works/pi-ai";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import type { RequestChatConfig } from "@/lib/chat";
import { getSupportedModel, piModels } from "@/lib/pi-models";

type AgentMode = "controlled" | "open";

const prompts: Record<AgentMode, string> = {
  controlled: `You are demonstrating controlled Generative UI.
When the user provides or asks for metrics, call render_metric_snapshot.
Keep titles, descriptions, labels, values, and trends concise.
Use two to four metrics. Do not invent a different UI component.`,
  open: `You are demonstrating open Generative UI.
When the user asks for a visual, interactive widget, dashboard, diagram, calculator, or explainer, use the open generative UI tool available to you.
Prefer a compact single-purpose interface with clear labels and accessible contrast.
If the user asks a conceptual question, answer normally without generating a UI.`,
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

function parseToolArguments(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function convertUserContent(
  content: Extract<RunAgentInput["messages"][number], { role: "user" }>["content"],
): UserMessage["content"] {
  if (typeof content === "string") {
    return content;
  }

  const blocks: Exclude<UserMessage["content"], string> = [];

  for (const item of content) {
    if (item.type === "text") {
      blocks.push({ type: "text", text: item.text });
    } else if (item.type === "image" && item.source.type === "data") {
      blocks.push({
        type: "image",
        data: item.source.value,
        mimeType: item.source.mimeType,
      });
    } else if (
      item.type === "binary" &&
      item.data &&
      item.mimeType.startsWith("image/")
    ) {
      blocks.push({
        type: "image",
        data: item.data,
        mimeType: item.mimeType,
      });
    }
  }

  return blocks;
}

function convertInput(
  input: RunAgentInput,
  model: Model<Api>,
  systemPrompt: string,
): Context {
  const systemParts = [systemPrompt];
  const messages: Context["messages"] = [];
  const toolNames = new Map<string, string>();

  for (const message of input.messages) {
    if (message.role === "system" || message.role === "developer") {
      systemParts.push(message.content);
      continue;
    }

    if (message.role === "user") {
      messages.push({
        role: "user",
        content: convertUserContent(message.content),
        timestamp: Date.now(),
      });
      continue;
    }

    if (message.role === "assistant") {
      const content: AssistantMessage["content"] = [];

      if (message.content) {
        content.push({ type: "text", text: message.content });
      }

      for (const toolCall of message.toolCalls ?? []) {
        toolNames.set(toolCall.id, toolCall.function.name);
        content.push({
          type: "toolCall",
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: parseToolArguments(toolCall.function.arguments),
        });
      }

      messages.push({
        role: "assistant",
        content,
        api: model.api,
        provider: model.provider,
        model: model.id,
        usage: emptyUsage(),
        stopReason: message.toolCalls?.length ? "toolUse" : "stop",
        timestamp: Date.now(),
      });
      continue;
    }

    if (message.role === "tool") {
      messages.push({
        role: "toolResult",
        toolCallId: message.toolCallId,
        toolName: toolNames.get(message.toolCallId) ?? "unknown_tool",
        content: [{ type: "text", text: message.content }],
        isError: Boolean(message.error),
        timestamp: Date.now(),
      });
    }
  }

  const tools: Tool[] = input.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: (tool.parameters ?? Type.Object({})) as TSchema,
  }));

  return {
    systemPrompt: systemParts.join("\n\n"),
    messages,
    tools,
  };
}

export function createChatAgent(mode: AgentMode, config: RequestChatConfig) {
  return new BuiltInAgent({
    type: "custom",
    factory: async function* ({
      input,
      abortSignal,
    }): AsyncIterable<BaseEvent> {
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

      const stream = piModels.streamSimple(
        selected.model,
        convertInput(input, selected.model, prompts[mode]),
        {
          ...(config.apiKey ? { apiKey: config.apiKey } : {}),
          sessionId: input.threadId,
          signal: abortSignal,
        },
      );
      const textMessageIds = new Map<number, string>();
      const toolCallIds = new Map<number, string>();

      for await (const event of stream) {
        if (abortSignal.aborted) {
          return;
        }

        if (event.type === "text_start") {
          const messageId = crypto.randomUUID();
          textMessageIds.set(event.contentIndex, messageId);
          yield {
            type: EventType.TEXT_MESSAGE_START,
            messageId,
            role: "assistant",
          };
        } else if (event.type === "text_delta") {
          const messageId = textMessageIds.get(event.contentIndex);

          if (messageId && event.delta) {
            yield {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: event.delta,
            };
          }
        } else if (event.type === "text_end") {
          const messageId = textMessageIds.get(event.contentIndex);

          if (messageId) {
            yield {
              type: EventType.TEXT_MESSAGE_END,
              messageId,
            };
          }
        } else if (event.type === "toolcall_start") {
          const toolCall = event.partial.content[event.contentIndex];

          if (toolCall?.type === "toolCall") {
            toolCallIds.set(event.contentIndex, toolCall.id);
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: toolCall.id,
              toolCallName: toolCall.name,
            };
          }
        } else if (event.type === "toolcall_delta") {
          const toolCallId = toolCallIds.get(event.contentIndex);

          if (toolCallId && event.delta) {
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId,
              delta: event.delta,
            };
          }
        } else if (event.type === "toolcall_end") {
          const toolCallId =
            toolCallIds.get(event.contentIndex) ?? event.toolCall.id;
          yield {
            type: EventType.TOOL_CALL_END,
            toolCallId,
          };
        } else if (event.type === "error") {
          if (event.reason === "aborted") {
            return;
          }

          throw new Error(event.error.errorMessage ?? "The model request failed.");
        }
      }
    },
  });
}
