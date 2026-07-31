import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { createChatAgent } from "@/lib/copilotkit/create-agent";
import { getRequestChatConfig } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const copilotRuntime = new CopilotRuntime({
  agents: ({ request }) => ({
    default: createChatAgent("open", getRequestChatConfig(request.headers)),
  }),
  openGenerativeUI: true,
});

const handler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath: "/api/copilotkit-open",
});

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
