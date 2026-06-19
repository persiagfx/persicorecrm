"use client";

import { useState, useCallback, useEffect } from "react";
import type { DashboardWidget } from "@/types";

const STORAGE_KEY = "persicore-dashboard-layout";

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "w-stats", type: "stats", title: "آمار کلی", x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
  { id: "w-revenue", type: "revenue_chart", title: "نمودار درآمد", x: 0, y: 2, w: 7, h: 4, minW: 4, minH: 3 },
  { id: "w-pipeline", type: "sales_pipeline", title: "پایپ‌لاین فروش", x: 7, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
  { id: "w-tasks", type: "pending_tasks", title: "تسک‌های در انتظار", x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
  { id: "w-activity", type: "recent_activity", title: "فعالیت اخیر", x: 4, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
  { id: "w-timer", type: "active_timer", title: "تایمر فعال", x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 2 },
  { id: "w-clients", type: "top_clients", title: "مشتریان برتر", x: 0, y: 10, w: 6, h: 3, minW: 3, minH: 2 },
  { id: "w-wiki", type: "pinned_wiki", title: "مقالات پین‌شده", x: 6, y: 10, w: 6, h: 3, minW: 3, minH: 2 },
];

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DashboardWidget[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
        }
      }
    } catch {
      // Ignore parse errors — use defaults
    }
    setIsHydrated(true);
  }, []);

  const saveLayout = useCallback((newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const updateWidgetPosition = useCallback(
    (id: string, updates: Partial<Pick<DashboardWidget, "x" | "y" | "w" | "h">>) => {
      setWidgets((prev) => {
        const next = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const addWidget = useCallback(
    (widget: DashboardWidget) => {
      saveLayout([...widgets, widget]);
    },
    [widgets, saveLayout]
  );

  const removeWidget = useCallback(
    (id: string) => {
      saveLayout(widgets.filter((w) => w.id !== id));
    },
    [widgets, saveLayout]
  );

  const resetLayout = useCallback(() => {
    saveLayout(DEFAULT_WIDGETS);
  }, [saveLayout]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  return {
    widgets,
    isEditMode,
    isHydrated,
    saveLayout,
    updateWidgetPosition,
    addWidget,
    removeWidget,
    resetLayout,
    toggleEditMode,
    DEFAULT_WIDGETS,
  };
}
