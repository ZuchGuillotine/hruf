interface LabUploadProps {
  onUploadSuccess?: () => void;
  maxFiles?: number;
  allowedFileTypes?: {
    [key: string]: string[];
  };
  uploadEndpoint?: string;
}
export default function LabUpload({
  onUploadSuccess,
  maxFiles,
  allowedFileTypes,
  uploadEndpoint,
}: LabUploadProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=lab-upload.d.ts.map
