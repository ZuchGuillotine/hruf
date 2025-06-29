import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LabResultInfo } from '@hruf/shared-types';
import { api } from '@/lib/api';

export function useLabs() {
  const queryClient = useQueryClient();

  const {
    data: labs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['labs'],
    queryFn: api.labs.getAll,
  });

  const uploadLab = useMutation({
    mutationFn: (formData: FormData) => api.labs.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
    },
  });

  return {
    labs,
    isLoading,
    error,
    refetch,
    uploadLab: uploadLab.mutate,
    isUploadingLoading: uploadLab.isPending,
    uploadError: uploadLab.error,
  };
}