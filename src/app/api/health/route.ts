import { getServerEnvStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const status = getServerEnvStatus();

  return Response.json(status, {
    status: status.configured ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
