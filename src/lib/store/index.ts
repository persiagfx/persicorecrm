import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DashboardWidget, WidgetType, CompanySettings } from "@/types";

// ─── Theme Store ──────────────────────────────────────────────────────
interface ThemeStore {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  useEnglishNumbers: boolean;
  setUseEnglishNumbers: (v: boolean) => void;
  useShamsiDate: boolean;
  setUseShamsiDate: (v: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      reducedMotion: false,
      setReducedMotion: (v) => set({ reducedMotion: v }),
      useEnglishNumbers: false,
      setUseEnglishNumbers: (v) => set({ useEnglishNumbers: v }),
      useShamsiDate: true,
      setUseShamsiDate: (v) => set({ useShamsiDate: v }),
    }),
    { name: "crm-theme" }
  )
);

// ─── Sidebar Store ────────────────────────────────────────────────────
interface SidebarStore {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      collapse: () => set({ isCollapsed: true }),
      expand: () => set({ isCollapsed: false }),
      isMobileOpen: false,
      openMobile: () => set({ isMobileOpen: true }),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: "crm-sidebar",
      partialize: (s) => ({ isCollapsed: s.isCollapsed }),
    }
  )
);

// ─── Timer Store ──────────────────────────────────────────────────────
interface TimerStore {
  isRunning: boolean;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  timeEntryId: string | null;      // ID از DB
  startedAt: number | null;
  elapsedSeconds: number;
  startTimer: (taskId: string, taskTitle: string, projectId: string, timeEntryId?: string) => void;
  stopTimer: () => { durationSeconds: number; timeEntryId: string | null; projectId: string | null; taskId: string | null };
  tick: () => void;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      isRunning: false,
      taskId: null,
      taskTitle: null,
      projectId: null,
      timeEntryId: null,
      startedAt: null,
      elapsedSeconds: 0,
      startTimer: (taskId, taskTitle, projectId, timeEntryId) => {
        set({
          isRunning: true,
          taskId,
          taskTitle,
          projectId,
          timeEntryId: timeEntryId ?? null,
          startedAt: Date.now(),
          elapsedSeconds: 0,
        });
      },
      stopTimer: () => {
        const { startedAt, timeEntryId, projectId, taskId } = get();
        const durationSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
        set({
          isRunning: false,
          taskId: null,
          taskTitle: null,
          projectId: null,
          timeEntryId: null,
          startedAt: null,
          elapsedSeconds: 0,
        });
        return { durationSeconds, timeEntryId, projectId, taskId };
      },
      tick: () => {
        const { startedAt } = get();
        if (startedAt) {
          set({ elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) });
        }
      },
    }),
    { name: "crm-timer" }
  )
);

// ─── Dashboard Layout Store ───────────────────────────────────────────
const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "stats", type: "stats", title: "آمار کلی", x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
  { id: "revenue", type: "revenue_chart", title: "درآمد ماهانه", x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
  { id: "pipeline", type: "sales_pipeline", title: "پایپ‌لاین فروش", x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
  { id: "tasks", type: "pending_tasks", title: "تسک‌های امروز", x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
  { id: "activity", type: "recent_activity", title: "فعالیت اخیر", x: 6, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
];

interface DashboardLayoutStore {
  widgets: DashboardWidget[];
  isEditMode: boolean;
  setWidgets: (widgets: DashboardWidget[]) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  toggleEditMode: () => void;
}

export const useDashboardStore = create<DashboardLayoutStore>()(
  persist(
    (set, get) => ({
      widgets: DEFAULT_WIDGETS,
      isEditMode: false,
      setWidgets: (widgets) => set({ widgets }),
      addWidget: (type) => {
        const id = type + "_" + Date.now();
        const titles: Record<WidgetType, string> = {
          stats: "آمار کلی",
          revenue_chart: "نمودار درآمد",
          recent_activity: "فعالیت اخیر",
          active_timer: "تایمر فعال",
          pending_tasks: "تسک‌های در انتظار",
          sales_pipeline: "پایپ‌لاین فروش",
          calendar_week: "تقویم هفتگی",
          top_clients: "مشتریان برتر",
          recent_files: "فایل‌های اخیر",
          pinned_wiki: "مقالات پین‌شده",
        };
        const newWidget: DashboardWidget = {
          id,
          type,
          title: titles[type],
          x: 0,
          y: Infinity,
          w: 4,
          h: 3,
          minW: 2,
          minH: 2,
        };
        set({ widgets: [...get().widgets, newWidget] });
      },
      removeWidget: (id) => set({ widgets: get().widgets.filter((w) => w.id !== id) }),
      toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
    }),
    { name: "crm-dashboard" }
  )
);

// ─── Company Store ────────────────────────────────────────────────────
interface CompanyStore {
  settings: CompanySettings;
  updateSettings: (s: Partial<CompanySettings>) => void;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      settings: {
        name: "آژانس طراحی پرسی‌کور",
        legalName: "",
        taxId: "",
        registrationNumber: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        logoUrl: "",
        invoiceFooter: "با تشکر از همکاری شما",
        invoiceColor: "#d4a843",
        selectedModules: undefined, // undefined = show all (no filter)
      },
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
    }),
    { name: "crm-company" }
  )
);

// ─── UI Store (non-persisted) ─────────────────────────────────────────
interface UIStore {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;
  activeLeadId: string | null;
  setActiveLeadId: (id: string | null) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  notificationPanelOpen: false,
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  activeLeadId: null,
  setActiveLeadId: (id) => set({ activeLeadId: id }),
  activeTaskId: null,
  setActiveTaskId: (id) => set({ activeTaskId: id }),
}));
