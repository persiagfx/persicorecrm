// SEO Metadata generator برای صفحات بلاگ — server-side
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://blog.persicore.ir";
const SITE_NAME = "Persicore Blog";

interface BlogPostMeta {
  title: string; slug: string; excerpt?: string | null;
  coverImage?: string | null; publishedAt?: string | null; updatedAt?: string;
  seoTitle?: string | null; seoDesc?: string | null; seoKeywords?: string | null;
  canonicalUrl?: string | null; noIndex?: boolean; noFollow?: boolean;
  ogTitle?: string | null; ogDesc?: string | null; ogImage?: string | null;
  twitterTitle?: string | null; twitterDesc?: string | null; twitterImage?: string | null;
  twitterCard?: string | null;
  author?: { name: string };
  category?: { name: string; slug: string } | null;
  tags?: string[];
}

export function buildPostMetadata(post: BlogPostMeta): Metadata {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const canonical = post.canonicalUrl || url;

  const title = post.seoTitle || post.title;
  const description = post.seoDesc || post.excerpt || "";
  const image = post.ogImage || post.coverImage || `${SITE_URL}/og-default.jpg`;

  const robots = [
    post.noIndex ? "noindex" : "index",
    post.noFollow ? "nofollow" : "follow",
  ].join(", ");

  return {
    title,
    description,
    keywords: post.seoKeywords ?? undefined,
    robots,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.ogTitle || title,
      description: post.ogDesc || description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(post.publishedAt && { publishedTime: post.publishedAt }),
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
      ...(post.author && { authors: [post.author.name] }),
      ...(post.tags && post.tags.length > 0 && { tags: post.tags }),
    },
    twitter: {
      card: (post.twitterCard as any) || "summary_large_image",
      title: post.twitterTitle || post.ogTitle || title,
      description: post.twitterDesc || post.ogDesc || description,
      images: [post.twitterImage || post.ogImage || image],
    },
  };
}

export function buildJsonLd(post: BlogPostMeta & {
  content: string; readingTime: number; views: number;
  schemaType?: string;
}) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.ogImage || post.coverImage;
  const type = post.schemaType || "BlogPosting";

  const base = {
    "@context": "https://schema.org",
    "@type": type,
    "headline": post.seoTitle || post.title,
    "description": post.seoDesc || post.excerpt,
    "url": post.canonicalUrl || url,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    ...(image && { "image": { "@type": "ImageObject", "url": image, "width": 1200, "height": 630 } }),
    "author": {
      "@type": "Person",
      "name": post.author?.name ?? "Persicore Team",
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Persicore",
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": post.canonicalUrl || url },
    "wordCount": post.content.replace(/<[^>]+>/g, " ").split(/\s+/).length,
    "timeRequired": `PT${post.readingTime}M`,
    ...(post.tags && post.tags.length > 0 && { "keywords": post.tags.join(", ") }),
    ...(post.category && { "articleSection": post.category.name }),
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ReadAction",
      "userInteractionCount": post.views,
    },
  };

  return JSON.stringify(base);
}

export function buildBreadcrumbJsonLd(post: { title: string; slug: string; category?: { name: string; slug: string } | null }) {
  const items = [
    { "@type": "ListItem", "position": 1, "name": "خانه", "item": SITE_URL },
    { "@type": "ListItem", "position": 2, "name": "بلاگ", "item": `${SITE_URL}/blog` },
  ];

  if (post.category) {
    items.push({ "@type": "ListItem", "position": 3, "name": post.category.name, "item": `${SITE_URL}/blog/category/${post.category.slug}` });
    items.push({ "@type": "ListItem", "position": 4, "name": post.title, "item": `${SITE_URL}/blog/${post.slug}` });
  } else {
    items.push({ "@type": "ListItem", "position": 3, "name": post.title, "item": `${SITE_URL}/blog/${post.slug}` });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items });
}
