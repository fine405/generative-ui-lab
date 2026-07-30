import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { createGatewayAgent } from "@/lib/copilotkit/create-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

const copilotRuntime = new CopilotRuntime({
  agents: () => ({
    default: createGatewayAgent("open"),
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
