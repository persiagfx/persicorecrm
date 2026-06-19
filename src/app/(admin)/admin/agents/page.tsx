"use client";
import { useState, useEffect, useCallback } from "react";
import { Bot, Search, RefreshCw, CheckCircle2, PauseCircle, Trash2, Settings, Eye, MessageSquare, Target, Users, Zap, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Agent {
  id: string; name: string; businessType: string; status: string;
  totalMessages: number; totalConversations: number; totalLeads: number;
  createdAt: string; slug: string;
  user: { id: string; name: string; email?: string; phone?: string; plan: string };
  customization?: { primaryColor: string };
  _count: { conversations: number; knowledge: number };
}
interface Stats {
  totalAgents: number; activeAgents: number; totalMessages: number; totalLeads: number; agentUsers: number;
}
interface BusinessType {
  id: string; key: string; nameFa: string; icon: string; isActive: boolean; order: number;
  description?: string;
}
interface AgentSettings {
  freePlanAgents: number; starterPlanAgents: number; proPlanAgents: number; enterprisePlanAgents: number;
  freePlanMessages: number; starterPlanMessages: number; proPlanMessages: number; enterprisePlanMessages: number;
  starterPlanPrice: number; proPlanPrice: number; enterprisePlanPrice: number;
  isActive: boolean; globalBlacklist: string[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  DRAFT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  PAUSED: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  DELETED: "bg-red-500/15 text-red-400 border-red-500/20",
};
const STATUS_LABELS: Record<string, string> = { ACTIVE: "فعال", DRAFT: "پیش‌نویس", PAUSED: "متوقف", DELETED: "حذف‌شده" };
const BT_ICONS: Record<string, string> = {
  ecommerce: "🛒", restaurant: "🍽️", clinic: "🏥", education: "📚",
  legal: "⚖️", travel: "✈️", beauty: "💄", construction: "🏗️",
  insurance: "🛡️", software: "💻", b2b: "🤝", other: "🏢",
};

type Tab = "agents" | "business-types" | "settings";

export default function AdminAgentsPage() {
  const [tab, setTab] = useState<Tab>("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  // Business types
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [btLoading, setBtLoading] = useState(false);
  const [newBtForm, setNewBtForm] = useState({ key: "", nameFa: "", icon: "🏢", description: "" });
  const [addingBt, setAddingBt] = useState(false);
  // Settings
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<AgentSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      const res = await apiClient.get(`/admin/agents?${params}`);
      setAgents(res.data.data?.agents ?? []);
      setTotal(res.data.data?.total ?? 0);
      setStats(res.data.data?.stats ?? null);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  const fetchBusinessTypes = async () => {
    setBtLoading(true);
    try {
      const res = await apiClient.get("/admin/agent-business-types");
      setBusinessTypes(res.data.data ?? []);
    } finally { setBtLoading(false); }
  };

  const fetchSettings = async () => {
    const res = await apiClient.get("/admin/agent-settings");
    const s = res.data.data;
    setSettings(s);
    setSettingsForm(s);
  };

  useEffect(() => { fetchAgents(); }, [fetchAgents]);
  useEffect(() => { if (tab === "business-types") fetchBusinessTypes(); }, [tab]);
  useEffect(() => { if (tab === "settings") fetchSettings(); }, [tab]);

  const toggleAgentStatus = async (agent: Agent) => {
    const newStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await apiClient.patch(`/admin/agents/${agent.id}`, { status: newStatus });
      setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, status: newStatus } : a));
      toast.success("وضعیت به‌روز شد");
    } catch { toast.error("خطا"); }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm("حذف ایجنت؟")) return;
    try {
      await apiClient.delete(`/admin/agents/${id}`);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      toast.success("ایجنت حذف شد");
    } catch { toast.error("خطا"); }
  };

  const addBusinessType = async () => {
    if (!newBtForm.key || !newBtForm.nameFa) return;
    setAddingBt(true);
    try {
      await apiClient.post("/admin/agent-business-types", newBtForm);
      setNewBtForm({ key: "", nameFa: "", icon: "🏢", description: "" });
      fetchBusinessTypes();
      toast.success("نوع کسب‌وکار اضافه شد");
    } finally { setAddingBt(false); }
  };

  const toggleBt = async (id: string, isActive: boolean) => {
    await apiClient.patch(`/admin/agent-business-types/${id}`, { isActive: !isActive });
    fetchBusinessTypes();
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiClient.patch("/admin/agent-settings", settingsForm);
      toast.success("تنظیمات ذخیره شد");
    } finally { setSavingSettings(false); }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "agents", label: "ایجنت‌ها" },
    { key: "business-types", label: "انواع کسب‌وکار" },
    { key: "settings", label: "تنظیمات" },
  ];

  return (
    <div className="p-6 max-w-7xl" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-violet-400" />
        <h1 className="text-xl font-semibold">مدیریت ایجنت‌ساز</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "کل ایجنت‌ها", value: stats.totalAgents, icon: Bot },
            { label: "ایجنت‌های فعال", value: stats.activeAgents, icon: CheckCircle2 },
            { label: "کل پیام‌ها", value: stats.totalMessages.toLocaleString(), icon: MessageSquare },
            { label: "لیدهای ایجاد‌شده", value: stats.totalLeads.toLocaleString(), icon: Target },
            { label: "کاربران ایجنت", value: stats.agentUsers, icon: Users },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <s.icon className="w-4 h-4 text-violet-400 mb-2" />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm transition-all border-b-2 ${tab === t.key ? "border-violet-500 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Agents tab */}
      {tab === "agents" && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="جستجو در ایجنت‌ها..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="ACTIVE">فعال</option>
              <option value="DRAFT">پیش‌نویس</option>
              <option value="PAUSED">متوقف</option>
            </select>
            <button onClick={fetchAgents} className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
              <RefreshCw className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-white/30">در حال بارگذاری...</div>
          ) : (
            <div className="bg-white/2 border border-white/8 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-right px-4 py-3 text-white/50 font-medium">ایجنت</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">صاحب</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">وضعیت</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">آمار</th>
                    <th className="text-right px-4 py-3 text-white/50 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{BT_ICONS[agent.businessType] ?? "🤖"}</span>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-white/30 text-xs font-mono">{agent.id.slice(0, 12)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{agent.user.name}</div>
                        <div className="text-white/40 text-xs">{agent.user.email ?? agent.user.phone}</div>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">{agent.user.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[agent.status] ?? ""}`}>
                          {STATUS_LABELS[agent.status] ?? agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 text-xs text-white/50">
                          <span>💬 {agent.totalConversations}</span>
                          <span>✉️ {agent.totalMessages}</span>
                          <span>🎯 {agent.totalLeads}</span>
                          <span>📚 {agent._count.knowledge}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleAgentStatus(agent)}
                            title={agent.status === "ACTIVE" ? "توقف" : "فعال‌سازی"}
                            className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all"
                          >
                            {agent.status === "ACTIVE" ? <PauseCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteAgent(agent.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agents.length === 0 && !loading && (
                <div className="text-center py-10 text-white/30">نتیجه‌ای یافت نشد</div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-3 mt-4">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors">
              ← قبلی
            </button>
            <span className="text-sm text-white/40">صفحه {page} از {Math.max(1, Math.ceil(total / 20))}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors">
              بعدی →
            </button>
          </div>
        </>
      )}

      {/* Business types tab */}
      {tab === "business-types" && (
        <div className="space-y-4">
          <div className="bg-white/3 border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4 text-sm">افزودن نوع کسب‌وکار جدید</h3>
            <div className="grid grid-cols-4 gap-3">
              <input
                placeholder="کلید (key)"
                value={newBtForm.key}
                onChange={(e) => setNewBtForm((f) => ({ ...f, key: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
              />
              <input
                placeholder="نام فارسی"
                value={newBtForm.nameFa}
                onChange={(e) => setNewBtForm((f) => ({ ...f, nameFa: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
              />
              <input
                placeholder="آیکون (emoji)"
                value={newBtForm.icon}
                onChange={(e) => setNewBtForm((f) => ({ ...f, icon: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={addBusinessType}
                disabled={addingBt || !newBtForm.key || !newBtForm.nameFa}
                className="bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                + افزودن
              </button>
            </div>
          </div>

          {btLoading ? (
            <div className="text-white/30 text-sm text-center py-10">در حال بارگذاری...</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {businessTypes.map((bt) => (
                <div key={bt.id} className={`border rounded-xl p-4 transition-all ${bt.isActive ? "border-white/10 bg-white/3" : "border-white/5 bg-white/1 opacity-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{bt.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{bt.nameFa}</div>
                      <div className="text-white/40 text-xs font-mono">{bt.key}</div>
                    </div>
                    <button
                      onClick={() => toggleBt(bt.id, bt.isActive)}
                      className={`mr-auto text-xs px-2.5 py-1 rounded-full border transition-colors ${bt.isActive ? "border-green-500/30 text-green-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "border-white/15 text-white/40 hover:text-green-400"}`}
                    >
                      {bt.isActive ? "فعال" : "غیرفعال"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && settings && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white/3 border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">محدودیت‌های پلن</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "freePlanAgents", label: "رایگان — تعداد ایجنت" },
                { key: "freePlanMessages", label: "رایگان — پیام ماهانه" },
                { key: "starterPlanAgents", label: "پایه — تعداد ایجنت" },
                { key: "starterPlanMessages", label: "پایه — پیام ماهانه" },
                { key: "proPlanAgents", label: "حرفه‌ای — تعداد ایجنت" },
                { key: "proPlanMessages", label: "حرفه‌ای — پیام ماهانه" },
                { key: "enterprisePlanAgents", label: "سازمانی — تعداد ایجنت" },
                { key: "enterprisePlanMessages", label: "سازمانی — پیام ماهانه" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-white/50 mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={(settingsForm as Record<string, number | undefined>)[field.key] ?? ""}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, [field.key]: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold mb-4">قیمت‌گذاری (تومان)</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "starterPlanPrice", label: "پلن پایه" },
                { key: "proPlanPrice", label: "پلن حرفه‌ای" },
                { key: "enterprisePlanPrice", label: "پلن سازمانی" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-white/50 mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={(settingsForm as Record<string, number | undefined>)[field.key] ?? ""}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, [field.key]: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">وضعیت سرویس</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setSettingsForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${settingsForm.isActive ? "bg-green-500" : "bg-white/20"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settingsForm.isActive ? "right-0.5" : "left-0.5"}`} />
                </div>
                <span className="text-sm text-white/70">{settingsForm.isActive ? "فعال" : "غیرفعال"}</span>
              </label>
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            {savingSettings ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        </div>
      )}
    </div>
  );
}
