
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        {user ? <Header /> : <LandingHeader />}
        <main className="flex-grow flex items-center justify-center">
          <Spinner className="h-8 w-8 text-green-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col">
        {user ? <Header /> : <LandingHeader />}
        <main className="flex-grow bg-white dark:bg-gray-950 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <Link href="/research">
                <a className="inline-flex items-center text-green-600 dark:text-green-400 hover:underline">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Research
                </a>
              </Link>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
              <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Document Not Found</h2>
              <p className="text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : "The requested research document could not be found."}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user ? <Header /> : <LandingHeader />}
      <main className="flex-grow bg-white dark:bg-gray-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Link href="/research">
              <a className="inline-flex items-center text-green-600 dark:text-green-400 hover:underline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Research
              </a>
            </Link>
          </div>

          <article className="prose prose-green dark:prose-invert lg:prose-lg max-w-none">
            <h1>{document.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3 -mt-4 mb-8">
              <span>{formatDate(new Date(document.publishedAt))}</span>
              <span>•</span>
              <span>By {document.authors}</span>
            </div>
            
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-6 -mt-4">
                {document.tags.map((tag, index) => (
                  <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Summary highlighted block */}
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r mb-8">
              <p className="text-gray-800 dark:text-gray-200 font-medium italic m-0">
                {document.summary}
              </p>
            </div>
            
            {/* Images if available */}
            {document.imageUrls && document.imageUrls.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.imageUrls.map((url, index) => (
                  <div key={index} className="rounded-lg overflow-hidden">
                    <img 
                      src={url}
                      alt={`Research image ${index + 1}`}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Main content */}
            <div 
              className="research-content" 
              dangerouslySetInnerHTML={{ __html: document.content }} 
            />
            
            {/* Admin edit button if user is admin */}
            {user?.isAdmin && (
              <div className="mt-8 pb-4">
                <Link href={`/admin/research/edit/${document.id}`}>
                  <Button variant="outline">Edit Research Document</Button>
                </Link>
              </div>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
