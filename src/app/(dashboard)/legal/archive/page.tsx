"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Archive, Search, Download } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { RoleGuard } from "@/components/common/RoleGuard";

interface ArchiveItem {
  id: string;
  title: string;
  type: string;
  subtype: string;
  date: string;
  status: string;
}

export default function LegalArchivePage() {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [allItems, setAllItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/legal/cases", { params: { status: "closed,won,lost" } }),
      apiClient.get("/legal/contracts"),
    ])
      .then(([casesRes, contractsRes]) => {
        const casesData = casesRes.data?.data ?? casesRes.data;
        const contractsData = contractsRes.data?.data ?? contractsRes.data;

        const caseItems: ArchiveItem[] = (Array.isArray(casesData) ? casesData : [])
          .filter((c: { status: string }) => c.status === "closed" || c.status === "won" || c.status === "lost")
          .map((c: { id: string; title: string; type: string; updatedAt: string; status: string }) => ({
            id: c.id,
            title: c.title,
            type: "پرونده حقوقی",
            subtype: c.type,
            date: c.updatedAt,
            status: c.status,
          }));

        const contractItems: ArchiveItem[] = (Array.isArray(contractsData) ? contractsData : [])
          .map((c: { id: string; title: string; type: string; createdAt: string; status: string }) => ({
            id: c.id,
            title: c.title,
            type: "قرارداد",
            subtype: c.type,
            date: c.createdAt,
            status: c.status,
          }));

        setAllItems([...caseItems, ...contractItems]);
      })
      .catch(() => toast.error("خطا در دریافت آرشیو"))
      .finally(() => setLoading(false));
  }, []);

  const years = [...new Set(allItems.map(i => new Date(i.date).getFullYear().toString()))].sort().reverse();

  const filtered = useMemo(() => allItems.filter(i => {
    const matchYear = yearFilter === "all" || new Date(i.date).getFullYear().toString() === yearFilter;
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    return matchYear && matchSearch;
  }), [allItems, yearFilter, search]);

  const handleExport = () => {
    const csv = ["عنوان,نوع,وضعیت,تاریخ",
      ...filtered.map(i => `"${i.title}","${i.type}","${i.status}","${new Date(i.date).toLocaleDateString("fa-IR")}"`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "legal-archive.csv"; a.click();
  };

  return (
    <RoleGuard roles={["admin", "legal"]}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Archive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">آرشیو حقوقی</h1>
              <p className="text-sm text-muted-foreground">{allItems.length} سند بایگانی‌شده</p>
            </div>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" />خروجی CSV
          </button>
        </motion.div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-lg bg-card border border-border focus:outline-none focus:border-primary" />
          </div>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="input-field">
            <option value="all">همه سال‌ها</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["عنوان", "نوع", "زیرنوع", "وضعیت", "تاریخ"].map(h => (
                      <th key={h} className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{item.title}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded">{item.type}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.subtype}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.status}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString("fa-IR")}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">موردی یافت نشد</div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
