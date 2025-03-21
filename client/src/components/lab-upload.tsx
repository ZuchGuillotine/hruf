
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";

export default function LabUpload() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/labs/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        setFiles([]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
          isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">Drag & drop files here, or click to select files</p>
        <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX, and images</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Selected Files:</h3>
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <File className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          ))}
          <Button onClick={handleUpload} className="w-full">
            Upload {files.length} file{files.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
