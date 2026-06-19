import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

const DEFAULT_TYPES = [
  { key: "ecommerce",    nameFa: "فروشگاه آنلاین",         icon: "🛒", order: 1 },
  { key: "restaurant",  nameFa: "رستوران و کافه",           icon: "🍽️", order: 2 },
  { key: "clinic",      nameFa: "کلینیک و پزشکی",          icon: "🏥", order: 3 },
  { key: "education",   nameFa: "آموزش و دوره آنلاین",      icon: "📚", order: 4 },
  { key: "legal",       nameFa: "مشاوره و خدمات حقوقی",    icon: "⚖️", order: 5 },
  { key: "travel",      nameFa: "آژانس مسافرتی",           icon: "✈️", order: 6 },
  { key: "beauty",      nameFa: "آرایشگاه و زیبایی",       icon: "💄", order: 7 },
  { key: "construction",nameFa: "ساختمان و دکوراسیون",     icon: "🏗️", order: 8 },
  { key: "insurance",   nameFa: "بیمه و مالی",             icon: "🛡️", order: 9 },
  { key: "software",    nameFa: "نرم‌افزار و IT",           icon: "💻", order: 10 },
  { key: "b2b",         nameFa: "خدمات B2B",               icon: "🤝", order: 11 },
  { key: "other",       nameFa: "سایر کسب‌وکارها",         icon: "🏢", order: 12 },
];

export async function GET() {
  try {
    let types = await prisma.agentBusinessType.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    if (types.length === 0) {
      // Seed defaults
      await prisma.agentBusinessType.createMany({ data: DEFAULT_TYPES });
      types = await prisma.agentBusinessType.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    }

    return ok(types);
  } catch (e) {
    return serverError(e);
  }
}
