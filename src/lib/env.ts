import "server-only";

import { z } from "zod";
import {
  CHAT_API_KEY_HEADER,
  CHAT_MODEL_HEADER,
  type ChatAvailability,
  type RequestChatConfig,
} from "@/lib/chat";
import {
  fallbackModelId,
  getSupportedModel,
  piModels,
  providerKeyEnv,
  supportedModels,
} from "@/lib/pi-models";

const apiKeySchema = z.string().trim().min(8).max(512);

function getConfiguredDefaultModel() {
  const configured = process.env.CHAT_DEFAULT_MODEL?.trim();
  return configured && getSupportedModel(configured)
    ? configured
    : fallbackModelId;
}

export async function getChatAvailability(): Promise<ChatAvailability> {
  const providers = piModels.getProviders();
  const authChecks = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await piModels.checkAuth(provider.id);
      } catch {
        return undefined;
      }
    }),
  );

  const providerOptions = providers.map((provider, index) => ({
    id: provider.id,
    keyEnv: providerKeyEnv[provider.id],
    name: provider.name,
    serverEnabled: Boolean(authChecks[index]),
  }));

  return {
    defaultModel: getConfiguredDefaultModel(),
    models: supportedModels.map(({ id, model }) => ({
      id,
      model: model.id,
      name: model.name,
      provider: model.provider,
    })),
    providers: providerOptions,
    ...(process.env.CHAT_DEFAULT_MODEL?.trim() &&
    !getSupportedModel(process.env.CHAT_DEFAULT_MODEL.trim())
      ? {
          issue: `CHAT_DEFAULT_MODEL "${process.env.CHAT_DEFAULT_MODEL}" is not in the supported model list.`,
        }
      : {}),
  };
}

export function getRequestChatConfig(headers: Headers): RequestChatConfig {
  const requestedModel =
    headers.get(CHAT_MODEL_HEADER)?.trim() || getConfiguredDefaultModel();
  const selectedModel = getSupportedModel(requestedModel);

  if (!selectedModel) {
    return {
      issue: `Unsupported chat model "${requestedModel}".`,
    };
  }

  const browserKeyValue = headers.get(CHAT_API_KEY_HEADER);
  const browserKey = browserKeyValue
    ? apiKeySchema.safeParse(browserKeyValue)
    : undefined;

  if (browserKey && !browserKey.success) {
    return {
      modelId: selectedModel.id,
      issue: "The browser API key is invalid.",
    };
  }

  return {
    modelId: selectedModel.id,
    ...(browserKey?.success ? { apiKey: browserKey.data } : {}),
  };
}
