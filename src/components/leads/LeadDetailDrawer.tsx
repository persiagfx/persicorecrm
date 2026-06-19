"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import {
  X, Phone, Mail, Globe, Calendar, TrendingUp, Tag,
  MessageSquare, PhoneCall, Users, FileText, Plus,
  Edit3, Trash2, ExternalLink, DollarSign, Trophy, XCircle, Check,
} from "lucide-react";
import { cn, formatPrice, timeAgo } from "@/lib/utils";
import { LeadStatusBadge } from "@/components/common/StatusBadge";
import type { Lead, Activity, WinLossReason, WinLossCategory } from "@/types";

const WIN_LOSS_CATEGORIES: { id: WinLossCategory; label: string }[] = [
  { id: "price", label: "قیمت" }, { id: "quality", label: "کیفیت" },
  { id: "competitor", label: "رقیب" }, { id: "timing", label: "زمان‌بندی" },
  { id: "budget", label: "بودجه" }, { id: "trust", label: "اعتماد" },
  { id: "features", label: "ویژگی‌ها" }, { id: "other", label: "سایر" },
];

// ─── Activity type config ─────────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  call:    { icon: PhoneCall,     color: "text-blue-400",   bg: "bg-blue-500/10",    label: "تماس" },
  email:   { icon: Mail,          color: "text-purple-400", bg: "bg-purple-500/10",  label: "ایمیل" },
  meeting: { icon: Users,         color: "text-amber-400",  bg: "bg-amber-500/10",   label: "جلسه" },
  note:    { icon: FileText,      color: "text-slate-400",  bg: "bg-slate-500/10",   label: "یادداشت" },
  task:    { icon: MessageSquare, color: "text-emerald-400",bg: "bg-emerald-500/10", label: "تسک" },
};

