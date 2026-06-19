import { openApiSpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(openApiSpec, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
