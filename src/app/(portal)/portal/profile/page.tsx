"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { User, Lock, Check } from "lucide-react";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PortalProfilePage() {
  const { user, token } = usePortal();
  const [name, setName] = useState(user?.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setIsSavingName(true);
    try {
      await portalFetch("/api/portal/profile", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim() }),
      }, token);
      toast.success("نام با موفقیت ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره اطلاعات");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    if (newPassword.length < 6) { toast.error("رمز جدید باید حداقل ۶ کاراکتر باشد"); return; }
    setIsSavingPassword(true);
    try {
      const res = await portalFetch("/api/portal/profile", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, password: newPassword }),
      }, token);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "خطا");
      }
      toast.success("رمز عبور با موفقیت تغییر یافت");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "خطا در تغییر رمز عبور");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-blue-400" />پروفایل
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">مدیریت اطلاعات حساب کاربری</p>
      </motion.div>

      {/* Avatar + info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user?.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-foreground">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.phone ?? ""}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {user?.role === "admin" ? "مدیر" : "بیننده"}
          </p>
        </div>
      </motion.div>

      {/* Edit name */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />ویرایش اطلاعات
        </h2>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">نام</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">شماره موبایل</label>
          <input
            value={user?.phone ?? ""}
            disabled
            dir="ltr"
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-muted-foreground text-sm cursor-not-allowed text-center tracking-widest"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSaveName}
          disabled={!name.trim() || isSavingName}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          {isSavingName ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />در حال ذخیره...</>
          ) : (
            <><Check className="w-4 h-4" />ذخیره تغییرات</>
          )}
        </motion.button>
      </motion.div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="p-5 rounded-2xl bg-card border border-border space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" />تغییر رمز عبور
        </h2>
        {[
          { label: "رمز عبور فعلی", value: currentPassword, setter: setCurrentPassword },
          { label: "رمز عبور جدید", value: newPassword, setter: setNewPassword },
          { label: "تکرار رمز جدید", value: confirmPassword, setter: setConfirmPassword },
        ].map(({ label, value, setter }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            <input
              type="password"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className={cn(
                "w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40",
                label === "تکرار رمز جدید" && confirmPassword && newPassword !== confirmPassword
                  ? "border-red-500/50 focus:ring-red-400/40"
                  : ""
              )}
            />
            {label === "تکرار رمز جدید" && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">رمز عبور با تکرار آن مطابقت ندارد</p>
            )}
          </div>
        ))}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleChangePassword}
          disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isSavingPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          {isSavingPassword ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />در حال ذخیره...</>
          ) : (
            <><Lock className="w-4 h-4" />تغییر رمز عبور</>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
