import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  overdueInvoices: number;
  revenue: number;
  revenueGrowth: number;
  newLeads: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueByMonth: { month: string; revenue: number }[];
  leadsByStatus: { status: string; _count: { id: number }; _sum: { estimatedValue: number | null } }[];
  recentActivities: { id: string; description: string; createdAt: string; actor?: { name: string; avatar: string | null; color: string | null } }[];
  pendingTasks: { id: string; title: string; priority: string; dueDate: string | null; project?: { id: string; name: string } }[];
  upcomingReminders: { id: string; title: string; dueDate: string }[];
  runningTimer: { id: string; task?: { title: string }; project?: { id: string; name: string } } | null;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await apiClient.get("/dashboard");
  return res.data.data as DashboardData;
}

async function fetchActiveProjects() {
  const res = await apiClient.get("/projects?status=in_progress&perPage=6");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res.data.data ?? []) as any[];
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  activeProjects: ["dashboard", "active-projects"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useDashboardActiveProjects() {
  return useQuery({
    queryKey: dashboardKeys.activeProjects,
    queryFn: fetchActiveProjects,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
