"use client";

import { useEffect, useState, useCallback } from "react";
import { Monitor, Smartphone, Trash2, LogOut, Shield, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface Session {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return Smartphone;
  }
  return Monitor;
}

function getDeviceName(userAgent: string | null, deviceInfo: string | null): string {
  if (deviceInfo) return deviceInfo;
  if (!userAgent) return "دستگاه ناشناس";
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac")) return "Mac";
  if (ua.includes("linux")) return "Linux";
  return "دستگاه ناشناس";
}

function getBrowserName(userAgent: string | null): string {
  if (!userAgent) return "";
  const ua = userAgent.toLowerCase();
  if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("opera") || ua.includes("opr")) return "Opera";
  return "مرورگر ناشناس";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "همین الان";
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  if (diffDays < 30) return `${diffDays} روز پیش`;
  return date.toLocaleDateString("fa-IR");
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("crm-token") : null;
      const res = await apiClient.get("/sessions", {
        headers: token ? { "X-Session-Token": token } : {},
      });
      setSessions(res.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری جلسات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const revokeSession = async (id: string) => {
    setRevoking(id);
    try {
      await apiClient.delete(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("جلسه با موفقیت خاتمه یافت");
    } catch {
      toast.error("خطا در خاتمه دادن به جلسه");
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllSessions = async () => {
    setRevokingAll(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("crm-token") : null;
      await apiClient.delete("/sessions", {
        data: { all: true },
        headers: token ? { "X-Session-Token": token } : {},
      });
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("از تمام دستگاه‌های دیگر خارج شدید");
    } catch {
      toast.error("خطا در خروج از دستگاه‌ها");
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <div className="space-y-5 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            مدیریت جلسات
          </h1>
          <button
            onClick={loadSessions}
            disabled={loading}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="بارگذاری مجدد"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          تمام دستگاه‌هایی که با حساب شما وارد شده‌اند را مدیریت کنید
        </p>
      </motion.div>

      {/* Current Session */}
      {currentSession && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">جلسه فعلی</h2>
          <SessionCard session={currentSession} onRevoke={revokeSession} revoking={revoking} />
        </motion.div>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              سایر دستگاه‌ها ({otherSessions.length})
            </h2>
            <button
              onClick={revokeAllSessions}
              disabled={revokingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              {revokingAll ? "در حال خروج..." : "خروج از همه دستگاه‌ها"}
            </button>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {otherSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onRevoke={revokeSession}
                  revoking={revoking}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="p-10 rounded-2xl bg-card border border-border text-center">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">هیچ جلسه فعالی یافت نشد</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-card border border-border animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-2.5 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onRevoke,
  revoking,
}: {
  session: Session;
  onRevoke: (id: string) => void;
  revoking: string | null;
}) {
  const DeviceIcon = getDeviceIcon(session.userAgent);
  const deviceName = getDeviceName(session.userAgent, session.deviceInfo);
  const browserName = getBrowserName(session.userAgent);
  const isRevoking = revoking === session.id;

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={cn(
        "p-4 rounded-2xl bg-card border transition-all",
        session.isCurrent ? "border-primary/40 bg-primary/5" : "border-border hover:border-border-strong"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            session.isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <DeviceIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{deviceName}</span>
            {browserName && (
              <span className="text-xs text-muted-foreground">· {browserName}</span>
            )}
            {session.isCurrent && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                جلسه فعلی
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {session.ipAddress && (
              <span>{session.ipAddress}</span>
            )}
            {session.ipAddress && (
              <span className="text-muted-foreground/40">·</span>
            )}
            <span className="flex items-center gap-1">
              <span>آخرین فعالیت:</span>
              <span>{formatRelativeTime(session.lastActiveAt)}</span>
            </span>
          </div>
        </div>

        {!session.isCurrent && (
          <button
            onClick={() => onRevoke(session.id)}
            disabled={isRevoking}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0",
              isRevoking
                ? "text-muted-foreground cursor-not-allowed"
                : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isRevoking ? "..." : "خروج"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
