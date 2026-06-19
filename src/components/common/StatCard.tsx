"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  prefix?: string;
  suffix?: string;
  gradient?: string;
  color?: string;
  isAnimated?: boolean;
  className?: string;
}

function AnimatedNumber({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => {
    const n = Math.round(v);
    return `${prefix ?? ""}${n.toLocaleString("fa-IR")}${suffix ?? ""}`;
  });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [value, motionValue]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function StatCard({
  title, value, icon: Icon, trend, trendLabel, prefix, suffix, gradient, isAnimated = true, className,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative p-6 rounded-2xl border border-border bg-card overflow-hidden",
        "shadow-card hover:shadow-card-hover transition-shadow",
        className
      )}
    >
      {/* Gradient accent */}
      {gradient && (
        <div className={cn("absolute inset-0 opacity-5", gradient)} />
      )}

      {/* Border beam effect */}
      <div className="absolute inset-0 rounded-2xl border border-primary/0 hover:border-primary/20 transition-colors duration-500" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {isAnimated && typeof value === "number" ? (
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            ) : (
              <span>{prefix}{typeof value === "number" ? value.toLocaleString("fa-IR") : value}{suffix}</span>
            )}
          </div>

          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-red-500"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? "+" : ""}{trend}٪</span>
              {trendLabel && <span className="text-muted-foreground font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>

        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center",
          gradient ?? "bg-primary/10"
        )}>
          <Icon className={cn("w-5 h-5", gradient ? "text-black" : "text-primary")} />
        </div>
      </div>
    </motion.div>
  );
}
