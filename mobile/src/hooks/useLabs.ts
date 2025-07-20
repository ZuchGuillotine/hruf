// Temporary simple labs hook for testing  
export function useLabs() {
  return {
    labs: [],
    isLoading: false,
    error: null,
    refetch: () => {},
    uploadLab: () => {},
    isUploadingLoading: false,
    uploadError: null,
  };
}