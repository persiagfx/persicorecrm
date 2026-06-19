import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const [students, exams, submissions] = await Promise.all([
      prisma.eduStudent.findMany({
        where: { tenantId: tid },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.eduExam.findMany({
        where: { tenantId: tid, ...(courseId ? { courseId } : {}), isPublished: true },
        select: { id: true, title: true, totalPoints: true, passScore: true, courseId: true, type: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.eduExamSubmission.findMany({
        where: { exam: { tenantId: tid, ...(courseId ? { courseId } : {}) } },
        select: { studentId: true, examId: true, score: true, isPassed: true, submittedAt: true },
      }),
    ]);

    const submissionMap: Record<string, Record<string, { score: number | null; isPassed: boolean | null }>> = {};
    for (const s of submissions) {
      if (!submissionMap[s.studentId]) submissionMap[s.studentId] = {};
      submissionMap[s.studentId][s.examId] = { score: s.score ?? null, isPassed: s.isPassed ?? null };
    }

    const rows = students.map(student => {
      const grades = exams.map(exam => {
        const sub = submissionMap[student.id]?.[exam.id];
        return {
          examId: exam.id,
          score: sub?.score ?? null,
          isPassed: sub?.isPassed ?? null,
          outOf: exam.totalPoints,
        };
      });
      const completed = grades.filter(g => g.score !== null);
      const avgScore = completed.length ? Math.round(completed.reduce((s, g) => s + (g.score ?? 0), 0) / completed.length) : null;
      const passedCount = grades.filter(g => g.isPassed === true).length;
      return { student: { id: student.id, name: student.name }, grades, avgScore, passedCount, completedCount: completed.length };
    });

    return ok({ rows, exams, studentCount: students.length, examCount: exams.length });
  } catch (e) { return serverError(e); }
}
