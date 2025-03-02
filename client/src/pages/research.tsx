
import React from "react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useResearch } from "@/hooks/use-research";
import Header from "@/components/header";
import LandingHeader from "@/components/landing-header";
import Footer from "@/components/footer";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";

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
                      <div className="block">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{doc.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {formatDate(doc.publishedAt || doc.createdAt)}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                          {doc.summary}
                        </p>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
                          Read more
                        </span>
                      </div>
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
                      <span>Add your first research document</span>
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
