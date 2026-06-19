/**
 * reset-demo-data.js
 * Wipes ALL tenant/user data, keeping only the superadmin user and plan configs.
 * Run before going to production.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SUPERADMIN_ID = "cmq7zvnng0000dehf14xlc3lw"; // admin@persicore.ir

async function del(model, label, where = {}) {
  try {
    const r = await prisma[model].deleteMany({ where });
    if (r.count > 0) console.log(`  ✓ ${label}: ${r.count} deleted`);
  } catch (e) {
    console.log(`  ⚠ ${label}: ${e.message.split("\n")[0]}`);
  }
}

async function main() {
  console.log("=== PersicoCRM — Production Reset ===\n");

  // ── 1. Portal ─────────────────────────────────────────────────────────────
  console.log("[ Portal ]");
  await del("portalNotification", "PortalNotification");
  await del("portalTicketReply",  "PortalTicketReply");
  await del("portalTicket",       "PortalTicket");
  await del("portalPayment",      "PortalPayment");
  await del("portalMessage",      "PortalMessage");
  await del("portalUser",         "PortalUser");

  // ── 2. ERP / Finance ──────────────────────────────────────────────────────
  console.log("\n[ ERP / Finance ]");
  await del("ledgerEntry",    "LedgerEntry");
  await del("chartOfAccount", "ChartOfAccount");
  await del("bankTransaction","BankTransaction");
  await del("bankCheck",      "BankCheck");
  await del("bankAccount",    "BankAccount");
  await del("fixedAsset",     "FixedAsset");
  await del("taxRecord",      "TaxRecord");

  // ── 3. Invoices & Expenses ────────────────────────────────────────────────
  console.log("\n[ Invoices & Expenses ]");
  await del("installment", "Installment");
  await del("invoice",     "Invoice");
  await del("expense",     "Expense");

  // ── 4. Contracts ─────────────────────────────────────────────────────────
  console.log("\n[ Contracts ]");
  await del("contract",         "Contract");
  await del("contractTemplate", "ContractTemplate");

  // ── 5. Projects & Tasks ───────────────────────────────────────────────────
  console.log("\n[ Projects & Tasks ]");
  await del("taskComment",    "TaskComment");
  await del("task",           "Task");
  await del("deployChecklist","DeployChecklist");
  await del("milestone",      "Milestone");
  await del("timeEntry",      "TimeEntry");
  await del("project",        "Project");

  // ── 6. Leads ──────────────────────────────────────────────────────────────
  console.log("\n[ Leads ]");
  await del("leadActivity", "LeadActivity");
  await del("lead",         "Lead");

  // ── 7. Clients ────────────────────────────────────────────────────────────
  console.log("\n[ Clients ]");
  await del("client", "Client");

  // ── 8. Marketing ──────────────────────────────────────────────────────────
  console.log("\n[ Marketing ]");
  await del("landingPageLead", "LandingPageLead");
  await del("landingPage",     "LandingPage");
  await del("contentPiece",    "ContentPiece");
  await del("campaign",        "Campaign");
  await del("uTMLink",         "UTMLink");
  await del("emailCampaign",   "EmailCampaign");
  await del("marketingPersona","MarketingPersona");
  await del("aBTest",          "ABTest");

  // ── 9. Support Tickets ────────────────────────────────────────────────────
  console.log("\n[ Tickets ]");
  await del("ticketComment", "TicketComment");
  await del("ticket",        "Ticket");

  // ── 10. Comms ──────────────────────────────────────────────────────────────
  console.log("\n[ Comms ]");
  await del("teamMessage",     "TeamMessage");
  await del("teamConversation","TeamConversation");
  await del("meetingAttendee", "MeetingAttendee");
  await del("meeting",         "Meeting");
  await del("callLog",         "CallLog");

  // ── 11. Wiki / Files / Blog ───────────────────────────────────────────────
  console.log("\n[ Wiki / Files / Blog ]");
  await del("wikiArticle", "WikiArticle");
  await del("wikiFolder",  "WikiFolder");
  await del("fileItem",    "FileItem");
  await del("fileFolder",  "FileFolder");
  await del("blogPost",    "BlogPost");
  await del("blogCategory","BlogCategory");

  // ── 12. HR ────────────────────────────────────────────────────────────────
  console.log("\n[ HR ]");
  await del("trainingEnrollment", "TrainingEnrollment");
  await del("trainingCourse",     "TrainingCourse");
  await del("jobApplication",     "JobApplication");
  await del("jobPosting",         "JobPosting");
  await del("leaveRequest",       "LeaveRequest");
  await del("attendance",         "Attendance");
  await del("employeeContract",   "EmployeeContract");
  await del("employeeBenefit",    "EmployeeBenefit");
  await del("performanceKPI",     "PerformanceKPI");
  await del("orgNode",            "OrgNode");
  await del("salaryAdvance",      "SalaryAdvance");
  await del("payrollRecord",      "PayrollRecord");

  // ── 13. Other ─────────────────────────────────────────────────────────────
  console.log("\n[ Other ]");
  await del("courtHearing",   "CourtHearing");
  await del("legalDeadline",  "LegalDeadline");
  await del("legalDocument",  "LegalDocument");
  await del("legalContract",  "LegalContract");
  await del("legalCase",      "LegalCase");
  await del("formResponse",   "FormResponse");
  await del("surveyForm",     "SurveyForm");
  await del("serviceItem",    "ServiceItem");
  await del("commission",     "Commission");
  await del("commissionInvoice","CommissionInvoice");
  await del("walletTransaction","WalletTransaction");
  await del("customerSegment","CustomerSegment");
  await del("resume",         "Resume");
  await del("proposal",       "Proposal");
  await del("reminder",       "Reminder");
  await del("notification",   "Notification");
  await del("activityLog",    "ActivityLog");

  // ── 14. Admin panel data ──────────────────────────────────────────────────
  console.log("\n[ Admin Panel ]");
  await del("supportReply",      "SupportReply");
  await del("supportRequest",    "SupportRequest");
  await del("systemAnnouncement","SystemAnnouncement");
  await del("couponUse",         "CouponUse");
  await del("coupon",            "Coupon");
  await del("tenantPayment",     "TenantPayment");

  // ── 15. Users & Tenants (all except superadmin) ──────────────────────────
  console.log("\n[ Users & Tenants ]");
  await del("user",   "Users (demo)", { id: { not: SUPERADMIN_ID } });
  await del("tenant", "Tenants");

  // ── 16. Site/Company settings — KEEP (do not delete) ─────────────────────
  console.log("\n[ Kept (not deleted) ]");
  const planCount = await prisma.planConfig.count().catch(() => 0);
  const siteCount = await prisma.siteSettings.count().catch(() => 0);
  const compCount = await prisma.companySettings.count().catch(() => 0);
  console.log(`  • PlanConfig: ${planCount} records kept`);
  console.log(`  • SiteSettings: ${siteCount} records kept`);
  console.log(`  • CompanySettings: ${compCount} records kept`);

  // ── Final count ───────────────────────────────────────────────────────────
  const remainingUsers = await prisma.user.count();
  console.log(`\n=== Done ===`);
  console.log(`Remaining users: ${remainingUsers} (superadmin only)`);
  console.log(`Superadmin: admin@persicore.ir`);
  console.log(`The platform is now clean and ready for production.`);
}

main()
  .catch((e) => { console.error("\nFATAL:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
