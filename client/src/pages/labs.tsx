import Header from "@/components/header";
import Footer from "@/components/footer";
import LabUpload from "@/components/lab-upload";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { File, FileText, Download, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface LabFile {
  id: number;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export default function Labs() {
  const [labFiles, setLabFiles] = useState<LabFile[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

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

  useEffect(() => {
    fetchLabFiles();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lab result?')) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/labs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update state locally instead of re-fetching
        setLabFiles(prev => prev.filter(file => file.id !== id));
      } else {
        console.error('Failed to delete lab file');
      }
    } catch (error) {
      console.error('Error deleting lab file:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8f3e8]">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6 flex-grow">
        <div className="bg-[#1b4332] rounded-lg p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Lab Results</h2>
          <LabUpload onUploadSuccess={fetchLabFiles} />
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
                  <div className="flex items-center gap-4 mt-2">
                    <a
                      href={file.fileUrl}
                      download
                      className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting === file.id}
                      className="flex items-center gap-2 text-sm text-white/90 hover:text-white disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting === file.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Link href="/" className="flex items-center gap-2 text-black mt-6 ml-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </main>
      <Footer />
    </div>
  );
}