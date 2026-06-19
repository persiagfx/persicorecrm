"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Users, UserPlus, TrendingUp, FileText,
  CheckCircle2, ArrowLeft, SkipForward, Home,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  {
    id: "company_info",
    index: 1,
    title: "اطلاعات شرکت",
    description: "نام، لوگو و آدرس شرکت خود را تنظیم کنید",
    icon: Building2,
    actionLabel: "تکمیل اطلاعات شرکت",
    actionPath: "/settings",
  },
  {
    id: "invite_team",
    index: 2,
    title: "دعوت از تیم",
    description: "اولین عضو تیم خود را دعوت کنید",
    icon: UserPlus,
    actionLabel: "دعوت از همکار",
    actionPath: "/users",
  },
  {
    id: "first_client",
    index: 3,
    title: "ایجاد اولین مشتری",
    description: "اولین مشتری خود را در سیستم ثبت کنید",
    icon: Users,
    actionLabel: "افزودن مشتری",
    actionPath: "/clients/new",
  },
  {
    id: "first_lead",
    index: 4,
    title: "ایجاد اولین لید",
    description: "اولین فرصت فروش خود را ثبت کنید",
    icon: TrendingUp,
    actionLabel: "افزودن لید",
    actionPath: "/leads",
  },
  {
    id: "invoice_settings",
    index: 5,
    title: "تنظیم فاکتور",
    description: "قالب و اطلاعات فاکتور خود را شخصی‌سازی کنید",
    icon: FileText,
    actionLabel: "تنظیمات فاکتور",
    actionPath: "/settings/invoice",
  },
  {
    id: "completed",
    index: 6,
    title: "آماده‌اید!",
    description: "همه مراحل را با موفقیت تکمیل کردید",
    icon: CheckCircle2,
    actionLabel: null,
    actionPath: null,
  },
];

interface OnboardingProgress {
  steps: Record<string, boolean>;
  completed: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await apiClient.get("/onboarding");
      const data = res.data?.data ?? res.data;
      setProgress(data);
      // Set active step to first incomplete step
      const steps = (data.steps as Record<string, boolean>) ?? {};
      const firstIncomplete = STEPS.findIndex((s) => !steps[s.id]);
      setActiveStep(firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete);
    } catch {
      toast.error("خطا در بارگذاری پیشرفت");
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (stepId: string) => {
    setMarking(true);
    try {
      const res = await apiClient.patch("/onboarding", { step: stepId });
      const data = res.data?.data ?? res.data;
      setProgress(data);
      toast.success("مرحله تکمیل شد");
      // Move to next step
      const nextIndex = STEPS.findIndex((s) => s.id === stepId) + 1;
      if (nextIndex < STEPS.length) setActiveStep(nextIndex);
    } catch {
      toast.error("خطا در ذخیره پیشرفت");
    } finally {
      setMarking(false);
    }
  };

  const completedSteps = progress
    ? STEPS.filter((s) => (progress.steps as Record<string, boolean>)?.[s.id]).length
    : 0;

  const progressPercent = (completedSteps / (STEPS.length - 1)) * 100;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">راه‌اندازی اولیه</h1>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            بازگشت به داشبورد
          </button>
        </div>
        <p className="text-white/40 text-sm">
          برای بهره‌مندی کامل از امکانات CRM، مراحل زیر را تکمیل کنید
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">
            {completedSteps} از {STEPS.length - 1} مرحله کامل شده
          </span>
          <span className="text-sm font-semibold text-violet-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-3 mb-8">
        {STEPS.map((step, idx) => {
          const isDone = !!(progress?.steps as Record<string, boolean>)?.[step.id];
          const isActive = idx === activeStep;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              layout
              onClick={() => setActiveStep(idx)}
              className={cn(
                "rounded-2xl border p-4 cursor-pointer transition-all",
                isActive
                  ? "border-violet-500/40 bg-violet-500/5 shadow-lg shadow-violet-500/5"
                  : isDone
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Step number / check */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                    isDone
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isActive
                      ? "bg-violet-600/30 text-violet-400"
                      : "bg-white/5 text-white/30"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        isDone
                          ? "bg-emerald-500/15 text-emerald-400"
                          : isActive
                          ? "bg-violet-500/15 text-violet-400"
                          : "bg-white/5 text-white/30"
                      )}
                    >
                      مرحله {step.index}
                    </span>
                    {isDone && (
                      <span className="text-xs text-emerald-400">تکمیل شده</span>
                    )}
                  </div>
                  <h3
                    className={cn(
                      "font-semibold mt-1",
                      isDone
                        ? "text-white/60"
                        : isActive
                        ? "text-white"
                        : "text-white/50"
                    )}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs text-white/30 mt-0.5">{step.description}</p>
                </div>

                {/* Expand arrow */}
                <div
                  className={cn(
                    "w-6 h-6 flex items-center justify-center flex-shrink-0 transition-transform",
                    isActive ? "rotate-90" : ""
                  )}
                >
                  <ArrowLeft className="w-4 h-4 text-white/20" />
                </div>
              </div>

              {/* Expanded action area */}
              <AnimatePresence>
                {isActive && step.id !== "completed" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center gap-3">
                      {step.actionPath && step.actionLabel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markStepComplete(step.id).then(() => {
                              router.push(step.actionPath!);
                            });
                          }}
                          disabled={marking || isDone}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold disabled:opacity-50 hover:shadow-md hover:shadow-violet-500/20 transition-all"
                        >
                          {step.actionLabel}
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isDone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markStepComplete(step.id);
                          }}
                          disabled={marking}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/40 text-sm hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-50"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          رد کردن
                        </button>
                      )}
                      {isDone && (
                        <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          این مرحله کامل شده
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Completion step */}
                {isActive && step.id === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/[0.06] text-center space-y-3">
                      <p className="text-sm text-white/50">
                        {completedSteps >= 5
                          ? "تبریک! همه مراحل را با موفقیت تکمیل کردید."
                          : `${5 - completedSteps} مرحله دیگر باقی مانده است.`}
                      </p>
                      <button
                        onClick={() => {
                          if (completedSteps >= 5) {
                            markStepComplete("completed");
                          }
                          router.push("/");
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:shadow-md hover:shadow-violet-500/20 transition-all"
                      >
                        <Home className="w-4 h-4" />
                        ورود به داشبورد
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom action */}
      <div className="flex justify-center">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
}
