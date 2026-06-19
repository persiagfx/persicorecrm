import { ok } from "@/lib/auth";

export async function POST() {
  const res = ok({ message: "خروج موفق" });
  res.headers.set("Set-Cookie", "admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict");
  return res;
}
