"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { Copy, Merge, Loader2, ScanSearch, CheckCircle2, AlertCircle, Phone, Mail, User } from "lucide-react";

interface LeadSummary {
  id: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string;
  companyName: string;
  status: string;
  createdAt: string;
  duplicateOfId: string | null;
}

interface DuplicateGroup {
  leads: LeadSummary[];
  matchField: "email" | "phone" | "name";
}

const matchFieldLabel: Record<string, string> = {
  email: "ایمیل مشابه",
  phone: "تلفن مشابه",
  name: "نام مشابه",
};

const matchFieldColor: Record<string, string> = {
  email: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  phone: "bg-green-500/20 text-green-400 border border-green-500/30",
  name: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

const statusLabel: Record<string, string> = {
  new: "جدید",
  contacted: "تماس گرفته شد",
  meeting: "جلسه",
  proposal: "پروپوزال",
  negotiation: "مذاکره",
  won: "برنده شد",
  lost: "باخت",
  duplicate: "تکراری",
};

export default function DeduplicationPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  // primary selection: groupIndex -> leadId
  const [primarySelections, setPrimarySelections] = useState<Record<number, string>>({});
  // merging: groupIndex -> loading
  const [merging, setMerging] = useState<Record<number, boolean>>({});
  // merged groups (hide after merge)
  const [mergedGroups, setMergedGroups] = useState<Set<number>>(new Set());

  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    setGroups([]);
    setPrimarySelections({});
    setMergedGroups(new Set());
    try {
      const res = await apiClient.get("/leads/find-duplicates");
      const data: DuplicateGroup[] = res.data.data ?? [];
      setGroups(data);
      setScanned(true);
      if (data.length === 0) {
        toast.success("هیچ مخاطب تکراری یافت نشد");
      } else {
        toast.info(`${data.length} گروه تکراری شناسایی شد`);
      }
    } catch {
      toast.error("خطا در اسکن مخاطبین");
    } finally {
      setScanning(false);
    }
  };

  const handleMerge = async (groupIndex: number) => {
    const group = groups[groupIndex];
    const primaryId = primarySelections[groupIndex];
    if (!primaryId) {
      toast.error("لطفاً لید اصلی را انتخاب کنید");
      return;
    }
    const duplicateIds = group.leads
      .filter((l) => l.id !== primaryId)
      .map((l) => l.id);

    setMerging((prev) => ({ ...prev, [groupIndex]: true }));
    try {
      await apiClient.post("/leads/merge", { primaryId, duplicateIds });
      toast.success("لیدها با موفقیت ادغام شدند");
      setMergedGroups((prev) => new Set([...prev, groupIndex]));
    } catch {
      toast.error("خطا در ادغام لیدها");
    } finally {
      setMerging((prev) => ({ ...prev, [groupIndex]: false }));
    }
  };

  const visibleGroups = groups.filter((_, i) => !mergedGroups.has(i));
  const hasGroups = visibleGroups.length > 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/20 rounded-xl border border-violet-500/30">
            <Copy className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">شناسایی مخاطبین تکراری</h1>
            <p className="text-sm text-white/50 mt-0.5">
              لیدهای تکراری را شناسایی و ادغام کنید
            </p>
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ScanSearch className="w-4 h-4" />
          )}
          {scanning ? "در حال اسکن..." : "اسکن تکراری‌ها"}
        </button>
      </div>

      {/* Empty state - not scanned yet */}
      {!scanned && !scanning && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 mb-5">
            <ScanSearch className="w-10 h-10 text-white/30" />
          </div>
          <p className="text-white/50 text-sm">
            برای شناسایی مخاطبین تکراری روی دکمه «اسکن تکراری‌ها» کلیک کنید
          </p>
        </div>
      )}

      {/* Scanning state */}
      {scanning && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
          <p className="text-white/50 text-sm">در حال جستجو برای مخاطبین تکراری...</p>
        </div>
      )}

      {/* No duplicates found */}
      {scanned && !scanning && !hasGroups && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/20 mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <p className="text-white font-medium">هیچ مخاطب تکراری یافت نشد</p>
          <p className="text-white/40 text-sm mt-1">تمام لیدهای شما منحصربه‌فرد هستند</p>
        </div>
      )}

      {/* Duplicate groups */}
      {hasGroups && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>
              {visibleGroups.length} گروه تکراری شناسایی شد — لید اصلی را انتخاب کرده و سپس ادغام کنید
            </span>
          </div>

          {groups.map((group, groupIndex) => {
            if (mergedGroups.has(groupIndex)) return null;
            const selectedPrimary = primarySelections[groupIndex] ?? "";
            const isMergingGroup = merging[groupIndex] ?? false;

            return (
              <div
                key={groupIndex}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
              >
                {/* Group header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/3">
                  <div className="flex items-center gap-3">
                    <span className="text-white/70 text-sm font-medium">
                      گروه {groupIndex + 1}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${matchFieldColor[group.matchField]}`}
                    >
                      {matchFieldLabel[group.matchField]}
                    </span>
                    <span className="text-white/30 text-xs">
                      {group.leads.length} لید
                    </span>
                  </div>

                  <button
                    onClick={() => handleMerge(groupIndex)}
                    disabled={!selectedPrimary || isMergingGroup}
                    className="flex items-center gap-2 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    {isMergingGroup ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Merge className="w-3.5 h-3.5" />
                    )}
                    ادغام
                  </button>
                </div>

                {/* Leads grid */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.leads.map((lead) => {
                    const isPrimary = selectedPrimary === lead.id;
                    return (
                      <button
                        key={lead.id}
                        onClick={() =>
                          setPrimarySelections((prev) => ({
                            ...prev,
                            [groupIndex]: lead.id,
                          }))
                        }
                        className={`text-right p-4 rounded-xl border transition-all ${
                          isPrimary
                            ? "bg-violet-500/20 border-violet-500/50 ring-1 ring-violet-500/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                              isPrimary
                                ? "border-violet-400 bg-violet-400"
                                : "border-white/30"
                            }`}
                          >
                            {isPrimary && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div className="flex-1 mr-2">
                            <p className="text-white font-medium text-sm leading-tight">
                              {lead.companyName}
                            </p>
                            {isPrimary && (
                              <span className="text-xs text-violet-300 mt-0.5 block">
                                لید اصلی
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-white/60 text-xs">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.contactName}</span>
                          </div>
                          {lead.contactEmail && (
                            <div className="flex items-center gap-2 text-white/60 text-xs">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.contactEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-white/60 text-xs">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span dir="ltr">{lead.contactPhone}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10">
                          <span className="text-xs text-white/40">
                            وضعیت:{" "}
                            <span className="text-white/60">
                              {statusLabel[lead.status] ?? lead.status}
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
