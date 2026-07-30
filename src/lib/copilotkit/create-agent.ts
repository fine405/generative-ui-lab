import {
  BuiltInAgent,
  convertMessagesToVercelAISDKMessages,
  convertToolsToVercelAITools,
} from "@copilotkit/runtime/v2";
import { stepCountIs, streamText } from "ai";
import { getServerEnv } from "@/lib/env";

type AgentMode = "controlled" | "open";

const prompts: Record<AgentMode, string> = {
  controlled: `You are the guide for a controlled Generative UI example.

Use the render_metric_snapshot frontend tool whenever the user asks for metrics, a KPI summary, a compact dashboard, or a launch report. Supply two to four concise metrics. Use short labels and explain the result in one sentence after the tool call.

If the request is unrelated to metrics, answer normally and briefly.`,
  open: `You are the guide for an Open Generative UI example.

When the user asks for a visual, interactive widget, dashboard, diagram, calculator, simulation, or small interface, use the generateSandboxedUi tool. Keep generated interfaces focused, accessible, responsive, and self-contained. Prefer a compact working interface over a large mock product.

If the user asks a conceptual question, answer normally without generating a UI.`,
};

export function createGatewayAgent(mode: AgentMode) {
  return new BuiltInAgent({
    type: "aisdk",
    factory: ({ input, abortSignal }) => {
      const env = getServerEnv();

      return streamText({
        model: env.COPILOTKIT_MODEL,
        system: prompts[mode],
        messages: convertMessagesToVercelAISDKMessages(input.messages),
        tools: convertToolsToVercelAITools(input.tools),
        abortSignal,
        stopWhen: stepCountIs(5),
      });
    },
  });
}
