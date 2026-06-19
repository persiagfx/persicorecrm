import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Invoice, ApiResponse } from "@/types";

const INVOICES_KEY = ["invoices"] as const;

// ─── List ────────────────────────────────────────────────────────────────────
export function useInvoices(params?: { status?: string; type?: string; clientId?: string }) {
  return useQuery({
    queryKey: [...INVOICES_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Invoice[]>>("/api/invoices", { params });
      return data;
    },
  });
}

// ─── Single ───────────────────────────────────────────────────────────────────
export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Invoice>>(`/api/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Invoice>) => {
      const { data } = await apiClient.post<ApiResponse<Invoice>>("/api/invoices", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────
export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Invoice> & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Invoice>>(`/api/invoices/${id}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY });
      qc.invalidateQueries({ queryKey: [...INVOICES_KEY, variables.id] });
    },
  });
}

// ─── Mark as Paid ─────────────────────────────────────────────────────────────
export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<Invoice>>(`/api/invoices/${id}/mark-paid`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

// ─── Send Invoice ─────────────────────────────────────────────────────────────
export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<Invoice>>(`/api/invoices/${id}/send`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ success: boolean }>>(`/api/invoices/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}
