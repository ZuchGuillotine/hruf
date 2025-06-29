import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupplementInfo } from '@hruf/shared-types';
import { api } from '@/lib/api';

export function useSupplements() {
  const queryClient = useQueryClient();

  const {
    data: supplements = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['supplements'],
    queryFn: api.supplements.getAll,
  });

  const addSupplement = useMutation({
    mutationFn: (supplement: Omit<SupplementInfo, 'id'>) =>
      api.supplements.add(supplement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });

  const updateSupplement = useMutation({
    mutationFn: ({ id, ...supplement }: { id: string } & Partial<SupplementInfo>) =>
      api.supplements.update(id, supplement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });

  const deleteSupplement = useMutation({
    mutationFn: (id: string) => api.supplements.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] });
    },
  });

  return {
    supplements,
    isLoading,
    error,
    refetch,
    addSupplement: addSupplement.mutate,
    updateSupplement: updateSupplement.mutate,
    deleteSupplement: deleteSupplement.mutate,
    isAddingLoading: addSupplement.isPending,
    isUpdatingLoading: updateSupplement.isPending,
    isDeletingLoading: deleteSupplement.isPending,
    addError: addSupplement.error,
    updateError: updateSupplement.error,
    deleteError: deleteSupplement.error,
  };
}