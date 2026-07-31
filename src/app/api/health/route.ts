import { getChatAvailability } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const availability = await getChatAvailability();
  const enabledProviders = availability.providers
    .filter((provider) => provider.serverEnabled)
    .map((provider) => provider.id);

  return Response.json(
    {
      configured: !availability.issue,
      chatEnabled: enabledProviders.length > 0,
      acceptsBrowserKey: true,
      defaultModel: availability.defaultModel,
      enabledProviders,
      models: availability.models.map((model) => ({
        ...model,
        enabled: enabledProviders.includes(model.provider),
      })),
      ...(availability.issue ? { issues: [availability.issue] } : {}),
    },
    {
      status: availability.issue ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
