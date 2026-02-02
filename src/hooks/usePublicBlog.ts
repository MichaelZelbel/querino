import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogCategory, BlogTag } from "@/types/blog";

const POSTS_PER_PAGE = 10;

interface UsePublicPostsOptions {
  page?: number;
  categorySlug?: string;
  tagSlug?: string;
}

export function usePublicPosts({ page = 1, categorySlug, tagSlug }: UsePublicPostsOptions = {}) {
  return useQuery({
    queryKey: ['public-blog-posts', page, categorySlug, tagSlug],
    queryFn: async () => {
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          status,
          published_at,
          author_id,
          featured_image_id,
          created_at,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text)
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Filter by category if provided
      if (categorySlug) {
        const { data: category } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();

        if (category) {
          const { data: postIds } = await supabase
            .from('blog_post_categories')
            .select('post_id')
            .eq('category_id', category.id);

          const ids = postIds?.map(p => p.post_id) || [];
          if (ids.length > 0) {
            query = query.in('id', ids);
          } else {
            return { posts: [], totalPages: 0, currentPage: page };
          }
        }
      }

      // Filter by tag if provided
      if (tagSlug) {
        const { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', tagSlug)
          .maybeSingle();

        if (tag) {
          const { data: postIds } = await supabase
            .from('blog_post_tags')
            .select('post_id')
            .eq('tag_id', tag.id);

          const ids = postIds?.map(p => p.post_id) || [];
          if (ids.length > 0) {
            query = query.in('id', ids);
          } else {
            return { posts: [], totalPages: 0, currentPage: page };
          }
        }
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        posts: (data || []) as unknown as BlogPost[],
        totalPages: Math.ceil((count || 0) / POSTS_PER_PAGE),
        currentPage: page,
        totalCount: count || 0,
      };
    },
  });
}

export function usePublicPost(slug: string) {
  return useQuery({
    queryKey: ['public-blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text, width, height)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch categories
      const { data: categoryLinks } = await supabase
        .from('blog_post_categories')
        .select('category_id, category:blog_categories(*)')
        .eq('post_id', data.id);

      // Fetch tags
      const { data: tagLinks } = await supabase
        .from('blog_post_tags')
        .select('tag_id, tag:blog_tags(*)')
        .eq('post_id', data.id);

      return {
        ...data,
        categories: categoryLinks?.map(l => l.category) || [],
        tags: tagLinks?.map(l => l.tag) || [],
      } as BlogPost;
    },
    enabled: !!slug,
  });
}

export function usePublicCategory(slug: string) {
  return useQuery({
    queryKey: ['public-blog-category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as BlogCategory | null;
    },
    enabled: !!slug,
  });
}

export function usePublicTag(slug: string) {
  return useQuery({
    queryKey: ['public-blog-tag', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as BlogTag | null;
    },
    enabled: !!slug,
  });
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ['public-blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogCategory[];
    },
  });
}

export function usePublicTags() {
  return useQuery({
    queryKey: ['public-blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogTag[];
    },
  });
}
