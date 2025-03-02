
import React from 'react';
import { useRoute } from 'wouter';
import { useResearchDocument } from '@/hooks/use-research';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResearchDocumentPage() {
  const [match, params] = useRoute('/research/:slug');
  const slug = params?.slug;
  
  const { data: document, isLoading, error } = useResearchDocument(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <Link href="/research">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Research
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <Link href="/research">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Research
          </Button>
        </Link>
        
        <Card className="p-6 bg-red-50 border-red-200">
          <CardTitle className="text-red-700 mb-4">Document Not Found</CardTitle>
          <CardContent>
            <p className="text-red-600">
              We couldn't find the research document you're looking for. It may have been removed or the URL might be incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Link href="/research">
        <Button variant="ghost" className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Research
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">{document.title}</CardTitle>
          <div className="text-sm text-gray-500">
            By {document.author} • Published {formatDate(document.publishedAt)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {document.content.split('\n').map((paragraph, idx) => (
              paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
