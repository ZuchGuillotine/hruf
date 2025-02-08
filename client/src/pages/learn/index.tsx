
import { Fragment } from "react";
import { Link } from "wouter";
import LandingHeader from "@/components/landing-header";
import Footer from "@/components/footer";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// Temporary mock data - replace with actual API call later
const posts = Array.from({ length: 10 }, (_, i) => ({
  id: `${i + 1}`,
  title: `Understanding Supplement ${i + 1}`,
  excerpt: "Learn about the science behind supplements and how they can benefit your health journey.",
  thumbnailUrl: `https://picsum.photos/seed/${i + 1}/400/300`,
  publishedAt: new Date().toISOString(),
  slug: `post-${i + 1}`
}));

const POSTS_PER_PAGE = 6;

export default function LearnPage() {
  const page = 1; // TODO: Get from URL params
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  return (
    <Fragment>
      <LandingHeader />
      <main className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8 text-primary">Learn</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={post.thumbnailUrl} 
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/learn/${post.slug}`} className="text-primary hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <time className="text-sm text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </time>
              </div>
            </article>
          ))}
        </div>

        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </main>
      <Footer />
    </Fragment>
  );
}
