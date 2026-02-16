import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonicalUrl?: string;
  publishedTime?: string;
  author?: string;
  noIndex?: boolean;
  includeRssFeed?: boolean;
}

export function SEOHead({
  title,
  description,
  ogImage,
  ogType = "website",
  canonicalUrl,
  publishedTime,
  author,
  noIndex = false,
  includeRssFeed = false,
}: SEOHeadProps) {
  const siteName = "Querino";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const defaultDescription = "Discover and share AI prompts, skills, and workflows.";
  const finalDescription = description || defaultDescription;
  const rssUrl = `${window.location.origin}/api/rss.xml`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Basic meta
    setMeta("description", finalDescription);
    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    }

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", finalDescription, true);
    setMeta("og:type", ogType, true);
    setMeta("og:site_name", siteName, true);
    if (ogImage) {
      setMeta("og:image", ogImage, true);
    }
    if (canonicalUrl) {
      setMeta("og:url", canonicalUrl, true);
    }

    // Twitter Card
    setMeta("twitter:card", ogImage ? "summary_large_image" : "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", finalDescription);
    if (ogImage) {
      setMeta("twitter:image", ogImage);
    }

    // Article-specific meta
    if (ogType === "article") {
      if (publishedTime) {
        setMeta("article:published_time", publishedTime, true);
      }
      if (author) {
        setMeta("article:author", author, true);
      }
    }

    // Canonical URL - always set, default to current path (no query params)
    const finalCanonical = canonicalUrl || (window.location.origin + window.location.pathname);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", finalCanonical);

    // RSS Feed link
    let rssLink = document.querySelector('link[type="application/rss+xml"]') as HTMLLinkElement;
    if (includeRssFeed) {
      if (!rssLink) {
        rssLink = document.createElement("link");
        rssLink.setAttribute("rel", "alternate");
        rssLink.setAttribute("type", "application/rss+xml");
        rssLink.setAttribute("title", `${siteName} Blog RSS Feed`);
        document.head.appendChild(rssLink);
      }
      rssLink.setAttribute("href", rssUrl);
    } else if (rssLink) {
      rssLink.remove();
    }

    // Cleanup function
    return () => {
      // Reset title on unmount if needed
    };
  }, [fullTitle, finalDescription, ogImage, ogType, canonicalUrl, publishedTime, author, noIndex, includeRssFeed, rssUrl]);

  return null;
}
