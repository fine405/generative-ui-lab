import {
  BuiltInAgent,
  convertMessagesToVercelAISDKMessages,
  convertToolsToVercelAITools,
} from "@copilotkit/runtime/v2";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { stepCountIs, streamText } from "ai";
import type { RequestChatConfig } from "@/lib/env";

type AgentMode = "controlled" | "open";

const prompts: Record<AgentMode, string> = {
  controlled: `You are the guide for a controlled Generative UI example.

Use the render_metric_snapshot frontend tool whenever the user asks for metrics, a KPI summary, a compact dashboard, or a launch report. Supply two to four concise metrics. Use short labels and explain the result in one sentence after the tool call.

If the request is unrelated to metrics, answer normally and briefly.`,
  open: `You are the guide for an Open Generative UI example.

When the user asks for a visual, interactive widget, dashboard, diagram, calculator, simulation, or small interface, use the generateSandboxedUi tool. Keep generated interfaces focused, accessible, responsive, and self-contained. Prefer a compact working interface over a large mock product.

If the user asks a conceptual question, answer normally without generating a UI.`,
};

export function createChatAgent(mode: AgentMode, config: RequestChatConfig) {
  return new BuiltInAgent({
    type: "aisdk",
    factory: ({ input, abortSignal }) => {
      if (!config.apiKey) {
        throw new Error(config.issue ?? "Chat is not configured.");
      }

      const provider = createOpenAICompatible({
        name: config.provider,
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      return streamText({
        model: provider(config.model),
        system: prompts[mode],
        messages: convertMessagesToVercelAISDKMessages(input.messages),
        tools: convertToolsToVercelAITools(input.tools),
        abortSignal,
        stopWhen: stepCountIs(5),
      });
    },
  });
}
