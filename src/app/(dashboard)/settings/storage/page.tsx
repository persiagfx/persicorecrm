import { HardDrive, Cloud, Server, CheckCircle2, Info } from "lucide-react";
import prisma from "@/lib/db";

async function getStorageStats() {
  const [count, aggregate] = await Promise.all([
    prisma.fileItem.count(),
    prisma.fileItem.aggregate({ _sum: { size: true } }),
  ]);
  return { count, totalSize: aggregate._sum.size ?? 0 };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const PROVIDERS = [
  {
    id: "local",
    label: "Local Filesystem",
    icon: HardDrive,
    description: "ذخیره فایل‌ها روی سرور در پوشه public/uploads. مناسب برای توسعه و سرورهای اختصاصی.",
    envVars: [],
    note: "نیاز به پیکربندی خاصی ندارد.",
  },
  {
    id: "s3",
    label: "Amazon S3",
    icon: Cloud,
    description: "ذخیره‌سازی ابری Amazon با پشتیبانی از CDN و دسترسی جهانی.",
    envVars: [
      { name: "STORAGE_PROVIDER", value: "s3", desc: "فعال‌سازی S3" },
      { name: "AWS_BUCKET", value: "your-bucket-name", desc: "نام باکت S3" },
      { name: "AWS_REGION", value: "us-east-1", desc: "ریجن AWS" },
      { name: "AWS_ACCESS_KEY_ID", value: "AKIA...", desc: "کلید دسترسی AWS" },
      { name: "AWS_SECRET_ACCESS_KEY", value: "...", desc: "کلید مخفی AWS" },
    ],
    note: "پکیج @aws-sdk/client-s3 باید نصب باشد.",
  },
  {
    id: "r2",
    label: "Cloudflare R2",
    icon: Server,
    description: "ذخیره‌سازی R2 کلاودفلر — سازگار با S3 بدون هزینه egress.",
    envVars: [
      { name: "STORAGE_PROVIDER", value: "r2", desc: "فعال‌سازی R2" },
      { name: "R2_BUCKET", value: "your-bucket-name", desc: "نام باکت R2" },
      { name: "CLOUDFLARE_ACCOUNT_ID", value: "abc123...", desc: "شناسه اکانت Cloudflare" },
      { name: "R2_ACCESS_KEY_ID", value: "...", desc: "کلید دسترسی R2" },
      { name: "R2_SECRET_ACCESS_KEY", value: "...", desc: "کلید مخفی R2" },
      { name: "R2_PUBLIC_URL", value: "https://files.example.com", desc: "دامنه عمومی (اختیاری)" },
    ],
    note: "پکیج @aws-sdk/client-s3 باید نصب باشد.",
  },
] as const;

export default async function StorageSettingsPage() {
  const stats = await getStorageStats();
  const activeProvider = (process.env.STORAGE_PROVIDER as string) || "local";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-primary" />
          تنظیمات فضای ذخیره‌سازی
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          مشاهده وضعیت ذخیره‌سازی و راهنمای پیکربندی پرووایدرها
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "پرووایدر فعال", value: activeProvider.toUpperCase() },
          { label: "تعداد فایل‌ها", value: stats.count.toLocaleString("fa-IR") },
          { label: "فضای مصرفی", value: formatBytes(stats.totalSize) },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-2xl bg-card border border-border space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Active Provider Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30">
        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            پرووایدر فعال:{" "}
            <span className="text-primary">
              {PROVIDERS.find((p) => p.id === activeProvider)?.label ?? activeProvider}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            مقدار متغیر محیطی STORAGE_PROVIDER = &quot;{activeProvider}&quot;
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {PROVIDERS.map(({ id, label, icon: Icon, description, envVars, note }) => {
          const isActive = id === activeProvider;
          return (
            <div
              key={id}
              className={`rounded-2xl border transition-all ${
                isActive
                  ? "border-primary/50 bg-card"
                  : "border-border bg-card/60"
              }`}
            >
              <div className="p-5 flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{label}</h3>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        فعال
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>

              {envVars.length > 0 && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="h-px bg-border" />
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                    متغیرهای محیطی مورد نیاز در فایل .env.local
                  </div>
                  <div className="rounded-xl bg-background border border-border overflow-hidden font-mono text-xs">
                    {envVars.map(({ name, value, desc }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-semibold">{name}</span>
                          <span className="text-muted-foreground">=</span>
                          <span className="text-foreground/70">&quot;{value}&quot;</span>
                        </div>
                        <span className="text-muted-foreground text-[11px]">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {note}
                  </p>
                </div>
              )}

              {envVars.length === 0 && (
                <div className="px-5 pb-5">
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SDK Install Note */}
      <div className="p-4 rounded-2xl bg-muted border border-border space-y-2">
        <p className="text-xs font-semibold text-foreground">نصب SDK برای S3 / R2</p>
        <div className="rounded-lg bg-background border border-border px-4 py-2.5 font-mono text-xs text-foreground/80">
          npm install @aws-sdk/client-s3
        </div>
      </div>
    </div>
  );
}
