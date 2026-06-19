"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
}

interface OnboardingState {
  hasClients: boolean;
  hasLeads: boolean;
  hasTeamMembers: boolean;
  hasProjects: boolean;
  hasInvoices: boolean;
}

const STORAGE_KEY = "onboarding_dismissed";

export function OnboardingChecklist() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) {
      setDismissed(true);
      return;
    }
    Promise.all([
      apiClient.get<{ meta: { total: number } }>("/clients?perPage=1"),
      apiClient.get<{ meta: { total: number } }>("/leads?perPage=1"),
      apiClient.get<{ meta: { total: number } }>("/users?perPage=1"),
      apiClient.get<{ meta: { total: number } }>("/projects?perPage=1"),
      apiClient.get<{ meta: { total: number } }>("/invoices?perPage=1"),
    ]).then(([clients, leads, users, projects, invoices]) => {
      setState({
        hasClients: (clients.data.meta?.total ?? 0) > 0,
        hasLeads: (leads.data.meta?.total ?? 0) > 0,
        hasTeamMembers: (users.data.meta?.total ?? 0) > 1,
        hasProjects: (projects.data.meta?.total ?? 0) > 0,
        hasInvoices: (invoices.data.meta?.total ?? 0) > 0,
      });
    }).catch((err) => console.error(err));
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  if (dismissed || !state) return null;

  const steps: Step[] = [
    { id: "clients", title: "اولین مشتری را اضافه کنید", description: "اطلاعات اولین کلاینت خود را وارد کنید", href: "/clients", done: state.hasClients },
    { id: "leads", title: "اولین لید را ثبت کنید", description: "فرصت فروش اول را در Kanban ثبت کنید", href: "/leads", done: state.hasLeads },
    { id: "team", title: "تیم خود را دعوت کنید", description: "اعضای تیم را به workspace اضافه کنید", href: "/settings/users", done: state.hasTeamMembers },
    { id: "projects", title: "اولین پروژه را بسازید", description: "یک پروژه برای مشتری ایجاد کنید", href: "/projects", done: state.hasProjects },
    { id: "invoices", title: "اولین فاکتور را صادر کنید", description: "فاکتور یا پیش‌فاکتور ارسال کنید", href: "/invoicing", done: state.hasInvoices },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">
                شروع با Persicore CRM — {completedCount} از {steps.length} مرحله
              </span>
              <div className="w-48 h-1.5 rounded-full bg-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-primary"
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
              aria-label="بستن"
            >
              <X size={16} />
            </button>
            {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {steps.map((step) => (
                  <Link
                    key={step.id}
                    href={step.done ? "#" : step.href}
                    onClick={step.done ? (e) => e.preventDefault() : undefined}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      step.done
                        ? "border-green-500/20 bg-green-500/5 cursor-default"
                        : "border-border bg-background/50 hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {step.title}
                      </p>
                      {!step.done && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
