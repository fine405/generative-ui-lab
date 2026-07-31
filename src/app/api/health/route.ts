import { getChatAvailability } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const availability = getChatAvailability();

  return Response.json(
    {
      configured: !availability.issue,
      chatEnabled: availability.serverEnabled,
      acceptsBrowserKey: true,
      provider: availability.provider,
      model: availability.model,
      source: availability.serverEnabled
        ? "environment"
        : "browser-key-required",
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
