import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const link = await prisma.uTMLink.findUnique({ where: { id } });
  if (!link) return NextResponse.json({ error: "لینک یافت نشد" }, { status: 404 });

  // Increment click count
  await prisma.uTMLink.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  }).catch((err) => console.error(err));

  // Build final URL with UTM params
  const url = new URL(link.baseUrl);
  url.searchParams.set("utm_source", link.source);
  url.searchParams.set("utm_medium", link.medium);
  if (link.campaignName) url.searchParams.set("utm_campaign", link.campaignName);
  if (link.content) url.searchParams.set("utm_content", link.content);
  if (link.term) url.searchParams.set("utm_term", link.term);

  return NextResponse.redirect(url.toString(), { status: 302 });
}
