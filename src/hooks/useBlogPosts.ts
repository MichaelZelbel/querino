import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogPostFormData, BlogPostStatus } from "@/types/blog";
import { toast } from "sonner";

interface FetchPostsOptions {
  status?: BlogPostStatus | 'all';
  authorId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useBlogPosts(options: FetchPostsOptions = {}) {
  const { status = 'all', authorId, categoryId, search, limit = 20, offset = 0 } = options;

  return useQuery({
    queryKey: ['blog-posts', status, authorId, categoryId, search, limit, offset],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If filtering by category, we need to do a separate query
      if (categoryId && data) {
        const { data: postCategories } = await supabase
          .from('blog_post_categories')
          .select('post_id')
          .eq('category_id', categoryId);
        
        const postIds = postCategories?.map(pc => pc.post_id) || [];
        return data.filter(post => postIds.includes(post.id)) as BlogPost[];
      }

      return data as BlogPost[];
    },
  });
}

export function useBlogPost(slugOrId: string) {
  return useQuery({
    queryKey: ['blog-post', slugOrId],
    queryFn: async () => {
      // Try by slug first, then by ID
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text)
        `);

      // Check if it looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      
      if (isUUID) {
        query = query.eq('id', slugOrId);
      } else {
        query = query.eq('slug', slugOrId);
      }

      const { data, error } = await query.single();
      if (error) throw error;

      // Fetch categories and tags
      const [categoriesResult, tagsResult] = await Promise.all([
        supabase
          .from('blog_post_categories')
          .select('category_id, blog_categories(*)')
          .eq('post_id', data.id),
        supabase
          .from('blog_post_tags')
          .select('tag_id, blog_tags(*)')
          .eq('post_id', data.id),
      ]);

      return {
        ...data,
        categories: categoriesResult.data?.map(pc => pc.blog_categories) || [],
        tags: tagsResult.data?.map(pt => pt.blog_tags) || [],
      } as BlogPost;
    },
    enabled: !!slugOrId,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BlogPostFormData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { category_ids, tag_ids, ...postData } = data;

      // Generate slug if not provided
      const title = postData.title || 'Untitled';
      const slug = postData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          content: postData.content || null,
          excerpt: postData.excerpt || null,
          status: postData.status || 'draft',
          published_at: postData.published_at || null,
          featured_image_id: postData.featured_image_id || null,
          seo_title: postData.seo_title || null,
          seo_description: postData.seo_description || null,
          og_image_url: postData.og_image_url || null,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add categories and tags
      if (category_ids?.length) {
        await supabase.from('blog_post_categories').insert(
          category_ids.map(id => ({ post_id: post.id, category_id: id }))
        );
      }

      if (tag_ids?.length) {
        await supabase.from('blog_post_tags').insert(
          tag_ids.map(id => ({ post_id: post.id, tag_id: id }))
        );
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post created');
    },
    onError: (error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BlogPostFormData> }) => {
      const { category_ids, tag_ids, ...postData } = data;

      const { data: post, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update categories
      if (category_ids !== undefined) {
        await supabase.from('blog_post_categories').delete().eq('post_id', id);
        if (category_ids.length) {
          await supabase.from('blog_post_categories').insert(
            category_ids.map(catId => ({ post_id: id, category_id: catId }))
          );
        }
      }

      // Update tags
      if (tag_ids !== undefined) {
        await supabase.from('blog_post_tags').delete().eq('post_id', id);
        if (tag_ids.length) {
          await supabase.from('blog_post_tags').insert(
            tag_ids.map(tagId => ({ post_id: id, tag_id: tagId }))
          );
        }
      }

      return post;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', variables.id] });
      toast.success('Post updated');
    },
    onError: (error) => {
      toast.error(`Failed to update post: ${error.message}`);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}
