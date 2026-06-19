import { chromium } from "@playwright/test";
import { writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "DEPLOY.pdf");

const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
<title>راهنمای دپلوی Persicore CRM</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Vazirmatn', 'Tahoma', Arial, sans-serif;
    direction: rtl;
    text-align: right;
    background: #fff;
    color: #1a1a2e;
    font-size: 13px;
    line-height: 1.85;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm 16mm 14mm;
  }

  /* ─── Cover ─────────────────────────────────────────── */
  .cover {
    min-height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1040 50%, #0d0d20 100%);
    color: #fff;
    padding: 40mm 20mm;
    page-break-after: always;
  }

  .cover-logo {
    width: 80px; height: 80px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    border-radius: 22px;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; margin: 0 auto 28px;
    box-shadow: 0 20px 60px rgba(139,92,246,0.4);
  }

  .cover h1 {
    font-size: 32px; font-weight: 900;
    background: linear-gradient(135deg, #a78bfa, #f9a8d4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
  }
  .cover h2 { font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.5); margin-bottom: 40px; }

  .cover-badges {
    display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 48px;
  }
  .badge {
    padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
    border: 1px solid; letter-spacing: 0.03em;
  }
  .badge-purple { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.4); color: #c4b5fd; }
  .badge-blue   { background: rgba(59,130,246,0.15);  border-color: rgba(59,130,246,0.4);  color: #93c5fd; }
  .badge-green  { background: rgba(16,185,129,0.15);  border-color: rgba(16,185,129,0.4);  color: #6ee7b7; }

  .cover-domains {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 24px 32px;
    width: 100%; max-width: 400px;
    text-align: right;
  }
  .cover-domains h3 { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 14px; letter-spacing: 0.08em; }
  .domain-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; }
  .domain-row:last-child { border-bottom: none; }
  .domain-url { color: #a78bfa; font-family: 'Courier New', monospace; font-size: 11px; direction: ltr; }
  .domain-label { color: rgba(255,255,255,0.6); }

  .cover-footer { margin-top: 48px; font-size: 11px; color: rgba(255,255,255,0.2); }

  /* ─── TOC ────────────────────────────────────────────── */
  .toc-page {
    page-break-after: always;
    padding: 18mm 16mm;
  }
  .toc-title { font-size: 22px; font-weight: 800; color: #1a1a2e; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px; margin-bottom: 24px; }
  .toc-item { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed #e5e7eb; }
  .toc-num { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#8b5cf6,#ec4899); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .toc-label { font-size: 13px; font-weight: 500; color: #374151; flex: 1; }
  .toc-dots { flex: 1; border-bottom: 1px dotted #d1d5db; height: 1px; margin: 0 8px; }
  .toc-page-num { font-size: 11px; color: #9ca3af; }

  /* ─── Content ────────────────────────────────────────── */
  .content-page { padding: 18mm 16mm; page-break-inside: avoid; }

  .section {
    margin-bottom: 32px;
    page-break-inside: avoid;
  }

  .section-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 18px; padding-bottom: 10px;
    border-bottom: 2px solid #f3f0ff;
  }
  .section-num {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: #fff; font-size: 14px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 4px 12px rgba(139,92,246,0.3);
  }
  .section-title { font-size: 17px; font-weight: 800; color: #1a1a2e; }

  h3 { font-size: 13px; font-weight: 700; color: #374151; margin: 16px 0 8px; }

  p { margin-bottom: 8px; color: #374151; }

  /* ─── Code blocks ────────────────────────────────────── */
  pre {
    background: #1e1e2e;
    border-radius: 10px;
    padding: 14px 16px;
    margin: 10px 0;
    overflow: hidden;
    border-right: 3px solid #8b5cf6;
    page-break-inside: avoid;
  }
  pre code {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 10.5px;
    color: #cdd6f4;
    direction: ltr;
    display: block;
    text-align: left;
    line-height: 1.7;
    white-space: pre;
    word-break: break-all;
  }

  code {
    font-family: 'Courier New', monospace;
    font-size: 11px;
    background: #f3f0ff;
    color: #6d28d9;
    padding: 1px 6px;
    border-radius: 4px;
  }
  pre code { background: none; color: #cdd6f4; padding: 0; }

  /* comment color in bash blocks */
  .comment { color: #6c7086; }
  .keyword { color: #cba6f7; }
  .string  { color: #a6e3a1; }
  .var     { color: #89b4fa; }

  /* ─── Tables ─────────────────────────────────────────── */
  table {
    width: 100%; border-collapse: collapse;
    margin: 12px 0; font-size: 12px;
    page-break-inside: avoid;
  }
  th {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: #fff; padding: 9px 14px; font-weight: 700; font-size: 11px;
    letter-spacing: 0.03em;
  }
  td { padding: 8px 14px; border-bottom: 1px solid #f3f0ff; color: #374151; }
  tr:nth-child(even) td { background: #fafafa; }
  tr:hover td { background: #f5f3ff; }
  td code { font-size: 10px; }

  /* ─── Callouts ───────────────────────────────────────── */
  .callout {
    border-radius: 10px; padding: 12px 16px;
    margin: 12px 0; font-size: 12px;
    display: flex; gap: 10px; align-items: flex-start;
    page-break-inside: avoid;
  }
  .callout-icon { font-size: 18px; flex-shrink: 0; margin-top: -1px; }
  .callout-tip      { background: #f0fdf4; border-right: 3px solid #22c55e; }
  .callout-warning  { background: #fffbeb; border-right: 3px solid #f59e0b; }
  .callout-danger   { background: #fef2f2; border-right: 3px solid #ef4444; }
  .callout-info     { background: #eff6ff; border-right: 3px solid #3b82f6; }
  .callout p { margin: 0; }

  /* ─── Checklist ──────────────────────────────────────── */
  .checklist { list-style: none; space-y: 6px; }
  .checklist li {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 6px 0; border-bottom: 1px solid #f9fafb;
    font-size: 12px; color: #374151;
  }
  .check-box {
    width: 18px; height: 18px; border: 2px solid #d1d5db; border-radius: 4px;
    flex-shrink: 0; margin-top: 1px;
  }

  /* ─── ENV blocks ─────────────────────────────────────── */
  .env-section { margin-bottom: 12px; }
  .env-group-title { font-size: 10px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .env-row { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f3f0ff; font-size: 11px; font-family: 'Courier New', monospace; }
  .env-key   { color: #7c3aed; font-weight: 600; min-width: 220px; }
  .env-value { color: #059669; }
  .env-comment { color: #9ca3af; font-size: 10px; }

  /* ─── Page breaks ────────────────────────────────────── */
  .page-break { page-break-after: always; }
  @page { margin: 0; size: A4; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

  /* ─── Footer ─────────────────────────────────────────── */
  .page-footer {
    margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb;
    font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════ COVER ═══════════════════════════════ -->
<div class="cover">
  <div class="cover-logo">🚀</div>
  <h1>Persicore CRM</h1>
  <h2>راهنمای دپلوی روی سرور</h2>

  <div class="cover-badges">
    <span class="badge badge-purple">Next.js 15</span>
    <span class="badge badge-blue">MySQL 8</span>
    <span class="badge badge-green">Ubuntu 22.04</span>
    <span class="badge badge-purple">Nginx</span>
    <span class="badge badge-blue">PM2</span>
    <span class="badge badge-green">Let's Encrypt SSL</span>
  </div>

  <div class="cover-domains">
    <h3>ساختار ساب‌دامین‌ها</h3>
    <div class="domain-row"><span class="domain-label">صفحه اصلی</span><span class="domain-url">persicore.ir</span></div>
    <div class="domain-row"><span class="domain-label">پنل CRM</span><span class="domain-url">crm.persicore.ir</span></div>
    <div class="domain-row"><span class="domain-label">پورتال مشتریان</span><span class="domain-url">portal.persicore.ir</span></div>
    <div class="domain-row"><span class="domain-label">سوپر ادمین</span><span class="domain-url">admin.persicore.ir</span></div>
    <div class="domain-row"><span class="domain-label">بلاگ</span><span class="domain-url">blog.persicore.ir</span></div>
    <div class="domain-row"><span class="domain-label">رزومه‌ها</span><span class="domain-url">resume.persicore.ir</span></div>
    <div class="domain-row"><span class="domain-label">پروپوزال‌ها</span><span class="domain-url">proposal.persicore.ir</span></div>
  </div>

  <div class="cover-footer">Persicore CRM — نسخه ۱.۰ — ۱۴۰۵</div>
</div>

<!-- ═══════════════════════════════ TOC ══════════════════════════════════ -->
<div class="toc-page">
  <div class="toc-title">فهرست مطالب</div>
  <div class="toc-item"><div class="toc-num">۱</div><div class="toc-label">نیازمندی‌های سرور</div><div class="toc-dots"></div><div class="toc-page-num">۳</div></div>
  <div class="toc-item"><div class="toc-num">۲</div><div class="toc-label">نصب وابستگی‌ها (Node.js، MySQL، Nginx، PM2)</div><div class="toc-dots"></div><div class="toc-page-num">۳</div></div>
  <div class="toc-item"><div class="toc-num">۳</div><div class="toc-label">تنظیم DNS</div><div class="toc-dots"></div><div class="toc-page-num">۴</div></div>
  <div class="toc-item"><div class="toc-num">۴</div><div class="toc-label">SSL ویلدکارد (Let's Encrypt)</div><div class="toc-dots"></div><div class="toc-page-num">۴</div></div>
  <div class="toc-item"><div class="toc-num">۵</div><div class="toc-label">ساخت دیتابیس MySQL</div><div class="toc-dots"></div><div class="toc-page-num">۵</div></div>
  <div class="toc-item"><div class="toc-num">۶</div><div class="toc-label">کلون پروژه و تنظیم متغیرهای محیطی</div><div class="toc-dots"></div><div class="toc-page-num">۵</div></div>
  <div class="toc-item"><div class="toc-num">۷</div><div class="toc-label">دیتابیس — Migration و Seed</div><div class="toc-dots"></div><div class="toc-page-num">۷</div></div>
  <div class="toc-item"><div class="toc-num">۸</div><div class="toc-label">Build و اجرا با PM2</div><div class="toc-dots"></div><div class="toc-page-num">۷</div></div>
  <div class="toc-item"><div class="toc-num">۹</div><div class="toc-label">کانفیگ Nginx (هر ۷ ساب‌دامین)</div><div class="toc-dots"></div><div class="toc-page-num">۸</div></div>
  <div class="toc-item"><div class="toc-num">۱۰</div><div class="toc-label">Cron Job قراردادها</div><div class="toc-dots"></div><div class="toc-page-num">۱۱</div></div>
  <div class="toc-item"><div class="toc-num">۱۱</div><div class="toc-label">بروزرسانی پروژه</div><div class="toc-dots"></div><div class="toc-page-num">۱۱</div></div>
  <div class="toc-item"><div class="toc-num">۱۲</div><div class="toc-label">چک‌لیست نهایی قبل از لانچ</div><div class="toc-dots"></div><div class="toc-page-num">۱۲</div></div>
  <div class="toc-item"><div class="toc-num">۱۳</div><div class="toc-label">نکات امنیتی مهم</div><div class="toc-dots"></div><div class="toc-page-num">۱۲</div></div>
</div>

<!-- ═══════════════════════════════ CONTENT ══════════════════════════════ -->
<div class="content-page">

<!-- ─── ۱. Server Requirements ─────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۱</div>
    <div class="section-title">نیازمندی‌های سرور</div>
  </div>
  <table>
    <tr><th>مشخصه</th><th>حداقل</th><th>توصیه‌شده</th></tr>
    <tr><td>سیستم‌عامل</td><td>Ubuntu 22.04 LTS</td><td>Ubuntu 22.04 LTS</td></tr>
    <tr><td>RAM</td><td>۲ گیگابایت</td><td>۴ گیگابایت</td></tr>
    <tr><td>CPU</td><td>۱ هسته</td><td>۲ هسته</td></tr>
    <tr><td>Disk</td><td>۲۰ گیگابایت SSD</td><td>۵۰ گیگابایت SSD</td></tr>
    <tr><td>پورت‌های باز</td><td colspan="2">80 (HTTP), 443 (HTTPS), 22 (SSH)</td></tr>
  </table>
</div>

<!-- ─── ۲. Install Dependencies ────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۲</div>
    <div class="section-title">نصب وابستگی‌ها</div>
  </div>
  <pre><code><span class="comment"># بروزرسانی سیستم</span>
sudo apt update && sudo apt upgrade -y

<span class="comment"># Node.js 20 LTS</span>
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

<span class="comment"># PM2 (مدیریت پروسه — auto-restart)</span>
sudo npm install -g pm2

<span class="comment"># MySQL 8.0</span>
sudo apt install -y mysql-server
sudo mysql_secure_installation

<span class="comment"># Nginx (reverse proxy)</span>
sudo apt install -y nginx

<span class="comment"># Certbot (SSL رایگان)</span>
sudo apt install -y certbot python3-certbot-nginx</code></pre>

  <div class="callout callout-tip">
    <span class="callout-icon">✅</span>
    <p>تأیید نصب Node.js: <code>node --version</code> باید <code>v20.x.x</code> نشان دهد.</p>
  </div>
</div>

<!-- ─── ۳. DNS ────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۳</div>
    <div class="section-title">تنظیم DNS</div>
  </div>
  <p>در کنترل پنل دامنه رکوردهای زیر را اضافه کنید:</p>
  <table>
    <tr><th>Type</th><th>Name</th><th>Value</th><th>TTL</th></tr>
    <tr><td><code>A</code></td><td><code>@</code></td><td>YOUR_SERVER_IP</td><td>300</td></tr>
    <tr><td><code>A</code></td><td><code>www</code></td><td>YOUR_SERVER_IP</td><td>300</td></tr>
    <tr><td><code>A</code></td><td><code>*</code></td><td>YOUR_SERVER_IP</td><td>300</td></tr>
  </table>
  <div class="callout callout-info">
    <span class="callout-icon">ℹ️</span>
    <p>رکورد <code>*</code> (ویلدکارد) همه ساب‌دامین‌ها را به سرور هدایت می‌کند. DNS propagation ممکن است تا ۲۴ ساعت طول بکشد.</p>
  </div>
</div>

<!-- ─── ۴. SSL ────────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۴</div>
    <div class="section-title">SSL ویلدکارد (Let's Encrypt)</div>
  </div>
  <pre><code><span class="comment"># گواهی ویلدکارد برای دامنه اصلی و همه ساب‌دامین‌ها</span>
sudo certbot certonly \
  --manual \
  --preferred-challenges=dns \
  -d persicore.ir \
  -d "*.persicore.ir"</code></pre>
  <div class="callout callout-warning">
    <span class="callout-icon">⚠️</span>
    <p>Certbot از شما می‌خواهد یک رکورد <code>TXT _acme-challenge.persicore.ir</code> در DNS اضافه کنید. پس از افزودن، چند دقیقه صبر کنید سپس Enter بزنید.</p>
  </div>
  <p>مسیر گواهی‌ها پس از صدور:</p>
  <pre><code>/etc/letsencrypt/live/persicore.ir/fullchain.pem
/etc/letsencrypt/live/persicore.ir/privkey.pem</code></pre>
  <p>تجدید خودکار SSL:</p>
  <pre><code><span class="comment"># افزودن به crontab برای تجدید خودکار</span>
echo "0 3 * * * certbot renew --quiet && systemctl reload nginx" | sudo crontab -</code></pre>
</div>

</div>

<!-- page break before MySQL + ENV -->
<div class="page-break"></div>
<div class="content-page">

<!-- ─── ۵. MySQL ──────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۵</div>
    <div class="section-title">ساخت دیتابیس MySQL</div>
  </div>
  <pre><code>sudo mysql -u root -p</code></pre>
  <pre><code>CREATE DATABASE persicore_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_persian_ci;
CREATE USER 'persicore'@'localhost' IDENTIFIED BY 'YOUR_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON persicore_crm.* TO 'persicore'@'localhost';
FLUSH PRIVILEGES;
EXIT;</code></pre>
</div>

<!-- ─── ۶. Clone + ENV ───────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۶</div>
    <div class="section-title">کلون پروژه و متغیرهای محیطی</div>
  </div>
  <pre><code><span class="comment"># کلون پروژه</span>
cd /var/www
sudo git clone https://github.com/YOUR_REPO/persicorecrm.git
cd persicorecrm/crm

<span class="comment"># نصب وابستگی‌ها</span>
npm install --legacy-peer-deps

<span class="comment"># ساخت فایل .env</span>
sudo nano .env</code></pre>

  <p>محتوای فایل <code>.env</code>:</p>

  <div class="env-section">
    <div class="env-group-title">── App ──</div>
    <pre><code>NEXT_PUBLIC_APP_NAME="Persicore CRM"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_API_URL="https://crm.persicore.ir/api"
NEXT_PUBLIC_APP_URL="https://crm.persicore.ir"
NEXT_PUBLIC_PORTAL_URL="https://portal.persicore.ir"</code></pre>

    <div class="env-group-title">── Database ──</div>
    <pre><code>DATABASE_URL="mysql://persicore:YOUR_STRONG_DB_PASSWORD@localhost:3306/persicore_crm"</code></pre>

    <div class="env-group-title">── JWT (حداقل ۳۲ کاراکتر — با openssl rand -hex 32 بسازید) ──</div>
    <pre><code>JWT_SECRET="CHANGE_THIS_64_CHAR_RANDOM_STRING_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
PORTAL_JWT_SECRET="ANOTHER_64_CHAR_RANDOM_STRING_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"</code></pre>

    <div class="env-group-title">── Super Admin ──</div>
    <pre><code>SUPER_ADMIN_PHONE="09xxxxxxxxx"
SUPER_ADMIN_PASSWORD="YOUR_STRONG_ADMIN_PASSWORD"</code></pre>

    <div class="env-group-title">── ZarinPal ──</div>
    <pre><code>ZARINPAL_MERCHANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ZARINPAL_SANDBOX="false"</code></pre>

    <div class="env-group-title">── Melli Payamak (OTP SMS) ──</div>
    <pre><code>MELIPAYAMAK_USERNAME="09xxxxxxxxx"
MELIPAYAMAK_PASSWORD="YOUR_API_KEY"
MELIPAYAMAK_BODY_ID="477425"
MELIPAYAMAK_CONTRACT_BODY_ID="477439"</code></pre>

    <div class="env-group-title">── Cron ──</div>
    <pre><code>CRON_SECRET="$(openssl rand -hex 32)"</code></pre>

    <div class="env-group-title">── Email SMTP (اختیاری) ──</div>
    <pre><code>SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="info@persicore.ir"
SMTP_PASS="YOUR_EMAIL_PASSWORD"
SMTP_FROM="Persicore CRM &lt;info@persicore.ir&gt;"</code></pre>
  </div>

  <pre><code><span class="comment"># محافظت از فایل .env</span>
chmod 600 .env</code></pre>
</div>

</div>

<!-- page break before Nginx -->
<div class="page-break"></div>
<div class="content-page">

<!-- ─── ۷. Migrate + Seed ─────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۷</div>
    <div class="section-title">دیتابیس — Migration و Seed</div>
  </div>
  <pre><code>cd /var/www/persicorecrm/crm

<span class="comment"># اعمال schema به دیتابیس</span>
npx prisma migrate deploy

<span class="comment"># اگر migrate history ندارید:</span>
npx prisma db push

<span class="comment"># داده‌های پایه (تنظیمات، آیتم‌های خدمات)</span>
npx prisma db seed</code></pre>
</div>

<!-- ─── ۸. Build + PM2 ───────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۸</div>
    <div class="section-title">Build و اجرا با PM2</div>
  </div>
  <pre><code>cd /var/www/persicorecrm/crm

<span class="comment"># Build پروژه (۳–۵ دقیقه)</span>
npm run build

<span class="comment"># اجرا با PM2</span>
pm2 start .next/standalone/server.js \
  --name "persicore-crm" \
  --env production

<span class="comment"># ذخیره تنظیمات و فعال‌سازی auto-start بعد از reboot</span>
pm2 save
pm2 startup</code></pre>

  <pre><code><span class="comment"># بررسی وضعیت</span>
pm2 status
pm2 logs persicore-crm --lines 30</code></pre>

  <div class="callout callout-tip">
    <span class="callout-icon">✅</span>
    <p>اگر همه چیز درست باشد، پروسه روی پورت <code>3000</code> اجرا می‌شود و وضعیت <code>online</code> نشان می‌دهد.</p>
  </div>
</div>

<!-- ─── ۹. Nginx ──────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۹</div>
    <div class="section-title">کانفیگ Nginx</div>
  </div>
  <pre><code>sudo nano /etc/nginx/sites-available/persicore</code></pre>
</div>

</div>

<!-- page break - nginx config -->
<div class="page-break"></div>
<div class="content-page">

<div class="section">
  <h3>کانفیگ کامل Nginx — تمام ساب‌دامین‌ها</h3>
  <pre><code><span class="comment"># ─── Upstream ───────────────────────────────────────────────────</span>
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

<span class="comment"># ─── persicore.ir — صفحه اصلی استاتیک ──────────────────────────</span>
server {
    listen 443 ssl http2;
    server_name persicore.ir www.persicore.ir;
    ssl_certificate     /etc/letsencrypt/live/persicore.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/persicore.ir/privkey.pem;
    root /var/www/persicorecrm/crm/landing;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location ~* \\.(css|js|png|jpg|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

<span class="comment"># ─── crm.persicore.ir — پنل CRM ─────────────────────────────────</span>
server {
    listen 443 ssl http2;
    server_name crm.persicore.ir;
    ssl_certificate     /etc/letsencrypt/live/persicore.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/persicore.ir/privkey.pem;
    location /_next/static/ {
        alias /var/www/persicorecrm/crm/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        proxy_pass         http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_read_timeout 60s;
    }
}

<span class="comment"># ─── portal / admin / blog / resume / proposal ───────────────────</span>
<span class="comment"># (همان ساختار بالا، فقط server_name تغییر می‌کند)</span>
server {
    listen 443 ssl http2;
    server_name portal.persicore.ir;
    ssl_certificate     /etc/letsencrypt/live/persicore.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/persicore.ir/privkey.pem;
    location /_next/static/ {
        alias /var/www/persicorecrm/crm/.next/static/;
        expires 1y; add_header Cache-Control "public, immutable";
    }
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
<span class="comment"># admin / blog / resume / proposal — همین الگو را کپی کنید و server_name را عوض کنید</span>

<span class="comment"># ─── Redirect HTTP → HTTPS ──────────────────────────────────────</span>
server {
    listen 80;
    server_name persicore.ir www.persicore.ir
                crm.persicore.ir portal.persicore.ir
                admin.persicore.ir blog.persicore.ir
                resume.persicore.ir proposal.persicore.ir;
    return 301 https://$host$request_uri;
}</code></pre>

  <pre><code><span class="comment"># فعال‌سازی کانفیگ</span>
sudo ln -s /etc/nginx/sites-available/persicore /etc/nginx/sites-enabled/
sudo nginx -t          <span class="comment"># تست — باید "syntax is ok" نشان دهد</span>
sudo systemctl reload nginx</code></pre>
</div>

</div>

<!-- page break - cron + update + checklist -->
<div class="page-break"></div>
<div class="content-page">

<!-- ─── ۱۰. Cron ──────────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۱۰</div>
    <div class="section-title">Cron Job — انقضای قراردادها</div>
  </div>
  <pre><code>crontab -e</code></pre>
  <pre><code><span class="comment"># هر ساعت — بررسی انقضا و ارسال یادآور قراردادها</span>
0 * * * * curl -s -X POST \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  https://crm.persicore.ir/api/cron/contracts \
  >> /var/log/persicore-cron.log 2>&1

<span class="comment"># هر روز ساعت ۳ صبح — تجدید SSL</span>
0 3 * * * certbot renew --quiet && systemctl reload nginx</code></pre>
</div>

<!-- ─── ۱۱. Update ───────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۱۱</div>
    <div class="section-title">بروزرسانی پروژه</div>
  </div>
  <pre><code>cd /var/www/persicorecrm/crm

git pull origin main
npm install --legacy-peer-deps
npx prisma migrate deploy
npm run build

pm2 restart persicore-crm
pm2 logs persicore-crm --lines 20   <span class="comment"># بررسی خطا</span></code></pre>
</div>

<!-- ─── ۱۲. Checklist ────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۱۲</div>
    <div class="section-title">چک‌لیست نهایی قبل از لانچ</div>
  </div>
  <ul class="checklist">
    <li><div class="check-box"></div>DNS propagation تأیید شده — <code>nslookup crm.persicore.ir</code> IP سرور را نشان می‌دهد</li>
    <li><div class="check-box"></div>SSL روی همه ۷ ساب‌دامین کار می‌کند (قفل سبز در مرورگر)</li>
    <li><div class="check-box"></div>DATABASE_URL به MySQL production وصل است</li>
    <li><div class="check-box"></div>ZARINPAL_MERCHANT_ID واقعی و SANDBOX=false</li>
    <li><div class="check-box"></div>MELIPAYAMAK اطلاعات صحیح دارد و OTP ارسال می‌شود</li>
    <li><div class="check-box"></div>JWT_SECRET و PORTAL_JWT_SECRET قوی و تصادفی هستند (۶۴+ کاراکتر)</li>
    <li><div class="check-box"></div>SUPER_ADMIN_PHONE و SUPER_ADMIN_PASSWORD تنظیم شده‌اند</li>
    <li><div class="check-box"></div><code>pm2 save && pm2 startup</code> اجرا شده</li>
    <li><div class="check-box"></div><code>nginx -t</code> بدون خطا است</li>
    <li><div class="check-box"></div>صفحه اصلی <code>persicore.ir</code> باز می‌شود</li>
    <li><div class="check-box"></div>ثبت‌نام و ورود با OTP در <code>crm.persicore.ir</code> کار می‌کند</li>
    <li><div class="check-box"></div>ورود به <code>admin.persicore.ir</code> با رمز کار می‌کند</li>
    <li><div class="check-box"></div>Cron job در crontab ثبت شده</li>
    <li><div class="check-box"></div>Firewall فعال است: <code>ufw allow 80,443/tcp && ufw enable</code></li>
  </ul>
</div>

<!-- ─── ۱۳. Security ──────────────────────────────────────────────── -->
<div class="section">
  <div class="section-header">
    <div class="section-num">۱۳</div>
    <div class="section-title">نکات امنیتی مهم</div>
  </div>
  <div class="callout callout-danger">
    <span class="callout-icon">🔴</span>
    <p><strong>admin.persicore.ir را با IP whitelist محدود کنید</strong> — در کانفیگ Nginx این دو خط را uncomment کنید:<br/>
    <code>allow YOUR_OFFICE_IP;</code>&nbsp;&nbsp;<code>deny all;</code></p>
  </div>
  <div class="callout callout-warning">
    <span class="callout-icon">⚠️</span>
    <p>فایل <code>.env</code> باید permission 600 داشته باشد: <code>chmod 600 .env</code></p>
  </div>
  <div class="callout callout-tip">
    <span class="callout-icon">✅</span>
    <p>MySQL را فقط به <code>localhost</code> محدود کنید — هرگز پورت MySQL را به اینترنت باز نکنید.</p>
  </div>
  <div class="callout callout-tip">
    <span class="callout-icon">✅</span>
    <p>Firewall: <code>sudo ufw allow 80,443,22/tcp && sudo ufw enable</code></p>
  </div>
  <div class="callout callout-info">
    <span class="callout-icon">ℹ️</span>
    <p>هرگز فایل <code>.env</code> را به git commit نکنید. آن را در <code>.gitignore</code> نگه دارید.</p>
  </div>

  <div class="page-footer">
    <span>Persicore CRM — راهنمای دپلوی</span>
    <span>persicore.ir</span>
  </div>
</div>

</div>
</body>
</html>`;

async function generate() {
  console.log("🚀 launching browser...");
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    (process.env.LOCALAPPDATA ?? "") + "\\Google\\Chrome\\Application\\chrome.exe",
  ];
  const executablePath = chromePaths.find(p => existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle" });

  // Wait for Vazirmatn font to load
  await page.waitForTimeout(2000);

  await page.pdf({
    path: OUTPUT,
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  console.log(`✅ PDF saved: ${OUTPUT}`);
}

generate().catch((e) => { console.error(e); process.exit(1); });