// ─── New Activity Form ────────────────────────────────────────────────────────
function NewActivityForm({ leadId, onAdd, onClose }: {
  leadId: string;
  onAdd: (a: Activity) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<Activity["type"]>("note");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.patch(`/leads/${leadId}`, {
        _action: "add_activity",
        type,
        content: content.trim(),
      });
      const activity: Activity = res.data?.data ?? res.data;
      onAdd(activity);
      setContent("");
      onClose();
    } catch {
      toast.error("خطا در ثبت فعالیت");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-4"
    >
      {/* Type selector */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {(Object.entries(ACTIVITY_CONFIG) as [Activity["type"], typeof ACTIVITY_CONFIG.call][]).map(([t, cfg]) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
              type === t ? "bg-primary text-black" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <cfg.icon className="w-3 h-3" />
            {cfg.label}
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="توضیحات فعالیت را بنویسید..."
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="flex gap-2 mt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          لغو
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || saving}
          className="flex-1 py-2 rounded-lg gradient-brand text-black text-sm font-bold disabled:opacity-40"
        >
          {saving ? "در حال ثبت..." : "ثبت فعالیت"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate?: (updated: Lead) => void;
}

export function LeadDetailDrawer({ lead, onClose, onUpdate }: LeadDetailDrawerProps) {
  const [activities, setActivities] = useState<Activity[]>(lead?.activities ?? [] as Activity[]);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "activity">("info");
  const [showWinLossForm, setShowWinLossForm] = useState(false);
  const [winLossRecord, setWinLossRecord] = useState<WinLossReason | null>(lead?.winLossReason ?? null);
  const [wlForm, setWlForm] = useState({ category: "price" as WinLossCategory, competitorName: "", description: "" });

  const assignee = (lead as Lead & { assignee?: { id: string; name: string; avatar?: string } })?.assignee;

  // Keep activities in sync when lead changes
  if (lead && activities !== lead.activities && !showNewActivity) {
    setActivities(lead.activities ?? []);
  }

  function addActivity(a: Activity) {
    const updated = [a, ...activities];
    setActivities(updated);
    if (lead && onUpdate) {
      onUpdate({ ...lead, activities: updated });
    }
  }

  if (!lead) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="drawer"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 start-0 z-50 w-full max-w-md bg-card border-e border-border flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{lead.companyName}</h2>
              <p className="text-sm text-muted-foreground">{lead.contactName}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status + value */}
          <div className="flex items-center gap-3 flex-wrap">
            <LeadStatusBadge status={lead.status} />
            <span className="flex items-center gap-1 text-sm font-bold text-primary">
              <DollarSign className="w-3.5 h-3.5" />
              {formatPrice(lead.estimatedValue, true)}
            </span>
            {lead.conversionProbability && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                احتمال تبدیل: {lead.conversionProbability}٪
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "info" as const, label: "اطلاعات" },
            { id: "activity" as const, label: `فعالیت‌ها (${activities.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "info" ? (
            <div className="p-5 space-y-5">
              {/* Contact */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">اطلاعات تماس</h3>
                <div className="space-y-2">
                  <a href={`tel:${lead.contactPhone}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                    <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground" dir="ltr">{lead.contactPhone}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  {lead.contactEmail && (
                    <a href={`mailto:${lead.contactEmail}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                      <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-foreground" dir="ltr">{lead.contactEmail}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ms-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              </section>

              {/* Details */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">جزئیات</h3>
                <div className="space-y-3">
                  {lead.source && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />منبع
                      </span>
                      <span className="text-sm text-foreground font-medium">{lead.source}</span>
                    </div>
                  )}
                  {lead.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />ددلاین
                      </span>
                      <span className="text-sm text-foreground font-medium">
                        {new Date(lead.dueDate).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  )}
                  {assignee && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />مسئول
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black">
                          {assignee.name.slice(0, 1)}
                        </div>
                        <span className="text-sm text-foreground">{assignee.name}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />احتمال تبدیل
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${lead.conversionProbability}%` }}
                        />
                      </div>
                      <span className="text-sm text-foreground font-medium">{lead.conversionProbability}٪</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tags */}
              {lead.tags.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    <Tag className="w-3.5 h-3.5 inline me-1" />تگ‌ها
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
              {lead.notes && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">یادداشت</h3>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/40 p-3 rounded-xl">
                    {lead.notes}
                  </p>
                </section>
              )}

              {/* Win/Loss Reason Section */}
              {(lead.status === "won" || lead.status === "lost") && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      {lead.status === "won" ? <Trophy className="w-3.5 h-3.5 text-amber-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      دلیل {lead.status === "won" ? "پیروزی" : "شکست"}
                    </h3>
                    {!winLossRecord && (
                      <button onClick={() => setShowWinLossForm(!showWinLossForm)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors">
                        {showWinLossForm ? "انصراف" : "ثبت دلیل"}
                      </button>
                    )}
                  </div>

                  {winLossRecord ? (
                    <div className={`p-3 rounded-xl border ${lead.status === "won" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">
                          {WIN_LOSS_CATEGORIES.find(c => c.id === winLossRecord.category)?.label}
                        </span>
                        <button onClick={() => { setWinLossRecord(null); setShowWinLossForm(false); }}
                          className="text-xs text-muted-foreground hover:text-destructive">ویرایش</button>
                      </div>
                      {winLossRecord.competitorName && (
                        <p className="text-xs text-muted-foreground">رقیب: {winLossRecord.competitorName}</p>
                      )}
                      {winLossRecord.description && (
                        <p className="text-sm text-foreground mt-1 leading-relaxed">{winLossRecord.description}</p>
                      )}
                    </div>
                  ) : showWinLossForm ? (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">دسته‌بندی دلیل *</label>
                        <div className="flex flex-wrap gap-1.5">
                          {WIN_LOSS_CATEGORIES.map(c => (
                            <button key={c.id} type="button"
                              onClick={() => setWlForm(p => ({ ...p, category: c.id }))}
                              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${wlForm.category === c.id ? "bg-primary text-black" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">نام رقیب (اختیاری)</label>
                        <input value={wlForm.competitorName} onChange={e => setWlForm(p => ({ ...p, competitorName: e.target.value }))}
                          placeholder="مثال: آژانس دیجیتال نوین"
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">توضیحات</label>
                        <textarea value={wlForm.description} onChange={e => setWlForm(p => ({ ...p, description: e.target.value }))}
                          rows={2} placeholder="دلیل را شرح دهید..."
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <button onClick={() => {
                        const r: WinLossReason = {
                          id: `wl${Date.now()}`, leadId: lead.id, outcome: lead.status as "won" | "lost",
                          category: wlForm.category, competitorName: wlForm.competitorName || undefined,
                          description: wlForm.description || undefined, recordedById: "u1",
                          recordedAt: new Date().toISOString(),
                        };
                        setWinLossRecord(r);
                        setShowWinLossForm(false);
                      }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-black text-xs font-bold w-full justify-center">
                        <Check className="w-3.5 h-3.5" /> ذخیره دلیل
                      </button>
                    </motion.div>
                  ) : (
                    <div className="h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                      دلیلی ثبت نشده
                    </div>
                  )}
                </section>
              )}
            </div>
          ) : (
            <div className="p-5">
              {/* Add activity button */}
              <button
                onClick={() => setShowNewActivity(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary text-sm transition-all mb-4"
              >
                <Plus className="w-4 h-4" />ثبت فعالیت جدید
              </button>

              {/* New activity form */}
              <AnimatePresence>
                {showNewActivity && (
                  <NewActivityForm
                    leadId={lead.id}
                    onAdd={addActivity}
                    onClose={() => setShowNewActivity(false)}
                  />
                )}
              </AnimatePresence>

              {/* Activity list */}
              {activities.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  هیچ فعالیتی ثبت نشده
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity, i) => {
                    const cfg = ACTIVITY_CONFIG[activity.type];
                    const author = { name: activity.authorId }; // authorId only — name resolved server-side
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex gap-3"
                      >
                        {/* Icon */}
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                          <cfg.icon className={cn("w-3.5 h-3.5", cfg.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(activity.createdAt)}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{activity.content}</p>
                          {author && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <div className="w-4 h-4 rounded-full gradient-brand flex items-center justify-center text-[8px] font-bold text-black">
                                {author.name.slice(0, 1)}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{author.name}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
            ویرایش Lead
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black text-sm font-bold gold-glow"
          >
            تبدیل به مشتری
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
