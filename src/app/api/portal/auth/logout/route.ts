import { ok } from "@/lib/auth";

export async function POST() {
  const res = ok({ message: "خروج موفق" });
  const response = new Response(res.body, { status: 200, headers: res.headers });
  response.headers.set("Set-Cookie", "portal_token=; Path=/; HttpOnly; Max-Age=0");
  return response;
}
