export type BlogPostStatus = 'draft' | 'published' | 'scheduled';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  author_id: string | null;
  featured_image_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  featured_image?: BlogMedia | null;
  categories?: BlogCategory[];
  tags?: BlogTag[];
}

export interface BlogPostRevision {
  id: string;
  post_id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  revision_number: number;
  created_at: string;
  created_by: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  post_count?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  // Computed
  post_count?: number;
}

export interface BlogMedia {
  id: string;
  url: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: BlogPostStatus;
  published_at: string | null;
  featured_image_id: string | null;
  seo_title: string;
  seo_description: string;
  og_image_url: string;
  category_ids: string[];
  tag_ids: string[];
}
