import { z } from "zod";

const modelId = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9-]+\/[a-z0-9._-]+$/i,
    "COPILOTKIT_MODEL must use the provider/model format.",
  );

const serverEnvSchema = z
  .object({
    AI_GATEWAY_API_KEY: z.string().trim().min(1).optional(),
    VERCEL_OIDC_TOKEN: z.string().trim().min(1).optional(),
    COPILOTKIT_MODEL: modelId.default("openai/gpt-5.4-mini"),
  })
  .superRefine((env, context) => {
    if (!env.AI_GATEWAY_API_KEY && !env.VERCEL_OIDC_TOKEN) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "AI Gateway authentication is missing. Run `vercel env pull .env.local` or set AI_GATEWAY_API_KEY.",
        path: ["AI_GATEWAY_API_KEY"],
      });
    }
  });

function readServerEnv() {
  return {
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
    COPILOTKIT_MODEL: process.env.COPILOTKIT_MODEL,
  };
}

export function getServerEnv() {
  return serverEnvSchema.parse(readServerEnv());
}

export function getServerEnvStatus() {
  const parsed = serverEnvSchema.safeParse(readServerEnv());

  if (!parsed.success) {
    return {
      configured: false as const,
      model: process.env.COPILOTKIT_MODEL ?? "openai/gpt-5.4-mini",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    configured: true as const,
    model: parsed.data.COPILOTKIT_MODEL,
    auth: parsed.data.AI_GATEWAY_API_KEY ? "api-key" : "vercel-oidc",
  };
}
