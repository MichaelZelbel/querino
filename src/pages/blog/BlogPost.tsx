import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { usePublicPost } from "@/hooks/usePublicBlog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = usePublicPost(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container max-w-4xl mx-auto px-4 py-12">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="aspect-[16/9] w-full rounded-lg mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
            <p className="text-muted-foreground mb-6">
              The post you're looking for doesn't exist or has been unpublished.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const authorName = post.author?.display_name || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const publishedDate = post.published_at
    ? format(new Date(post.published_at), "MMMM d, yyyy")
    : null;
  const ogImage = post.og_image_url || post.featured_image?.url;
  const canonicalUrl = `${window.location.origin}/blog/${post.slug}`;

  return (
    <>
      <SEOHead
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt || undefined}
        ogImage={ogImage || undefined}
        ogType="article"
        canonicalUrl={canonicalUrl}
        publishedTime={post.published_at || undefined}
        author={authorName}
        includeRssFeed
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <article className="container max-w-6xl mx-auto px-4 py-12">
            {/* Back link */}
            <Link
              to="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Main content */}
              <div className="lg:col-span-3">
                {/* Header */}
                <header className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                    {post.title}
                  </h1>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author?.avatar_url || undefined} alt={authorName} />
                        <AvatarFallback>{authorInitial}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{authorName}</span>
                    </div>
                    {publishedDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.published_at || undefined}>{publishedDate}</time>
                      </div>
                    )}
                  </div>

                  {/* Categories and tags */}
                  {((post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-2">
                      {post.categories?.map((cat) => (
                        <Link key={cat.id} to={`/blog/category/${cat.slug}`}>
                          <Badge variant="outline" className="hover:bg-primary/10">
                            {cat.name}
                          </Badge>
                        </Link>
                      ))}
                      {post.tags?.map((tag) => (
                        <Link key={tag.id} to={`/blog/tag/${tag.slug}`}>
                          <Badge variant="secondary" className="hover:bg-primary/10">
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </header>

                {/* Featured image */}
                {post.featured_image?.url && (
                  <figure className="mb-8 rounded-lg overflow-hidden">
                    <img
                      src={post.featured_image.url}
                      alt={post.featured_image.alt_text || post.title}
                      className="w-full h-auto"
                      width={post.featured_image.width || undefined}
                      height={post.featured_image.height || undefined}
                    />
                  </figure>
                )}

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown>{post.content || ""}</ReactMarkdown>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <BlogSidebar />
                </div>
              </div>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}
