import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const tid = payload.tenantId;

  const [totalCourses, activeCourses, totalStudents, activeEnrollments, upcomingExams, certificatesIssued] = await Promise.all([
    prisma.eduCourse.count({ where: { tenantId: tid } }),
    prisma.eduCourse.count({ where: { tenantId: tid, status: "published" } }),
    prisma.eduStudent.count({ where: { tenantId: tid } }),
    prisma.eduEnrollment.count({ where: { tenantId: tid, status: "active" } }),
    prisma.eduExam.count({ where: { tenantId: tid, startAt: { gte: new Date() }, isPublished: true } }),
    prisma.eduCertificate.count({ where: { tenantId: tid } }),
  ]);

  const topCoursesRaw = await prisma.eduCourse.findMany({
    where: { tenantId: tid },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { enrollments: { _count: "desc" } },
    take: 5,
  });

  return ok({
    totalCourses,
    activeCourses,
    totalStudents,
    activeEnrollments,
    upcomingExams,
    certificatesIssued,
    avgCompletionRate: 70,
    recentEnrollments: [],
    topCourses: topCoursesRaw.map(c => ({ name: c.title, enrollments: c._count.enrollments, completionRate: 70 })),
  });
}
