import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const proposal = await prisma.proposal.findUnique({ where: { slug, isPublished: true } });

    if (!proposal) {
      return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    }

    // async view bump
    prisma.proposal.update({
      where: { id: proposal.id },
      data: { views: { increment: 1 }, viewedAt: new Date(), status: proposal.status === "sent" ? "viewed" : proposal.status },
    }).catch((err) => console.error(err));

    return NextResponse.json({ data: proposal });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
