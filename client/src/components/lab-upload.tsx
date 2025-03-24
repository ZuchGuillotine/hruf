
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, File, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface LabUploadProps {
  onUploadSuccess?: () => void;
  maxFiles?: number;
  allowedFileTypes?: {
    [key: string]: string[];
  };
  uploadEndpoint?: string;
}

const defaultAllowedTypes = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/*': ['.png', '.jpg', '.jpeg']
};

export default function LabUpload({ 
  onUploadSuccess, 
  maxFiles = 5,
  allowedFileTypes = defaultAllowedTypes,
  uploadEndpoint = '/api/labs'
}: LabUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => {
      const newFiles = [...prev, ...acceptedFiles];
      return newFiles.slice(0, maxFiles);
    });
  }, [maxFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes,
    maxFiles,
    multiple: true
  });

  const handleUpload = async () => {
    try {
      setUploading(true);

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
      }

      setFiles([]);
      toast({
        title: "Success",
        description: "Lab results uploaded successfully",
        duration: 3000
      });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Error",
        description: "Failed to upload lab results",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setUploading(false);
    }
  };

  const allowedExtensions = Object.values(allowedFileTypes)
    .flat()
    .map(ext => ext.replace('.', '').toUpperCase())
    .join(', ');

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 font-medium">Drag & drop lab files here, or click to select</p>
        <p className="text-sm text-muted-foreground mt-1">
          Supported formats: {allowedExtensions}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxFiles} file{maxFiles !== 1 ? 's' : ''} allowed
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={file.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <div className="flex items-center gap-2 text-sm">
                <File className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Upload {files.length} file{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
