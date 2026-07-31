export const CHAT_API_KEY_HEADER = "x-chat-api-key";
export const CHAT_MODEL_HEADER = "x-chat-model";

export type AgentMode = "controlled" | "open";

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ChatTextPart = {
  sourceIndex: number;
  text: string;
  type: "text";
};

export type ChatToolPart = {
  args: { [key: string]: JsonValue };
  argsText: string;
  isError?: boolean;
  result?: JsonValue;
  sourceIndex: number;
  toolCallId: string;
  toolName: string;
  type: "tool";
};

export type ChatPart = ChatTextPart | ChatToolPart;

export type ChatMessage = {
  createdAt: number;
  id: string;
  parts: ChatPart[];
  role: "assistant" | "user";
  status: "complete" | "error" | "running";
};

export type ChatRequest = {
  messages: ChatMessage[];
  threadId: string;
};

export type ChatStreamEvent =
  | {
      messageId: string;
      type: "message.start";
    }
  | {
      delta: string;
      messageId: string;
      sourceIndex: number;
      type: "text.delta";
    }
  | {
      messageId: string;
      sourceIndex: number;
      toolCallId: string;
      toolName: string;
      type: "tool.start";
    }
  | {
      delta: string;
      toolCallId: string;
      type: "tool.args.delta";
    }
  | {
      args: { [key: string]: JsonValue };
      toolCallId: string;
      type: "tool.args.complete";
    }
  | {
      isError: boolean;
      result: JsonValue;
      toolCallId: string;
      type: "tool.result";
    }
  | {
      messageId: string;
      type: "message.end";
    }
  | {
      type: "run.end";
    }
  | {
      message: string;
      type: "error";
    };

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
