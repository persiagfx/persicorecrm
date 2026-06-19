import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, created, badRequest, serverError } from "@/lib/auth";
import { runAutomation } from "@/lib/automation-engine";

// Field name aliases that map to Lead fields
const FIELD_ALIASES: Record<string, string[]> = {
  contactName:  ["contactName", "name", "fullName", "full_name", "contact_name"],
  contactEmail: ["contactEmail", "email", "emailAddress", "email_address", "contact_email"],
  contactPhone: ["contactPhone", "phone", "mobile", "phoneNumber", "phone_number", "contact_phone"],
  companyName:  ["companyName", "company", "company_name", "organization"],
};

type LeadFields = {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
};

/**
 * Given the form questions and submitted answers, attempt to extract lead fields.
 * Matching priority:
 *   1. fieldMappings from the form config (explicit user mapping: questionId → leadField)
 *   2. question.name (or id) matching known aliases
 */
function extractLeadFields(
  questions: Array<{ id: string; name?: string; title?: string; type?: string }>,
  answers: Record<string, unknown>,
  fieldMappings?: Record<string, string> | null
): LeadFields {
  const result: LeadFields = {};

  // Build a reverse lookup: questionId → leadField, from explicit mappings
  const explicitMap: Record<string, keyof LeadFields> = {};
  if (fieldMappings) {
    for (const [questionId, leadField] of Object.entries(fieldMappings)) {
      if (leadField in FIELD_ALIASES) {
        explicitMap[questionId] = leadField as keyof LeadFields;
      }
    }
  }

  for (const question of questions) {
    const answerValue = answers[question.id];
    if (answerValue == null || answerValue === "") continue;
    const strValue = String(answerValue).trim();
    if (!strValue) continue;

    // 1. Explicit mapping
    if (explicitMap[question.id]) {
      const field = explicitMap[question.id];
      if (!result[field]) result[field] = strValue;
      continue;
    }

    // 2. Name-based alias matching
    const nameToMatch = (question.name ?? question.id ?? "").toLowerCase();
    for (const [leadField, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.some((a) => a.toLowerCase() === nameToMatch)) {
        const lf = leadField as keyof LeadFields;
        if (!result[lf]) result[lf] = strValue;
        break;
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await params;
    const body = await req.json();
    if (!body.answers) return badRequest("پاسخ‌ها الزامی است");

    const form = await prisma.surveyForm.findUnique({ where: { id: formId } });
    if (!form) return badRequest("فرم یافت نشد");
    if (form.status !== "open") return badRequest("این فرم بسته است");

    // Create the form response first (without leadId)
    const response = await prisma.formResponse.create({
      data: {
        formId,
        tenantId: form.tenantId,
        respondentId: body.respondentId,
        answers: body.answers,
      },
    });

    // ── Auto lead creation ────────────────────────────────────────────
    let createdLeadId: string | null = null;
    try {
      const questions = Array.isArray(form.questions) ? form.questions : [];

      // Read optional config from form (stored in a top-level config field or embedded in questions JSON)
      // Convention: form.questions can be an array of question objects, or the config can be
      // stored as a special "__config__" entry. We support both patterns.
      let leadMappingEnabled = false;
      let fieldMappings: Record<string, string> | null = null;

      // Check for __config__ sentinel inside questions array
      const qs = questions as unknown as Array<Record<string, unknown>>;
      const configEntry = qs.find((q) => q.__config__ === true);
      if (configEntry) {
        leadMappingEnabled = Boolean(configEntry.leadMappingEnabled);
        fieldMappings = (configEntry.fieldMappings as Record<string, string>) ?? null;
      } else {
        leadMappingEnabled = false;
      }

      const realQuestions = qs.filter((q) => !q.__config__);

      // If explicit mapping is enabled or alias matching finds fields — create lead
      const answers = body.answers as Record<string, unknown>;
      const extracted = extractLeadFields(
        realQuestions as Array<{ id: string; name?: string; title?: string; type?: string }>,
        answers,
        fieldMappings
      );

      const hasName = Boolean(extracted.contactName);
      const hasContact = Boolean(extracted.contactEmail) || Boolean(extracted.contactPhone);

      if ((leadMappingEnabled || fieldMappings) && hasName && hasContact) {
        const lead = await prisma.lead.create({
          data: {
            tenantId: form.tenantId ?? null,
            contactName: extracted.contactName!,
            contactEmail: extracted.contactEmail ?? null,
            contactPhone: extracted.contactPhone ?? extracted.contactEmail ?? "",
            companyName: extracted.companyName ?? extracted.contactName!,
            source: "form",
            status: "new",
            columnId: "new",
          },
        });
        createdLeadId = lead.id;

        // Link the lead back to this response
        await prisma.formResponse.update({
          where: { id: response.id },
          data: { leadId: lead.id },
        });
      }
    } catch (leadErr) {
      // Lead creation failure should NOT break form submission
      console.error("[form-response] auto lead creation failed:", leadErr);
    }

    if (form.tenantId) {
      runAutomation("form_submitted", { formId, response }, form.tenantId).catch((err) => console.error(err));
    }

    return created({ ...response, leadId: createdLeadId });
  } catch (e) {
    return serverError(e);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await params;
    const responses = await prisma.formResponse.findMany({
      where: { formId },
      orderBy: { submittedAt: "desc" },
    });
    const stats = await prisma.formResponse.count({ where: { formId } });
    return ok(responses, { total: stats });
  } catch (e) {
    return serverError(e);
  }
}
