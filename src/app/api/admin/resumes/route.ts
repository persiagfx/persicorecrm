import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

function makeSlug(name: string): string {
  return name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9؀-ۿ]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const resumes = await prisma.resume.findMany({
      select: {
        id: true, slug: true, fullName: true, fullNameFa: true,
        title: true, titleFa: true, avatar: true, isPublished: true,
        theme: true, views: true, createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return ok(resumes);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const body = await req.json();
    if (!body.fullName || !body.title) return badRequest("نام و عنوان الزامی است");

    const slug = body.slug?.trim() || makeSlug(body.fullName);
    const exists = await prisma.resume.findUnique({ where: { slug } });
    if (exists) return badRequest("این slug قبلاً استفاده شده");

    const resume = await prisma.resume.create({
      data: {
        slug,
        fullName: body.fullName,
        fullNameFa: body.fullNameFa,
        title: body.title,
        titleFa: body.titleFa,
        bio: body.bio,
        bioFa: body.bioFa,
        avatar: body.avatar,
        coverImage: body.coverImage,
        location: body.location,
        locationFa: body.locationFa,
        email: body.email,
        phone: body.phone,
        website: body.website,
        linkedin: body.linkedin,
        github: body.github,
        twitter: body.twitter,
        instagram: body.instagram,
        behance: body.behance,
        dribbble: body.dribbble,
        telegram: body.telegram,
        youtube: body.youtube,
        theme: body.theme ?? "dark",
        accentColor: body.accentColor ?? "#8B5CF6",
        lang: body.lang ?? "bilingual",
        isPublished: body.isPublished ?? false,
        experience: body.experience ?? [],
        education: body.education ?? [],
        skills: body.skills ?? [],
        projects: body.projects ?? [],
        certifications: body.certifications ?? [],
        awards: body.awards ?? [],
        publications: body.publications ?? [],
        languages: body.languages ?? [],
        volunteering: body.volunteering ?? [],
        references: body.references ?? [],
        customSections: body.customSections ?? [],
        sectionOrder: body.sectionOrder ?? [],
        seoTitle: body.seoTitle,
        seoDesc: body.seoDesc,
        ogImage: body.ogImage ?? body.avatar,
      },
    });

    return created(resume);
  } catch (e) {
    return serverError(e);
  }
}
