import { NextRequest } from "next/server";
import { ok } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  return ok({ publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
}
