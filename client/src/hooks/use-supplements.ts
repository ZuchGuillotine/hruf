import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertSupplement, SelectSupplement } from "@db/schema";

export function useSupplements() {
  const queryClient = useQueryClient();

  const supplements = useQuery<SelectSupplement[]>({
    queryKey: ["/api/supplements"],
  });

  const addSupplement = useMutation<SelectSupplement, Error, InsertSupplement>({
    mutationFn: async (supplement) => {
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplement),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      // Also invalidate today's supplement logs
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['supplement-logs', today] });
    },
  });

  const updateSupplement = useMutation<
    SelectSupplement,
    Error,
    { id: number; data: Partial<InsertSupplement> }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/supplements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      // Also invalidate today's supplement logs
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['supplement-logs', today] });
    },
  });

  const deleteSupplement = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/supplements/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete supplement");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
      // Also invalidate today's supplement logs
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['supplement-logs', today] });
    },
  });

  return {
    supplements: supplements.data ?? [],
    isLoading: supplements.isLoading,
    error: supplements.error,
    addSupplement: addSupplement.mutateAsync,
    updateSupplement: updateSupplement.mutateAsync,
    deleteSupplement: deleteSupplement.mutateAsync,
  };
}