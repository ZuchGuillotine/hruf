
import { Fragment } from "react";
import { useRoute } from "wouter";
import LandingHeader from "@/components/landing-header";
import Footer from "@/components/footer";

export default function BlogPostPage() {
  const [, params] = useRoute("/learn/:slug");
  const slug = params?.slug;

  // TODO: Replace with actual API call
  const post = {
    title: "Understanding Supplements",
    content: `
      <p>Supplements play a crucial role in modern health and wellness...</p>
      <h2>The Science Behind Supplements</h2>
      <p>When we talk about supplements, it's important to understand...</p>
    `,
    publishedAt: new Date().toISOString(),
    thumbnailUrl: "https://picsum.photos/seed/1/800/400"
  };

  return (
    <Fragment>
      <LandingHeader />
      <main className="container mx-auto py-12 px-4 max-w-4xl">
        <article className="prose prose-lg mx-auto">
          <img 
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-[400px] object-cover rounded-lg mb-8"
          />
          <h1 className="text-4xl font-bold mb-4 text-primary">{post.title}</h1>
          <time className="text-gray-500 block mb-8">
            {new Date(post.publishedAt).toLocaleDateString()}
          </time>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <Footer />
    </Fragment>
  );
}
