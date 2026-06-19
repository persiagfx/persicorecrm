import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Client, ApiResponse } from "@/types";

const CLIENTS_KEY = ["clients"] as const;

// ─── List ────────────────────────────────────────────────────────────────────
export function useClients(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Client[]>>("/api/clients", { params });
      return data;
    },
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────
export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Client>>(`/api/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Client>) => {
      const { data } = await apiClient.post<ApiResponse<Client>>("/api/clients", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────
export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Client> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Client>>(`/api/clients/${id}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY });
      qc.invalidateQueries({ queryKey: [...CLIENTS_KEY, variables.id] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/api/clients/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });
}
