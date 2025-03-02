
import React from "react";
import Header from "@/components/header";
import { useUser } from "@/hooks/use-user";
import LandingHeader from "@/components/landing-header";
import Footer from "@/components/footer";
import { useResearch } from "@/hooks/use-research";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";

export default function ResearchPage() {
  const { user } = useUser();
  const { researchDocuments, isLoadingDocuments, error } = useResearch();
  
  return (
    <div className="min-h-screen flex flex-col">
      {user ? <Header /> : <LandingHeader />}
      
      <main className="flex-grow bg-white dark:bg-gray-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Supplement Research
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Access the latest research and studies on supplements, their effects, and potential benefits.
            </p>
            
            {isLoadingDocuments ? (
              <div className="flex justify-center items-center p-12">
                <Spinner className="h-8 w-8 text-green-600" />
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            ) : researchDocuments && researchDocuments.length > 0 ? (
              <div className="space-y-6">
                {researchDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors">
                    <Link href={`/research/${doc.slug}`}>
                      <a className="block">
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{doc.title}</h2>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3 space-x-3">
                          <span>{formatDate(new Date(doc.publishedAt))}</span>
                          <span>•</span>
                          <span>By {doc.authors}</span>
                          {doc.tags && doc.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.map((tag, index) => (
                                  <span key={index} className="inline-block px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{doc.summary}</p>
                        <div className="text-green-600 dark:text-green-400 font-medium text-sm">
                          Read more →
                        </div>
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">No research documents available yet.</p>
                {user?.isAdmin && (
                  <p className="mt-2 text-green-600 dark:text-green-400">
                    <Link href="/admin/research">
                      <a>Add your first research document</a>
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
