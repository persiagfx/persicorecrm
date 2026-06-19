"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Zap, Building2, Briefcase, Clock, FileText,
  DollarSign, UsersRound, Receipt, TicketCheck, BookOpen, Calendar,
  FolderOpen, MessageSquare, BarChart3, Activity, Settings, Plus,
  Search, FileSignature,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const pages = [
  { href: "/", icon: LayoutDashboard, label: "داشبورد" },
  { href: "/leads", icon: Zap, label: "سرنخ‌ها" },
  { href: "/clients", icon: Building2, label: "مشتریان" },
  { href: "/projects", icon: Briefcase, label: "پروژه‌ها" },
  { href: "/timer", icon: Clock, label: "تایمر" },
  { href: "/invoicing", icon: FileText, label: "فاکتورها" },
  { href: "/expenses", icon: Receipt, label: "هزینه‌ها" },
  { href: "/finance", icon: DollarSign, label: "مالی شرکت" },
  { href: "/team", icon: UsersRound, label: "اعضای تیم" },
  { href: "/tickets", icon: TicketCheck, label: "تیکت‌ها" },
  { href: "/wiki", icon: BookOpen, label: "ویکی" },
  { href: "/calendar", icon: Calendar, label: "تقویم" },
  { href: "/files", icon: FolderOpen, label: "فایل‌ها" },
  { href: "/messages", icon: MessageSquare, label: "پیام‌ها" },
  { href: "/contracts", icon: FileSignature, label: "قراردادها" },
  { href: "/reports", icon: BarChart3, label: "گزارش‌ها" },
  { href: "/activity", icon: Activity, label: "لاگ فعالیت" },
  { href: "/settings", icon: Settings, label: "تنظیمات" },
];

const quickCreate = [
  { label: "Lead جدید", icon: Zap, action: "/leads?new=1" },
  { label: "مشتری جدید", icon: Building2, action: "/clients?new=1" },
  { label: "پروژه جدید", icon: Briefcase, action: "/projects?new=1" },
  { label: "فاکتور جدید", icon: FileText, action: "/invoicing/new" },
  { label: "تیکت جدید", icon: TicketCheck, action: "/tickets?new=1" },
];

interface SearchResults {
  clients: Array<{ id: string; companyName: string; contactName: string; status: string }>;
  leads: Array<{ id: string; companyName: string; contactName: string; status: string }>;
  projects: Array<{ id: string; name: string; status: string; client?: { companyName: string } }>;
  invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setCommandPaletteOpen]);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) { setSearchResults(null); return; }
    setIsSearching(true);
    apiClient.get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => setSearchResults(res.data.data))
      .catch(console.error)
      .finally(() => setIsSearching(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const navigate = (href: string) => {
    router.push(href);
    setCommandPaletteOpen(false);
    setQuery("");
    setSearchResults(null);
  };

  const hasResults = searchResults && (
    searchResults.clients.length > 0 ||
    searchResults.leads.length > 0 ||
    searchResults.projects.length > 0 ||
    searchResults.invoices.length > 0
  );

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setCommandPaletteOpen(false); setQuery(""); setSearchResults(null); }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <Command
              className={cn(
                "glass border border-border rounded-2xl shadow-modal overflow-hidden",
                "dark:bg-[hsla(240,10%,6%,0.95)]"
              )}
              dir="rtl"
              shouldFilter={!hasResults}
            >
              <div className="flex items-center border-b border-border px-4">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Command.Input
                  placeholder="جستجو در مشتریان، پروژه‌ها، لیدها..."
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 py-4 px-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                  autoFocus
                />
                {isSearching && (
                  <div className="w-3.5 h-3.5 border border-primary/40 border-t-primary rounded-full animate-spin shrink-0" />
                )}
                <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 mr-2">
                  Esc
                </kbd>
              </div>

              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  {isSearching ? "در حال جستجو..." : "نتیجه‌ای یافت نشد"}
                </Command.Empty>

                {/* Live search results */}
                {hasResults && (
                  <>
                    {searchResults!.clients.length > 0 && (
                      <Command.Group heading="مشتریان" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                        {searchResults!.clients.map((c) => (
                          <Command.Item
                            key={c.id}
                            value={`client-${c.id}`}
                            onSelect={() => navigate(`/clients/${c.id}`)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm",
                              "aria-selected:bg-primary/10 aria-selected:text-primary transition-colors"
                            )}
                          >
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-foreground">{c.companyName}</span>
                            <span className="text-xs text-muted-foreground">{c.contactName}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {searchResults!.leads.length > 0 && (
                      <Command.Group heading="لیدها" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                        {searchResults!.leads.map((l) => (
                          <Command.Item
                            key={l.id}
                            value={`lead-${l.id}`}
                            onSelect={() => navigate(`/leads`)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm",
                              "aria-selected:bg-primary/10 aria-selected:text-primary transition-colors"
                            )}
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-foreground">{l.companyName}</span>
                            <span className="text-xs text-muted-foreground">{l.contactName}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {searchResults!.projects.length > 0 && (
                      <Command.Group heading="پروژه‌ها" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                        {searchResults!.projects.map((p) => (
                          <Command.Item
                            key={p.id}
                            value={`project-${p.id}`}
                            onSelect={() => navigate(`/projects`)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm",
                              "aria-selected:bg-primary/10 aria-selected:text-primary transition-colors"
                            )}
                          >
                            <Briefcase className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-foreground">{p.name}</span>
                            {p.client && <span className="text-xs text-muted-foreground">{p.client.companyName}</span>}
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {searchResults!.invoices.length > 0 && (
                      <Command.Group heading="فاکتورها" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                        {searchResults!.invoices.map((inv) => (
                          <Command.Item
                            key={inv.id}
                            value={`invoice-${inv.id}`}
                            onSelect={() => navigate(`/invoicing`)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm",
                              "aria-selected:bg-primary/10 aria-selected:text-primary transition-colors"
                            )}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-foreground font-mono text-xs">{inv.invoiceNumber}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}

                {/* Default state: quick create + pages */}
                {!hasResults && !isSearching && (
                  <>
                    <Command.Group heading="ایجاد سریع" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                      {quickCreate.map((item) => (
                        <Command.Item
                          key={item.label}
                          value={item.label}
                          onSelect={() => navigate(item.action)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm",
                            "text-muted-foreground",
                            "aria-selected:bg-primary/10 aria-selected:text-primary",
                            "transition-colors"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <item.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Separator className="h-px bg-border mx-2 my-1" />

                    <Command.Group heading="صفحات" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                      {pages.map((page) => (
                        <Command.Item
                          key={page.href}
                          value={page.label}
                          onSelect={() => navigate(page.href)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm",
                            "text-muted-foreground",
                            "aria-selected:bg-primary/10 aria-selected:text-primary",
                            "transition-colors"
                          )}
                        >
                          <page.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{page.label}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </>
                )}
              </Command.List>

              <div className="border-t border-border p-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span><kbd className="border border-border rounded px-1">↑↓</kbd> انتخاب</span>
                <span><kbd className="border border-border rounded px-1">Enter</kbd> باز کردن</span>
                <span><kbd className="border border-border rounded px-1">Esc</kbd> بستن</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
