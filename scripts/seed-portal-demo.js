const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const CLIENT_ID       = "cmq853lu30003cu42wdq3yfz0";
const TENANT_ID       = "cmq852u160000cu42wv89ov1v";
const ADMIN_ID        = "cmq7zvnng0000dehf14xlc3lw";
const PORTAL_USER_ID  = "cmq8cfvb50001r3i24cnvu95n";

const contractContent = `
<div dir="rtl" style="font-family:Vazirmatn,sans-serif;line-height:2;color:inherit">
  <h2 style="font-size:1.4rem;font-weight:700;text-align:center;margin-bottom:1.5rem;border-bottom:2px solid #3b82f6;padding-bottom:1rem">
    قرارداد توسعه نرم‌افزار
  </h2>

  <h3 style="font-size:1.1rem;font-weight:600;color:#3b82f6;margin-top:1.5rem">ماده ۱ — طرفین قرارداد</h3>
  <p>این قرارداد بین <strong>شرکت پرسی‌کور</strong> (توسعه‌دهنده) و <strong>شرکت فناوری آرمان</strong> (کارفرما) به شرح زیر منعقد می‌گردد.</p>

  <h3 style="font-size:1.1rem;font-weight:600;color:#3b82f6;margin-top:1.5rem">ماده ۲ — موضوع قرارداد</h3>
  <p>طراحی، توسعه و راه‌اندازی پلتفرم فروشگاه اینترنتی B2C شامل موارد زیر:</p>
  <ul style="padding-right:1.5rem">
    <li>طراحی UI/UX کامل با استانداردهای روز</li>
    <li>توسعه فرانت‌اند با Next.js 15 و Tailwind CSS</li>
    <li>توسعه بک‌اند با Node.js و PostgreSQL</li>
    <li>درگاه پرداخت (زرین‌پال / ملت)</li>
    <li>پنل مدیریت محصول و سفارشات</li>
    <li>سیستم مدیریت کاربران و نقش‌ها</li>
  </ul>

  <h3 style="font-size:1.1rem;font-weight:600;color:#3b82f6;margin-top:1.5rem">ماده ۳ — مبلغ و شرایط پرداخت</h3>
  <p>مبلغ کل قرارداد: <strong>۱۸۰,۰۰۰,۰۰۰ تومان</strong> (یکصد و هشتاد میلیون تومان) طبق جدول زیر:</p>
  <table style="width:100%;border-collapse:collapse;margin:1rem 0">
    <thead><tr style="background:rgba(59,130,246,0.1)">
      <th style="padding:.5rem;text-align:right;border:1px solid rgba(0,0,0,0.1)">مرحله</th>
      <th style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">درصد</th>
      <th style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">مبلغ (تومان)</th>
    </tr></thead>
    <tbody>
      <tr><td style="padding:.5rem;border:1px solid rgba(0,0,0,0.1)">پیش‌پرداخت (عقد قرارداد)</td><td style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">۵۰٪</td><td style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">۹۰,۰۰۰,۰۰۰</td></tr>
      <tr><td style="padding:.5rem;border:1px solid rgba(0,0,0,0.1)">تحویل نسخه آزمایشی</td><td style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">۳۰٪</td><td style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">۵۴,۰۰۰,۰۰۰</td></tr>
      <tr><td style="padding:.5rem;border:1px solid rgba(0,0,0,0.1)">تحویل نهایی و راه‌اندازی</td><td style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">۲۰٪</td><td style="padding:.5rem;text-align:center;border:1px solid rgba(0,0,0,0.1)">۳۶,۰۰۰,۰۰۰</td></tr>
    </tbody>
  </table>

  <h3 style="font-size:1.1rem;font-weight:600;color:#3b82f6;margin-top:1.5rem">ماده ۴ — زمان‌بندی</h3>
  <p>مدت اجرای پروژه <strong>۴ ماه</strong> از تاریخ عقد قرارداد و اخذ پیش‌پرداخت می‌باشد.</p>

  <h3 style="font-size:1.1rem;font-weight:600;color:#3b82f6;margin-top:1.5rem">ماده ۵ — ضمانت و پشتیبانی</h3>
  <p>پس از تحویل نهایی، <strong>۶ ماه</strong> پشتیبانی رایگان ارائه می‌گردد. پس از آن پشتیبانی دوره‌ای با قرارداد جداگانه امکان‌پذیر است.</p>

  <h3 style="font-size:1.1rem;font-weight:600;color:#3b82f6;margin-top:1.5rem">ماده ۶ — تعهدات</h3>
  <p>کارفرما متعهد می‌گردد محتوا و مستندات لازم را ظرف ۷ روز کاری در اختیار تیم توسعه قرار دهد. تیم توسعه متعهد به رعایت محرمانگی اطلاعات شرکت کارفرما می‌باشد.</p>

  <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid rgba(0,0,0,0.1);display:grid;grid-template-columns:1fr 1fr;gap:2rem">
    <div style="text-align:center">
      <p style="font-weight:600;margin-bottom:.5rem">امضای پرسی‌کور</p>
      <p style="font-size:.8rem;color:#666">مدیر سیستم</p>
    </div>
    <div style="text-align:center">
      <p style="font-weight:600;margin-bottom:.5rem">امضای کارفرما</p>
      <p style="font-size:.8rem;color:#666">شرکت فناوری آرمان</p>
    </div>
  </div>
</div>
`;

