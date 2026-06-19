const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Persicore";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? APP_URL;

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function createTransporter() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createTransport } = require("nodemailer");
  return createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendContractSigningEmail(opts: {
  to: string;
  clientName: string;
  contractTitle: string;
  signLink: string;
  expiresAt?: Date | null;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured — skipping contract sign email");
    return;
  }
  const { to, clientName, contractTitle, signLink, expiresAt } = opts;
  const transporter = createTransporter();
  const expiry = expiresAt
    ? `<p style="color:#aaa;font-size:13px;margin-top:8px;">این لینک تا <strong style="color:#f0c96e;">${expiresAt.toLocaleDateString("fa-IR")}</strong> معتبر است.</p>`
    : "";
  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to,
    subject: `قرارداد جدید برای امضا — ${contractTitle}`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:16px;">
        <h2 style="color:#d4a843;margin:0 0 8px;">قرارداد جدید برای امضا</h2>
        <p style="color:#aaa;margin:0 0 24px;">سلام ${clientName}،</p>
        <p style="color:#ccc;margin:0 0 8px;">قرارداد <strong style="color:#fff;">${contractTitle}</strong> آماده بررسی و امضای شماست.</p>
        ${expiry}
        <div style="margin:28px 0;">
          <a href="${signLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:10px;text-decoration:none;font-size:15px;">مشاهده و امضای قرارداد</a>
        </div>
        <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;">
        <p style="color:#555;font-size:11px;">لینک مستقیم: <a href="${signLink}" style="color:#d4a843;">${signLink}</a></p>
        <p style="color:#444;font-size:11px;margin-top:8px;">اگر این ایمیل به اشتباه دریافت کرده‌اید، آن را نادیده بگیرید.</p>
      </div>
    `,
  });
}

export async function sendContractSignedNotification(opts: {
  adminEmail: string;
  clientName: string;
  contractTitle: string;
  signedAt: Date;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured — skipping contract signed notification");
    return;
  }
  const { adminEmail, clientName, contractTitle, signedAt } = opts;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to: adminEmail,
    subject: `✅ قرارداد امضا شد — ${contractTitle}`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:16px;">
        <h2 style="color:#10b981;margin:0 0 8px;">قرارداد امضا شد ✅</h2>
        <p style="color:#aaa;margin:0 0 24px;">مشتری قرارداد را با موفقیت امضا کرد.</p>
        <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;"><span style="color:#888;">قرارداد:</span> <strong style="color:#fff;">${contractTitle}</strong></p>
          <p style="margin:0 0 8px;"><span style="color:#888;">مشتری:</span> <strong style="color:#fff;">${clientName}</strong></p>
          <p style="margin:0;"><span style="color:#888;">زمان:</span> <strong style="color:#d4a843;">${signedAt.toLocaleDateString("fa-IR")} — ${signedAt.toLocaleTimeString("fa-IR")}</strong></p>
        </div>
        <a href="${APP_URL}/contracts" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:10px;text-decoration:none;">مشاهده قرارداد</a>
      </div>
    `,
  });
}

export async function sendInvoiceSigningEmail(opts: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  signLink: string;
  dueDate: Date;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured — skipping invoice sign email");
    return;
  }
  const { to, clientName, invoiceNumber, total, signLink, dueDate } = opts;
  const transporter = createTransporter();
  const totalM = (total / 1_000_000).toFixed(1);
  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to,
    subject: `فاکتور ${invoiceNumber} — نیاز به امضا`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:16px;">
        <h2 style="color:#d4a843;margin:0 0 8px;">فاکتور جدید برای امضا</h2>
        <p style="color:#aaa;margin:0 0 24px;">سلام ${clientName}،</p>
        <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;"><span style="color:#888;">شماره فاکتور:</span> <strong style="color:#fff;">${invoiceNumber}</strong></p>
          <p style="margin:0 0 8px;"><span style="color:#888;">مبلغ:</span> <strong style="color:#d4a843;">${totalM} میلیون تومان</strong></p>
          <p style="margin:0;"><span style="color:#888;">سررسید:</span> <strong style="color:#fff;">${dueDate.toLocaleDateString("fa-IR")}</strong></p>
        </div>
        <div style="margin:28px 0;">
          <a href="${signLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:10px;text-decoration:none;font-size:15px;">مشاهده و امضای فاکتور</a>
        </div>
        <p style="color:#555;font-size:11px;">لینک مستقیم: <a href="${signLink}" style="color:#d4a843;">${signLink}</a></p>
      </div>
    `,
  });
}

export async function sendInvoiceSignedNotification(opts: {
  adminEmail: string;
  clientName: string;
  invoiceNumber: string;
  signedAt: Date;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured — skipping invoice signed notification");
    return;
  }
  const { adminEmail, clientName, invoiceNumber, signedAt } = opts;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to: adminEmail,
    subject: `✅ فاکتور ${invoiceNumber} امضا شد`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:16px;">
        <h2 style="color:#10b981;margin:0 0 8px;">فاکتور امضا شد ✅</h2>
        <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;"><span style="color:#888;">فاکتور:</span> <strong style="color:#fff;">${invoiceNumber}</strong></p>
          <p style="margin:0 0 8px;"><span style="color:#888;">مشتری:</span> <strong style="color:#fff;">${clientName}</strong></p>
          <p style="margin:0;"><span style="color:#888;">زمان:</span> <strong style="color:#d4a843;">${signedAt.toLocaleDateString("fa-IR")}</strong></p>
        </div>
        <a href="${APP_URL}/invoicing" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:10px;text-decoration:none;">مشاهده فاکتور</a>
      </div>
    `,
  });
}

