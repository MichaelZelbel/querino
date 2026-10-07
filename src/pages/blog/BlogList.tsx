import { useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { parseBlogPage } from "@/components/blog/blogPage";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { usePublicPosts } from "@/hooks/usePublicBlog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { siteOrigin } from "@/config/site";

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseBlogPage(searchParams.get("page"));

  const { data, isLoading } = usePublicPosts({ page });

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 py-12">
            <header className="mb-10">
              <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
              <p className="text-muted-foreground">
                Articles about AI, prompts, and productivity
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Main content */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[16/9] w-full rounded-lg" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : data?.posts && data.posts.length > 0 ? (
                  <>
                    <div className="grid gap-6 md:grid-cols-2">
                      {data.posts.map((post) => (
                        <BlogPostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </>
                ) : data && data.totalPages > 0 ? (
                  // A page past the last one (an old link, a hand-edited address).
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      There is no page {page}
                    </h2>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(1)}
                    >
                      Go to the first page
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      No posts yet
                    </h2>
                    <p className="text-muted-foreground">
                      Check back soon for new content.
                    </p>
                  </div>
                )}
                {data && data.totalPages > 1 && (
                  <div className="mt-10">
                    <BlogPagination
                      currentPage={Math.min(page, data.totalPages)}
                      totalPages={data.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <BlogSidebar />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
