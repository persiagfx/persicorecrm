import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";
import type { Lead, ApiResponse } from "@/types";

export const leadsKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsKeys.all, "list"] as const,
  list: (filters: Record<string, string>) => [...leadsKeys.lists(), filters] as const,
  detail: (id: string) => [...leadsKeys.all, "detail", id] as const,
};

export function useLeads(filters: Record<string, string> = {}) {
  return useQuery({
    queryKey: leadsKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get<ApiResponse<Lead[]>>(`/leads${params ? `?${params}` : ""}`);
      return res.data.data;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadsKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Lead>>(`/leads/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const res = await api.patch<ApiResponse<Lead>>(`/leads/${id}`, data);
      return res.data.data;
    },
    onSuccess: (updated, { id }) => {
      if (updated) {
        qc.setQueryData<Lead>(leadsKeys.detail(id), updated);
      }
      qc.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const res = await api.post<ApiResponse<Lead>>("/leads", data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: leadsKeys.all }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leads/${id}`);
      return id;
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: leadsKeys.detail(id) });
      qc.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}
