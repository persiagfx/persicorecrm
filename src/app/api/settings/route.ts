import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    let settings = await prisma.companySettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.companySettings.create({ data: { id: "default" } });
    }

    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();

    // Map onboarding-wizard field names → schema field names
    const { companyName, industryType, ...rest } = body;

    // Build a type-safe update object with only known CompanySettings fields
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    const settingsData = {
      ...(str(companyName ?? rest.name) !== undefined && { name: str(companyName ?? rest.name) }),
      ...(str(rest.legalName) !== undefined && { legalName: str(rest.legalName) }),
      ...(str(rest.taxId) !== undefined && { taxId: str(rest.taxId) }),
      ...(str(rest.registrationNumber) !== undefined && { registrationNumber: str(rest.registrationNumber) }),
      ...(str(rest.address) !== undefined && { address: str(rest.address) }),
      ...(str(rest.phone) !== undefined && { phone: str(rest.phone) }),
      ...(str(rest.email) !== undefined && { email: str(rest.email) }),
      ...(str(rest.website) !== undefined && { website: str(rest.website) }),
      ...(str(rest.logoUrl) !== undefined && { logoUrl: str(rest.logoUrl) }),
      ...(str(rest.invoiceFooter) !== undefined && { invoiceFooter: str(rest.invoiceFooter) }),
      ...(str(rest.invoiceColor) !== undefined && { invoiceColor: str(rest.invoiceColor) }),
      ...(str(rest.timezone) !== undefined && { timezone: str(rest.timezone) }),
      ...(str(rest.currency) !== undefined && { currency: str(rest.currency) }),
      ...(str(rest.primaryColor) !== undefined && { primaryColor: str(rest.primaryColor) }),
      ...(str(rest.adminSavedSignature) !== undefined && { adminSavedSignature: str(rest.adminSavedSignature) }),
    };

    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...settingsData },
      update: settingsData,
    });

    // industryType lives on the Tenant model, not CompanySettings
    if (industryType && payload.tenantId) {
      await prisma.tenant.update({
        where: { id: payload.tenantId },
        data: { industryType: industryType as "GENERAL" | "RESTAURANT" | "IT" | "MANUFACTURING" | "TRADING" | "SERVICE" | "EDUCATION" | "ECOMMERCE" },
      });
    }

    return ok(settings);
  } catch (e) {
    return serverError(e);
  }
}
