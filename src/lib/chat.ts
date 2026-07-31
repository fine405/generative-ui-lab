export const CHAT_API_KEY_HEADER = "x-chat-api-key";
export const CHAT_MODEL_HEADER = "x-chat-model";

export type ChatProviderOption = {
  id: string;
  keyEnv: string;
  name: string;
  serverEnabled: boolean;
};

export type ChatModelOption = {
  id: string;
  model: string;
  name: string;
  provider: string;
};

export type ChatAvailability = {
  defaultModel: string;
  issue?: string;
  models: ChatModelOption[];
  providers: ChatProviderOption[];
};

export type RequestChatConfig = {
  apiKey?: string;
  issue?: string;
  modelId?: string;
};
