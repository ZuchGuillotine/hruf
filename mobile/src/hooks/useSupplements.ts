// Temporary simple supplements hook for testing
export function useSupplements() {
  return {
    supplements: [],
    isLoading: false,
    error: null,
    refetch: () => {},
    addSupplement: () => {},
    updateSupplement: () => {},
    deleteSupplement: () => {},
    isAddingLoading: false,
    isUpdatingLoading: false,
    isDeletingLoading: false,
    addError: null,
    updateError: null,
    deleteError: null,
  };
}