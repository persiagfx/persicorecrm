import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError, tenantFilter } from "@/lib/auth";

interface DuplicateGroup {
  leads: {
    id: string;
    contactName: string;
    contactEmail: string | null;
    contactPhone: string;
    companyName: string;
    status: string;
    createdAt: Date;
    duplicateOfId: string | null;
  }[];
  matchField: "email" | "phone" | "name";
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const filter = tenantFilter(payload);

    // Fetch all leads (excluding those already marked as duplicate)
    const leads = await prisma.lead.findMany({
      where: {
        ...filter,
        status: { not: "duplicate" },
      },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        companyName: true,
        status: true,
        createdAt: true,
        duplicateOfId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const groups: DuplicateGroup[] = [];
    const seenIds = new Set<string>();

    // Group by email
    const emailMap = new Map<string, typeof leads>();
    for (const lead of leads) {
      if (lead.contactEmail) {
        const key = lead.contactEmail.toLowerCase().trim();
        if (!emailMap.has(key)) emailMap.set(key, []);
        emailMap.get(key)!.push(lead);
      }
    }
    for (const [, group] of emailMap) {
      if (group.length >= 2) {
        groups.push({ leads: group, matchField: "email" });
        for (const l of group) seenIds.add(l.id);
      }
    }

    // Group by phone (exact match after stripping spaces/dashes)
    const phoneMap = new Map<string, typeof leads>();
    for (const lead of leads) {
      const normalizedPhone = lead.contactPhone.replace(/[\s\-()]/g, "");
      if (normalizedPhone) {
        if (!phoneMap.has(normalizedPhone)) phoneMap.set(normalizedPhone, []);
        phoneMap.get(normalizedPhone)!.push(lead);
      }
    }
    for (const [, group] of phoneMap) {
      if (group.length >= 2) {
        // Only add if not all leads are already in an email group
        const newLeads = group.filter((l) => !seenIds.has(l.id));
        if (newLeads.length >= 2 || (newLeads.length >= 1 && group.length >= 2)) {
          const alreadyCovered = group.every((l) => seenIds.has(l.id));
          if (!alreadyCovered) {
            groups.push({ leads: group, matchField: "phone" });
            for (const l of group) seenIds.add(l.id);
          }
        }
      }
    }

    // Group by similar name (one name contains the other, case-insensitive)
    const nameGroups: typeof leads[] = [];
    const processedForName = new Set<string>();

    for (let i = 0; i < leads.length; i++) {
      const a = leads[i];
      if (processedForName.has(a.id)) continue;
      const similar: typeof leads = [a];

      for (let j = i + 1; j < leads.length; j++) {
        const b = leads[j];
        if (processedForName.has(b.id)) continue;
        const nameA = a.contactName.toLowerCase().trim();
        const nameB = b.contactName.toLowerCase().trim();
        if (
          nameA.length >= 3 &&
          nameB.length >= 3 &&
          (nameA.includes(nameB) || nameB.includes(nameA))
        ) {
          similar.push(b);
        }
      }

      if (similar.length >= 2) {
        nameGroups.push(similar);
        for (const l of similar) processedForName.add(l.id);
      }
    }

    for (const group of nameGroups) {
      const alreadyCovered = group.every((l) => seenIds.has(l.id));
      if (!alreadyCovered) {
        groups.push({ leads: group, matchField: "name" });
        for (const l of group) seenIds.add(l.id);
      }
    }

    return ok(groups);
  } catch (e) {
    return serverError(e);
  }
}
