import { getServerEnvStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const status = getServerEnvStatus(request.headers);

  return Response.json(status, {
    status: status.configured ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
