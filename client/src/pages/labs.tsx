
import Header from "@/components/header";
import Footer from "@/components/footer";
import LabUpload from "@/components/lab-upload";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File, FileText, Download } from "lucide-react";

interface LabFile {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export default function Labs() {
  const [labFiles, setLabFiles] = useState<LabFile[]>([]);

  useEffect(() => {
    const fetchLabFiles = async () => {
      try {
        const response = await fetch('/api/labs');
        if (response.ok) {
          const data = await response.json();
          setLabFiles(data);
        }
      } catch (error) {
        console.error('Failed to fetch lab files:', error);
      }
    };

    fetchLabFiles();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-grow">
        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Lab Results</h2>
          <LabUpload />
        </div>

        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Uploaded Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labFiles.map((file) => (
              <Card key={file.id} className="bg-white/10 border-none text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{file.fileName}</CardTitle>
                  <FileText className="h-4 w-4 text-white/70" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-white/70">
                    Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                  <a
                    href={file.fileUrl}
                    download
                    className="flex items-center gap-2 text-sm text-white/90 hover:text-white mt-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
