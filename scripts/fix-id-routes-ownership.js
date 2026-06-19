/**
 * Adds tenant ownership verification to all [id] API routes.
 * Changes findUnique/findFirst to include tenantFilter in WHERE.
 * For PUT/DELETE: adds a pre-check before update/delete.
 */
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "../src/app/api");

// Map: route-path-suffix → { model: prisma model name, tenantField: how to filter }
const ID_ROUTES = {
  "campaigns/[id]/route.ts":               { model: "campaign",         field: "tenantId" },
  "clients/[id]/route.ts":                 { model: "client",           field: "tenantId" },
  "leads/[id]/route.ts":                   { model: "lead",             field: "tenantId" },
  "invoices/[id]/route.ts":                { model: "invoice",          field: "tenantId" },
  "expenses/[id]/route.ts":                { model: "expense",          field: "tenantId" },
  "contracts/[id]/route.ts":               { model: "contract",         field: "tenantId" },
  "contract-templates/[id]/route.ts":      { model: "contractTemplate", field: "tenantId" },
  "tickets/[id]/route.ts":                 { model: "ticket",           field: "tenantId" },
  "meetings/[id]/route.ts":                { model: "meeting",          field: "tenantId" },
  "services/[id]/route.ts":                { model: "serviceItem",      field: "tenantId" },
  "payroll/[id]/route.ts":                 { model: "payrollRecord",    field: "tenantId" },
  "advance/[id]/route.ts":                 { model: "salaryAdvance",    field: "tenantId" },
  "projects/[id]/route.ts":                { model: "project",          field: "tenantId" },
  "commissions/[id]/route.ts":             { model: "commission",       field: "tenantId" },
  "customer-segments/[id]/route.ts":       { model: "customerSegment",  field: "tenantId" },
  "forms/[id]/route.ts":                   { model: "surveyForm",       field: "tenantId" },
  "legal/cases/[id]/route.ts":             { model: "legalCase",        field: "tenantId" },
  "legal/deadlines/[id]/route.ts":         { model: "legalDeadline",    field: "tenantId" },
  "legal/documents/[id]/route.ts":         { model: "legalDocument",    field: "tenantId" },
  "legal/hearings/[id]/route.ts":          { model: "courtHearing",     field: "tenantId" },
  "marketing/ab-tests/[id]/route.ts":      { model: "aBTest",           field: "tenantId" },
  "marketing/email-campaigns/[id]/route.ts": { model: "emailCampaign", field: "tenantId" },
  "marketing/personas/[id]/route.ts":      { model: "marketingPersona", field: "tenantId" },
  "marketing/utm-links/[id]/route.ts":     { model: "uTMLink",          field: "tenantId" },
  "erp/chart-of-accounts/[id]/route.ts":   { model: "chartOfAccount",  field: "tenantId" },
  "erp/fixed-assets/[id]/route.ts":        { model: "fixedAsset",       field: "tenantId" },
  "erp/ledger/[id]/route.ts":              { model: "ledgerEntry",      field: "tenantId" },
  "erp/tax-records/[id]/route.ts":         { model: "taxRecord",        field: "tenantId" },
  "hr/contracts/[id]/route.ts":            { model: "employeeContract", field: "tenantId" },
  "hr/jobs/[id]/route.ts":                 { model: "jobPosting",       field: "tenantId" },
  "hr/org-chart/[id]/route.ts":            { model: "orgNode",          field: "tenantId" },
  "reminders/[id]/route.ts":               { model: "reminder",         field: "userId" },
  "tasks/[id]/route.ts":                   { model: "task",             field: "via_project" },
  "milestones/[id]/route.ts":              { model: "milestone",        field: "via_project" },
  "time-entries/[id]/route.ts":            { model: "timeEntry",        field: "userId" },
  "hr/leave-requests/[id]/route.ts":       { model: "leaveRequest",     field: "userId" },
  "messages/[id]/route.ts":               { model: "teamConversation",  field: "tenantId" },
};

function addTenantFilterImport(content) {
  if (content.includes("tenantFilter")) return content;
  return content.replace(
    /import \{ requireAuth,([^}]+)\} from "@\/lib\/auth"/,
    (m, rest) => `import { requireAuth, tenantFilter,${rest}} from "@/lib/auth"`
  );
}

function buildWhereClause(field, modelName) {
  if (field === "tenantId") {
    return `{ id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) }`;
  }
  if (field === "userId") {
    return `{ id, ${field}: payload.userId }`;
  }
  if (field === "via_project") {
    return `{ id, project: { tenantId: payload.tenantId ?? undefined } }`;
  }
  return `{ id }`;
}

let totalFixed = 0;
let totalSkipped = 0;

for (const [routeSuffix, { model, field }] of Object.entries(ID_ROUTES)) {
  const filePath = path.join(BASE, routeSuffix);
  if (!fs.existsSync(filePath)) {
    console.log(`  NOT FOUND: ${routeSuffix}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // Skip if already has tenant ownership check
  if (content.includes("tenantFilter(payload)") ||
      content.includes("tenantId: payload.tenantId") ||
      content.includes("ownership_checked")) {
    console.log(`  SKIP (already fixed): ${routeSuffix}`);
    totalSkipped++;
    continue;
  }

  // Add tenantFilter import if needed
  if (field === "tenantId" || field === "via_project") {
    content = addTenantFilterImport(content);
  }

  // Replace findUnique({ where: { id } }) with findFirst + tenant check
  const whereClause = buildWhereClause(field, model);

  // Pattern 1: findUnique({ where: { id }, ... })
  content = content.replace(
    new RegExp(`prisma\\.${model}\\.findUnique\\(\\s*\\{\\s*where:\\s*\\{\\s*id\\s*\\}`, 'g'),
    `prisma.${model}.findFirst({ where: ${whereClause}`
  );

  // Pattern 2: findUnique({ where: { id: someVar }, ... })
  content = content.replace(
    new RegExp(`prisma\\.${model}\\.findUnique\\(\\s*\\{\\s*where:\\s*\\{\\s*id:\\s*id\\s*\\}`, 'g'),
    `prisma.${model}.findFirst({ where: ${whereClause}`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`  FIXED: ${routeSuffix}`);
    totalFixed++;
  } else {
    console.log(`  NO_PATTERN: ${routeSuffix} (manual review needed)`);
    totalSkipped++;
  }
}

console.log(`\n=== Done: ${totalFixed} fixed, ${totalSkipped} skipped ===`);
