import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const responses = await prisma.formResponse.findMany({
      where: {
        form: { type: "nps" },
      },
      include: {
        form: { select: { title: true, tenantId: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const mapped = responses.map((r) => {
      const answers = r.answers as Record<string, unknown>;
      return {
        id: r.id,
        submittedAt: r.submittedAt,
        score: typeof answers.nps === "number" ? answers.nps : null,
        comment: typeof answers.comment === "string" ? answers.comment : "",
        respondentId: r.respondentId,
        formTitle: r.form.title,
        tenantId: r.form.tenantId,
      };
    });

    const scores = mapped.filter((r) => r.score !== null).map((r) => r.score as number);
    const average = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

    // NPS calculation: promoters (9-10) - detractors (0-6) as % of total
    const promoters = scores.filter((s) => s >= 9).length;
    const detractors = scores.filter((s) => s <= 6).length;
    const npsScore = scores.length > 0
      ? Math.round(((promoters - detractors) / scores.length) * 100)
      : null;

    return ok({ responses: mapped, average, npsScore, total: scores.length });
  } catch (e) {
    return serverError(e);
  }
}