async function main() {
  // 0. Clean up previous runs
  await prisma.portalMessage.deleteMany({ where: { clientId: CLIENT_ID } });
  await prisma.portalTicket.deleteMany({ where: { clientId: CLIENT_ID } });
  await prisma.contract.deleteMany({ where: { clientId: CLIENT_ID } });
  await prisma.invoice.deleteMany({ where: { clientId: CLIENT_ID } });
  await prisma.project.deleteMany({ where: { clientId: CLIENT_ID } });
  console.log("✓ Cleaned up previous data");

  // 1. Update client
  await prisma.client.update({
    where: { id: CLIENT_ID },
    data: {
      companyName: "شرکت فناوری آرمان",
      contactName: "علی رضایی",
      contactPhone: "09121234567",
      contactEmail: "ali.rezaei@armantech.ir",
      website: "https://armantech.ir",
      address: "تهران، خیابان ولیعصر، پلاک ۱۲۴",
      totalRevenue: 450000000,
      notes: "مشتری VIP — قرارداد سالانه توسعه نرم‌افزار",
    },
  });
  console.log("✓ Client updated");

  // 2. Projects
  await prisma.project.create({ data: {
    name: "پلتفرم فروشگاه آنلاین",
    status: "in_progress", progress: 65,
    startDate: new Date("2026-04-01"),
    deadline: new Date("2026-08-15"),
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    description: "توسعه فروشگاه اینترنتی B2C با پنل مدیریت",
    budget: 180000000,
  }});
  await prisma.project.create({ data: {
    name: "اپلیکیشن موبایل CRM",
    status: "planning", progress: 20,
    startDate: new Date("2026-06-01"),
    deadline: new Date("2026-10-01"),
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    description: "اپ اندروید و iOS برای مدیریت مشتریان",
    budget: 120000000,
  }});
  await prisma.project.create({ data: {
    name: "بازطراحی وب‌سایت شرکت",
    status: "completed", progress: 100,
    startDate: new Date("2026-02-01"),
    deadline: new Date("2026-05-01"),
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    description: "ریدیزاین کامل با Next.js و Tailwind",
    budget: 45000000,
  }});
  console.log("✓ Projects created");

  // 3. Invoices
  await prisma.invoice.create({ data: {
    invoiceNumber: "INV-2026-041",
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    issuedAt: new Date("2026-04-01"), dueDate: new Date("2026-04-30"),
    status: "overdue",
    items: [{ description: "پیش‌پرداخت پروژه فروشگاه — فاز اول", quantity: 1, unitPrice: 90000000, total: 90000000 }],
    subtotal: 90000000, taxAmount: 9000000, total: 99000000,
    notes: "پرداخت در موعد مقرر",
  }});
  await prisma.invoice.create({ data: {
    invoiceNumber: "INV-2026-031",
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    issuedAt: new Date("2026-03-01"), dueDate: new Date("2026-03-25"),
    status: "paid",
    paidAt: new Date("2026-03-24"),
    items: [{ description: "بازطراحی وب‌سایت — تحویل نهایی", quantity: 1, unitPrice: 45000000, total: 45000000 }],
    subtotal: 45000000, taxAmount: 4500000, total: 49500000,
  }});
  await prisma.invoice.create({ data: {
    invoiceNumber: "INV-2026-051",
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    issuedAt: new Date("2026-05-20"), dueDate: new Date("2026-06-20"),
    status: "sent",
    items: [{ description: "اپلیکیشن موبایل — فاز طراحی UI", quantity: 1, unitPrice: 35000000, total: 35000000 }],
    subtotal: 35000000, taxAmount: 3500000, total: 38500000,
  }});
  console.log("✓ Invoices created");

  // 4. Tickets
  await prisma.portalTicket.create({ data: {
    title: "خطا در بارگذاری تصاویر محصولات",
    description: "در بخش مدیریت فروشگاه هنگام آپلود تصویر خطای ۵۰۰ برمی‌گردد",
    status: "in_progress", priority: "high",
    clientId: CLIENT_ID,
    portalUserId: PORTAL_USER_ID,
  }});
  await prisma.portalTicket.create({ data: {
    title: "درخواست افزودن فیلتر جستجوی پیشرفته",
    description: "نیاز داریم بتوانیم محصولات را بر اساس برند و قیمت فیلتر کنیم",
    status: "open", priority: "medium",
    clientId: CLIENT_ID,
    portalUserId: PORTAL_USER_ID,
  }});
  console.log("✓ Tickets created");

  // 5. Contract (admin already signed, waiting for client)
  const signToken = crypto.randomBytes(32).toString("hex");
  await prisma.contract.create({ data: {
    title: "قرارداد توسعه پلتفرم فروشگاه آنلاین",
    clientId: CLIENT_ID, tenantId: TENANT_ID,
    status: "admin_signed",
    signToken,
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    adminSignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    content: contractContent,
  }});
  console.log("✓ Contract created — signToken:", signToken);

  // 6. Portal messages
  await prisma.portalMessage.create({ data: {
    clientId: CLIENT_ID,
    crmUserId: ADMIN_ID, authorName: "مدیر پروژه",
    authorType: "crm",
    content: "سلام، گزارش پیشرفت فاز اول فروشگاه آماده شد. لطفاً مرور بفرمایید.",
  }});
  await prisma.portalMessage.create({ data: {
    clientId: CLIENT_ID,
    crmUserId: ADMIN_ID, authorName: "تیم فنی",
    authorType: "crm",
    content: "نسخه بتا محیط تست آماده است: staging.armantech.ir — لطفاً فیدبک بدهید.",
  }});
  console.log("✓ Messages created");

  console.log("\n=== DONE ===");
  console.log("Portal: http://localhost:3000/portal/login");
  console.log("Email:  client@demo.com");
  console.log("Pass:   client123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
