import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import type { Project, Task, ApiResponse } from "@/types";

export const projectsKeys = {
  all: ["projects"] as const,
  lists: () => [...projectsKeys.all, "list"] as const,
  detail: (id: string) => [...projectsKeys.all, "detail", id] as const,
  tasks: (projectId: string) => [...projectsKeys.all, "tasks", projectId] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectsKeys.lists(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Project[]>>("/projects");
      return res.data.data;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Project & { tasks: Task[] }>>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: projectsKeys.tasks(projectId ?? "all"),
    queryFn: async () => {
      const url = projectId ? `/tasks?projectId=${projectId}` : "/tasks";
      const res = await api.get<ApiResponse<Task[]>>(url);
      return res.data.data;
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const res = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKeys.all }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await api.post<ApiResponse<Task>>("/tasks", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKeys.all }),
  });
}
