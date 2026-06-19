# راهنمای دپلوی Persicore CRM روی سرور

---

## ساختار ساب‌دامین‌ها

| ساب‌دامین | سرویس | منبع |
|---|---|---|
| `persicore.ir` | صفحه اصلی (Landing) | فایل استاتیک از `crm/landing/` |
| `crm.persicore.ir` | پنل CRM | Next.js App |
| `portal.persicore.ir` | پورتال مشتریان | Next.js App |
| `admin.persicore.ir` | پنل سوپر ادمین | Next.js App |
| `blog.persicore.ir` | بلاگ | Next.js App |
| `resume.persicore.ir` | رزومه‌ها | Next.js App |
| `proposal.persicore.ir` | پروپوزال‌ها | Next.js App |
| `content.persicore.ir` | تولید محتوا AI | Next.js App |

---

## ۱. نیازمندی‌های سرور

```
OS:      Ubuntu 22.04 LTS
RAM:     حداقل ۲ گیگابایت (توصیه: ۴ گیگابایت)
CPU:     ۲ هسته
Disk:    ۲۰ گیگابایت SSD
```

---

## ۲. نصب وابستگی‌ها

```bash
# بروزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (مدیریت پروسه)
sudo npm install -g pm2

# MySQL 8.0
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Nginx
sudo apt install -y nginx

# Certbot (SSL رایگان)
sudo apt install -y certbot python3-certbot-nginx
```

---

## ۳. تنظیم DNS

در کنترل پنل دامنه، رکوردهای زیر را اضافه کنید:

```
Type  Name         Value          TTL
A     @            YOUR_SERVER_IP  300
A     *            YOUR_SERVER_IP  300
```

> رکورد `*` ویلدکارد است و همه ساب‌دامین‌ها را به سرور هدایت می‌کند.

---

## ۴. SSL ویلدکارد (Let's Encrypt)

```bash
# گواهی ویلدکارد برای همه ساب‌دامین‌ها
sudo certbot certonly \
  --manual \
  --preferred-challenges=dns \
  -d persicore.ir \
  -d "*.persicore.ir"
```

> Certbot از شما می‌خواهد یک رکورد `TXT` در DNS اضافه کنید. آن را در کنترل پنل دامنه اضافه کرده و سپس Enter بزنید.

مسیر گواهی‌ها پس از صدور:
```
/etc/letsencrypt/live/persicore.ir/fullchain.pem
/etc/letsencrypt/live/persicore.ir/privkey.pem
```

---

## ۵. MySQL — ساخت دیتابیس

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE persicore_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_persian_ci;
CREATE USER 'persicore'@'localhost' IDENTIFIED BY 'YOUR_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON persicore_crm.* TO 'persicore'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## ۶. کلون و ساخت پروژه

```bash
# کلون پروژه
cd /var/www
sudo git clone https://github.com/YOUR_REPO/persicorecrm.git
cd persicorecrm/crm

# نصب وابستگی‌ها
npm install --legacy-peer-deps

# ساخت فایل محیطی
sudo nano .env
```

محتوای فایل `.env` (مقادیر را جایگزین کنید):

```env
# ─── App ────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="Persicore CRM"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_API_URL="https://crm.persicore.ir/api"
NEXT_PUBLIC_APP_URL="https://crm.persicore.ir"
NEXT_PUBLIC_PORTAL_URL="https://portal.persicore.ir"

# ─── Database ───────────────────────────────────
DATABASE_URL="mysql://persicore:YOUR_STRONG_DB_PASSWORD@localhost:3306/persicore_crm"

# ─── JWT (حداقل ۳۲ کاراکتر تصادفی) ─────────────
JWT_SECRET="CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
PORTAL_JWT_SECRET="CHANGE_THIS_TO_ANOTHER_RANDOM_64_CHAR_STRING_xxxxxxxxxxxxxxxxxxxx"

# ─── Super Admin ────────────────────────────────
SUPER_ADMIN_PHONE="09xxxxxxxxx"
SUPER_ADMIN_PASSWORD="YOUR_STRONG_ADMIN_PASSWORD"

# ─── ZarinPal ───────────────────────────────────
ZARINPAL_MERCHANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ZARINPAL_SANDBOX="false"

# ─── Melli Payamak (OTP SMS) ────────────────────
MELIPAYAMAK_USERNAME="09xxxxxxxxx"
MELIPAYAMAK_PASSWORD="YOUR_API_KEY"
MELIPAYAMAK_BODY_ID="477425"
MELIPAYAMAK_CONTRACT_BODY_ID="477439"

# ─── Cron ───────────────────────────────────────
CRON_SECRET="GENERATE_WITH: openssl rand -hex 32"

# ─── Email (اختیاری) ────────────────────────────
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="info@persicore.ir"
SMTP_PASS="YOUR_EMAIL_PASSWORD"
SMTP_FROM="Persicore CRM <info@persicore.ir>"
```

> برای تولید JWT_SECRET و CRON_SECRET از دستور زیر استفاده کنید:
> ```bash
> openssl rand -hex 32
> ```

---

## ۷. دیتابیس — migration و seed

