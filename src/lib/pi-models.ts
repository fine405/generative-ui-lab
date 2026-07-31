import "server-only";

import { createModels } from "@earendil-works/pi-ai";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";
import { googleProvider } from "@earendil-works/pi-ai/providers/google";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";

const modelIds = [
  "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v4-pro",
  "openai/gpt-5.4-mini",
  "openai/gpt-5.4",
  "anthropic/claude-haiku-4-5",
  "anthropic/claude-sonnet-4-6",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-pro-preview",
] as const;

export const providerKeyEnv: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  google: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
};

export const piModels = createModels();

piModels.setProvider(deepseekProvider());
piModels.setProvider(openaiProvider());
piModels.setProvider(anthropicProvider());
piModels.setProvider(googleProvider());

export const supportedModels = modelIds.map((id) => {
  const separator = id.indexOf("/");
  const provider = id.slice(0, separator);
  const modelId = id.slice(separator + 1);
  const model = piModels.getModel(provider, modelId);

  if (!model) {
    throw new Error(`pi-ai does not include the configured model "${id}".`);
  }

  return { id, model };
});

export const fallbackModelId = modelIds[0];

export function getSupportedModel(id: string) {
  return supportedModels.find((entry) => entry.id === id);
}
