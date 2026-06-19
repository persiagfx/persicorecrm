import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, notFound, serverError } from "@/lib/auth";

const RESUME_FIELDS = [
  "fullName","fullNameFa","title","titleFa","bio","bioFa","avatar","coverImage",
  "location","locationFa","email","phone","website",
  "linkedin","github","twitter","instagram","behance","dribbble","telegram","youtube",
  "theme","accentColor","lang","isPublished",
  "experience","education","skills","projects","certifications","awards",
  "publications","languages","volunteering","references","customSections",
  "sectionOrder","seoTitle","seoDesc","ogImage","slug",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const resume = await prisma.resume.findUnique({ where: { id } });
    if (!resume) return notFound("رزومه");
    return ok(resume);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.resume.findUnique({ where: { id } });
    if (!existing) return notFound("رزومه");

    const data: Record<string, unknown> = {};
    for (const field of RESUME_FIELDS) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    const resume = await prisma.resume.update({ where: { id }, data });
    return ok(resume);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;
    const { id } = await params;
    await prisma.resume.delete({ where: { id } });
    return ok({ message: "رزومه حذف شد" });
  } catch (e) { return serverError(e); }
}