```bash
cd /var/www/persicorecrm/crm

# اعمال schema
npx prisma migrate deploy

# یا اگر migrate نداشتید:
npx prisma db push

# Seed (اطلاعات پایه)
npx prisma db seed
```

---

## ۸. Build پروژه

```bash
cd /var/www/persicorecrm/crm
npm run build
```

> زمان build حدود ۳–۵ دقیقه طول می‌کشد.

---

## ۹. اجرا با PM2

```bash
cd /var/www/persicorecrm/crm

pm2 start .next/standalone/server.js \
  --name "persicore-crm" \
  --env production

pm2 save
pm2 startup
```

تأیید اجرا:
```bash
pm2 status
pm2 logs persicore-crm --lines 20
```

> پروسه روی پورت `3000` اجرا می‌شود.

---

## ۱۰. Nginx — کانفیگ ساب‌دامین‌ها

فایل کانفیگ اصلی را بسازید:

```bash
sudo nano /etc/nginx/sites-available/persicore
```

محتوا:

```nginx
# ─── Upstream ──────────────────────────────────────────────────────────
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

# ─── persicore.ir — صفحه اصلی استاتیک ─────────────────────────────────
server {
    listen 443 ssl http2;
    server_name persicore.ir www.persicore.ir;

    ssl_certificate     /etc/letsencrypt/live/persicore.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/persicore.ir/privkey.pem;

    root /var/www/persicorecrm/crm/landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# ─── crm.persicore.ir — پنل CRM ────────────────────────────────────────
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
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}

# ─── portal.persicore.ir — پورتال مشتریان ──────────────────────────────
server {
    listen 443 ssl http2;
    server_name portal.persicore.ir;

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
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ─── admin.persicore.ir — پنل سوپر ادمین ──────────────────────────────
server {
    listen 443 ssl http2;
    server_name admin.persicore.ir;

    ssl_certificate     /etc/letsencrypt/live/persicore.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/persicore.ir/privkey.pem;

    # محدود کردن دسترسی به IP مشخص (توصیه می‌شود)
    # allow YOUR_OFFICE_IP;
    # deny all;

    location /_next/static/ {
        alias /var/www/persicorecrm/crm/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass         http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ─── blog.persicore.ir — بلاگ ──────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name blog.persicore.ir;

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
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ─── resume.persicore.ir — رزومه‌ها ────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name resume.persicore.ir;

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
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ─── proposal.persicore.ir — پروپوزال‌ها ───────────────────────────────
server {
    listen 443 ssl http2;
    server_name proposal.persicore.ir;

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
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ─── Redirect HTTP → HTTPS ─────────────────────────────────────────────
server {
    listen 80;
    server_name persicore.ir www.persicore.ir
                crm.persicore.ir
                portal.persicore.ir
                admin.persicore.ir
                blog.persicore.ir
                resume.persicore.ir
                proposal.persicore.ir;

    return 301 https://$host$request_uri;
}
```

فعال‌سازی کانفیگ:

```bash
sudo ln -s /etc/nginx/sites-available/persicore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ۱۱. Cron Job (انقضای قراردادها)

```bash
crontab -e
```

اضافه کنید:

```cron
# هر ساعت یک بار — بررسی انقضا و یادآور قراردادها
0 * * * * curl -s -X POST \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  https://crm.persicore.ir/api/cron/contracts \
  >> /var/log/persicore-cron.log 2>&1
```

---

## ۱۲. بروزرسانی پروژه (در آینده)

```bash
cd /var/www/persicorecrm/crm

git pull origin main
npm install --legacy-peer-deps
npx prisma migrate deploy
npm run build

pm2 restart persicore-crm
```

---

## ۱۳. چک‌لیست نهایی قبل از لانچ

```
[ ] DNS propagation تأیید شده (nslookup crm.persicore.ir)
[ ] SSL روی همه ساب‌دامین‌ها کار می‌کند
[ ] DATABASE_URL به MySQL production وصل است
[ ] ZARINPAL_MERCHANT_ID واقعی تنظیم شده (SANDBOX=false)
[ ] MELIPAYAMAK اطلاعات صحیح دارد
[ ] JWT_SECRET و PORTAL_JWT_SECRET قوی و تصادفی هستند
[ ] SUPER_ADMIN_PHONE و SUPER_ADMIN_PASSWORD تنظیم شده‌اند
[ ] pm2 save && pm2 startup اجرا شده (auto-restart بعد از reboot)
[ ] Nginx test پاس شده (nginx -t)
[ ] صفحه اصلی persicore.ir باز می‌شود
[ ] ورود به crm.persicore.ir با OTP کار می‌کند
[ ] ورود به admin.persicore.ir با رمز کار می‌کند
[ ] Cron job در crontab ثبت شده
```

---

## نکات امنیتی مهم

- **admin.persicore.ir** را با IP whitelist محدود کنید (خط کامنت‌شده در Nginx را فعال کنید)
- فایل `.env` باید permission `600` داشته باشد: `chmod 600 .env`
- هرگز `.env` را به git commit نکنید
- MySQL را فقط به `localhost` محدود کنید (پیش‌فرض است)
- Firewall را فعال کنید: `sudo ufw allow 80,443/tcp && sudo ufw enable`
