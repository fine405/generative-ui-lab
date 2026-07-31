import { z } from "zod";

export const CHAT_API_KEY_HEADER = "x-chat-api-key";

const apiKeySchema = z.string().trim().min(8).max(512);
const optionalApiKeySchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  apiKeySchema.optional(),
);

const serverEnvSchema = z.object({
  CHAT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CHAT_API_KEY: optionalApiKeySchema,
  CHAT_PROVIDER: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9_-]*$/i)
    .default("deepseek"),
  CHAT_BASE_URL: z
    .string()
    .trim()
    .url()
    .default("https://api.deepseek.com")
    .transform((value) => value.replace(/\/+$/, "")),
  CHAT_MODEL: z.string().trim().min(1).default("deepseek-v4-flash"),
});

type ParsedServerEnv = z.infer<typeof serverEnvSchema>;

export type ChatAvailability = {
  serverEnabled: boolean;
  provider: string;
  model: string;
  issue?: string;
};

export type RequestChatConfig = {
  apiKey?: string;
  baseURL: string;
  issue?: string;
  model: string;
  provider: string;
};

function readServerEnv() {
  return {
    CHAT_ENABLED: process.env.CHAT_ENABLED,
    CHAT_API_KEY: process.env.CHAT_API_KEY,
    CHAT_PROVIDER: process.env.CHAT_PROVIDER,
    CHAT_BASE_URL: process.env.CHAT_BASE_URL,
    CHAT_MODEL: process.env.CHAT_MODEL,
  };
}

function formatIssues(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

function getParsedServerEnv() {
  return serverEnvSchema.safeParse(readServerEnv());
}

function getServerIssue(env: ParsedServerEnv) {
  if (env.CHAT_ENABLED && !env.CHAT_API_KEY) {
    return "CHAT_ENABLED is true, but CHAT_API_KEY is missing.";
  }
}

export function getChatAvailability(): ChatAvailability {
  const parsed = getParsedServerEnv();

  if (!parsed.success) {
    return {
      serverEnabled: false,
      provider: process.env.CHAT_PROVIDER ?? "deepseek",
      model: process.env.CHAT_MODEL ?? "deepseek-v4-flash",
      issue: formatIssues(parsed.error),
    };
  }

  const issue = getServerIssue(parsed.data);

  return {
    serverEnabled:
      parsed.data.CHAT_ENABLED && Boolean(parsed.data.CHAT_API_KEY),
    provider: parsed.data.CHAT_PROVIDER,
    model: parsed.data.CHAT_MODEL,
    ...(issue ? { issue } : {}),
  };
}

export function getRequestChatConfig(headers: Headers): RequestChatConfig {
  const parsed = getParsedServerEnv();

  if (!parsed.success) {
    return {
      provider: process.env.CHAT_PROVIDER ?? "deepseek",
      baseURL: process.env.CHAT_BASE_URL ?? "https://api.deepseek.com",
      model: process.env.CHAT_MODEL ?? "deepseek-v4-flash",
      issue: formatIssues(parsed.error),
    };
  }

  const browserKey = apiKeySchema.safeParse(
    headers.get(CHAT_API_KEY_HEADER) ?? undefined,
  );

  if (browserKey.success) {
    return {
      apiKey: browserKey.data,
      provider: parsed.data.CHAT_PROVIDER,
      baseURL: parsed.data.CHAT_BASE_URL,
      model: parsed.data.CHAT_MODEL,
    };
  }

  if (parsed.data.CHAT_ENABLED && parsed.data.CHAT_API_KEY) {
    return {
      apiKey: parsed.data.CHAT_API_KEY,
      provider: parsed.data.CHAT_PROVIDER,
      baseURL: parsed.data.CHAT_BASE_URL,
      model: parsed.data.CHAT_MODEL,
    };
  }

  return {
    provider: parsed.data.CHAT_PROVIDER,
    baseURL: parsed.data.CHAT_BASE_URL,
    model: parsed.data.CHAT_MODEL,
    issue:
      getServerIssue(parsed.data) ??
      "Chat is disabled. Add a browser API key or set CHAT_ENABLED=true with CHAT_API_KEY.",
  };
}
