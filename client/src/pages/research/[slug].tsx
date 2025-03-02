import React from "react";
import { useParams, Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useResearch } from "@/hooks/use-research";
import Header from "@/components/header";
import LandingHeader from "@/components/landing-header";
import Footer from "@/components/footer";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResearchDocumentPage() {
  const { slug } = useParams();
  const { user } = useUser();
  const { getResearchBySlug } = useResearch();
  const { data: document, isLoading, error } = getResearchBySlug(slug);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8 text-green-600" />
        </div>
      );
    }

    if (error || !document) {
      return (
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Document Not Found</h2>
          <p className="text-red-700 dark:text-red-300">
            {error instanceof Error ? error.message : "The requested research document could not be found."}
          </p>
        </div>
      );
    }

    return (
      <>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{document.title}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {document.authors && <p className="mb-1">By: {document.authors}</p>}
          <p>Published: {formatDate(document.publishedAt || document.createdAt)}</p>
        </div>
        {document.imageUrls && document.imageUrls.length > 0 && (
          <div className="mb-6">
            <img 
              src={document.imageUrls[0]} 
              alt={document.title} 
              className="w-full h-auto rounded-lg" 
            />
          </div>
        )}
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: document.content }} />
        </div>
        {document.tags && document.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {document.tags.map((tag, i) => (
              <span 
                key={i} 
                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {user ? <Header /> : <LandingHeader />}
      <main className="flex-grow bg-white dark:bg-gray-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/research">
              <div className="inline-flex items-center text-green-600 dark:text-green-400 hover:underline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Research
              </div>
            </Link>
          </div>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}