export async function sendTicketCreatedEmail(opts: {
  adminEmail: string;
  ticketTitle: string;
  reporterName: string;
  priority: string;
  ticketId: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const { adminEmail, ticketTitle, reporterName, priority, ticketId } = opts;
  const transporter = createTransporter();
  const link = `${APP_URL}/tickets`;
  const priorityMap: Record<string, string> = { low: "پایین", medium: "متوسط", high: "بالا", urgent: "فوری" };
  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to: adminEmail,
    subject: `تیکت جدید: ${ticketTitle}`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:16px;">
        <h2 style="color:#d4a843;margin:0 0 8px;">تیکت جدید ثبت شد</h2>
        <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><span style="color:#888;">عنوان:</span> <strong style="color:#fff;">${ticketTitle}</strong></p>
          <p style="margin:0 0 8px;"><span style="color:#888;">گزارش‌دهنده:</span> <strong style="color:#fff;">${reporterName}</strong></p>
          <p style="margin:0;"><span style="color:#888;">اولویت:</span> <strong style="color:#d4a843;">${priorityMap[priority] ?? priority}</strong></p>
        </div>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:10px;text-decoration:none;">مشاهده تیکت‌ها</a>
      </div>
    `,
  });
}

export async function sendTicketReplyEmail(opts: {
  to: string;
  ticketTitle: string;
  replyBy: string;
  replyText: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const { to, ticketTitle, replyBy, replyText } = opts;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to,
    subject: `پاسخ جدید به تیکت: ${ticketTitle}`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f0f11;color:#e5e5e5;border-radius:16px;">
        <h2 style="color:#d4a843;margin:0 0 8px;">پاسخ جدید به تیکت شما</h2>
        <p style="color:#aaa;margin:0 0 16px;">تیکت: <strong style="color:#fff;">${ticketTitle}</strong></p>
        <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;color:#888;font-size:12px;">پاسخ از ${replyBy}:</p>
          <p style="margin:0;color:#e5e5e5;">${replyText}</p>
        </div>
        <a href="${APP_URL}/tickets" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:10px;text-decoration:none;">مشاهده تیکت</a>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured — skipping email send");
    return;
  }

  const resetLink = `${PORTAL_URL}/reset-password/${token}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to,
    subject: `بازنشانی رمز عبور پرتال ${APP_NAME}`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f11;color:#e5e5e5;border-radius:12px;">
        <h2 style="color:#d4a843;margin-bottom:8px;">بازنشانی رمز عبور</h2>
        <p style="color:#aaa;margin-bottom:24px;">برای بازنشانی رمز عبور خود روی دکمه زیر کلیک کنید:</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#d4a843,#f0c96e);color:#000;font-weight:bold;border-radius:8px;text-decoration:none;">تغییر رمز عبور</a>
        <p style="margin-top:24px;color:#888;font-size:12px;">این لینک تا ۱ ساعت معتبر است.<br>اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
        <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;">
        <p style="color:#555;font-size:11px;">لینک مستقیم: <a href="${resetLink}" style="color:#d4a843;">${resetLink}</a></p>
      </div>
    `,
  });
}
