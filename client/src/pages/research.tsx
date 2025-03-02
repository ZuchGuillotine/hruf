
import React from 'react';
import { Link } from 'wouter';
import { useResearchDocuments } from '@/hooks/use-research';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResearchPage() {
  const { data: researchDocuments, isLoading, error } = useResearchDocuments();

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Research & Evidence</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <Card key={idx} className="h-full flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Research & Evidence</h1>
        <Card className="p-6 bg-red-50 border-red-200">
          <CardTitle className="text-red-700 mb-4">Error Loading Research</CardTitle>
          <CardContent>
            <p className="text-red-600">
              We encountered a problem loading the research documents. Please try again later.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Research & Evidence</h1>
      {researchDocuments && researchDocuments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {researchDocuments.map((doc) => (
            <Card key={doc.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{doc.title}</CardTitle>
                <CardDescription>
                  {doc.author} • {formatDate(doc.publishedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="line-clamp-3">
                  {doc.content.substring(0, 150)}...
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/research/${doc.slug}`}>
                  <Button className="w-full">Read More</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <CardContent>
            <p className="text-center text-gray-500">No research documents available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
