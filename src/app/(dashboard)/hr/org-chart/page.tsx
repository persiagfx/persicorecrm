"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, User } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrgNode {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; role: string };
  parentId: string | null;
  position: string | null;
  department: string | null;
  children?: OrgNode[];
}

interface TeamUser { id: string; name: string; role: string; }

const ROLE_LABELS: Record<string, string> = {
  admin: "مدیر", sales_manager: "مدیر فروش", sales_rep: "کارشناس فروش",
  accountant: "حسابدار", hr_manager: "مدیر HR", support: "پشتیبانی",
  employee: "کارمند",
};

const DEPT_COLORS: Record<string, string> = {
  "فروش": "border-blue-500/40 bg-blue-500/5",
  "HR": "border-purple-500/40 bg-purple-500/5",
  "مالی": "border-emerald-500/40 bg-emerald-500/5",
  "فنی": "border-orange-500/40 bg-orange-500/5",
  "مارکتینگ": "border-pink-500/40 bg-pink-500/5",
};

function buildTree(nodes: OrgNode[]): OrgNode[] {
  const map = new Map(nodes.map(n => [n.userId, { ...n, children: [] as OrgNode[] }]));
  const roots: OrgNode[] = [];
  for (const node of map.values()) {
    if (node.parentId) {
      const parent = [...map.values()].find(n => n.userId === node.parentId);
      if (parent) parent.children!.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function OrgNodeCard({ node, onEdit, onDelete, isAdmin }: {
  node: OrgNode; onEdit: (n: OrgNode) => void; onDelete: (id: string) => void; isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const deptColor = DEPT_COLORS[node.department ?? ""] ?? "border-border bg-card";

  return (
    <div className="flex flex-col items-center gap-0">
      <div className={`relative border-2 rounded-2xl px-4 py-3 text-center min-w-[160px] max-w-[200px] ${deptColor} transition-all group`}>
        <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center font-bold text-black text-lg mx-auto mb-1.5">
          {node.user.name.charAt(0)}
        </div>
        <div className="font-semibold text-sm text-foreground truncate">{node.user.name}</div>
        {node.position && <div className="text-xs text-muted-foreground truncate">{node.position}</div>}
        {node.department && (
          <div className="mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">
            {node.department}
          </div>
        )}
        {isAdmin && (
          <div className="absolute top-1.5 left-1.5 hidden group-hover:flex gap-1">
            <button onClick={() => onEdit(node)} className="p-1 rounded-lg bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(node.id)} className="p-1 rounded-lg bg-background/80 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted z-10 transition-colors">
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="flex flex-col items-center mt-3">
          <div className="w-px h-4 bg-border" />
          <div className="relative flex gap-8">
            {node.children!.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-px bg-border" style={{ marginLeft: "80px", marginRight: "80px" }} />
            )}
            {node.children!.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrgNodeCard node={child} onEdit={onEdit} onDelete={onDelete} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { user } = useAuth();
  const isAdmin = ["admin", "hr_manager"].includes(user?.role ?? "");

  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OrgNode | null>(null);
  const [form, setForm] = useState({ userId: "", parentId: "", position: "", department: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/hr/org-chart")
      .then(r => r.json())
      .then(d => {
        const data = d.data ?? [];
        setNodes(data);
        setTree(buildTree(data));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      apiClient.get("/users").then(r => setUsers(r.data?.data ?? [])).catch((err) => console.error(err));
    }
  }, [isAdmin]);

  const openAdd = () => {
    setEditing(null);
    setForm({ userId: "", parentId: "", position: "", department: "" });
    setShowModal(true);
  };

  const openEdit = (node: OrgNode) => {
    setEditing(node);
    setForm({
      userId: node.userId,
      parentId: node.parentId ?? "",
      position: node.position ?? "",
      department: node.department ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.userId) { toast.error("کارمند را انتخاب کنید"); return; }
    setSaving(true);
    try {
      await fetch("/api/hr/org-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          parentId: form.parentId || null,
          position: form.position || null,
          department: form.department || null,
        }),
      });
      toast.success(editing ? "به‌روزرسانی شد" : "به نمودار اضافه شد");
      setShowModal(false);
      load();
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await fetch(`/api/hr/org-chart/${id}`, { method: "DELETE" });
      toast.success("حذف شد");
      load();
    } catch { toast.error("خطا در حذف"); }
  };

  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  const usersInChart = new Set(nodes.map(n => n.userId));
  const availableUsers = users.filter(u => !usersInChart.has(u.id) || (editing && u.id === editing.userId));

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            نمودار سازمانی
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{nodes.length} نفر در ساختار سازمان</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">
            <Plus className="w-4 h-4" />افزودن به نمودار
          </button>
        )}
      </motion.div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">در حال بارگذاری...</div>
      ) : tree.length === 0 ? (
        <div className="py-20 text-center">
          <Network className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground text-lg mb-2">ساختار سازمانی هنوز تعریف نشده</p>
          {isAdmin && (
            <p className="text-muted-foreground text-sm mb-4">از دکمه «افزودن به نمودار» شروع کنید. ابتدا مدیر ارشد را بدون مدیر مافوق اضافه کنید.</p>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-auto p-8">
          <div className="flex justify-center gap-16 min-w-max">
            {tree.map(root => (
              <OrgNodeCard key={root.id} node={root} onEdit={openEdit} onDelete={handleDelete} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      {/* Members list for mobile/fallback */}
      {!loading && nodes.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">لیست اعضا در نمودار</h3>
          </div>
          <div className="divide-y divide-border">
            {nodes.map(node => (
              <div key={node.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black">
                    {node.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{node.user.name}</p>
                    <p className="text-xs text-muted-foreground">{node.position ?? ROLE_LABELS[node.user.role] ?? node.user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {node.department && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{node.department}</span>
                  )}
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(node)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(node.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">{editing ? "ویرایش موقعیت" : "افزودن به نمودار"}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">کارمند *</label>
                  <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className={inputCls} disabled={!!editing}>
                    <option value="">انتخاب کارمند...</option>
                    {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role] ?? u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">مدیر مافوق (اگر ندارد خالی بذارید)</label>
                  <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))} className={inputCls}>
                    <option value="">بدون مدیر مافوق (ریشه نمودار)</option>
                    {nodes.filter(n => n.userId !== form.userId).map(n => (
                      <option key={n.userId} value={n.userId}>{n.user.name} — {n.position ?? n.department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">عنوان شغلی</label>
                  <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className={inputCls} placeholder="مثلاً: مدیر فروش، کارشناس ارشد" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">دپارتمان</label>
                  <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={inputCls}>
                    <option value="">بدون دپارتمان</option>
                    {["فروش", "HR", "مالی", "فنی", "مارکتینگ", "پشتیبانی", "مدیریت"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "افزودن"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
