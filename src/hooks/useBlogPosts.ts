import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogPostFormData, BlogPostStatus } from "@/types/blog";
import { toast } from "sonner";

interface FetchPostsOptions {
  status?: BlogPostStatus | "all";
  authorId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useBlogPosts(options: FetchPostsOptions = {}) {
  const {
    status = "all",
    authorId,
    categoryId,
    search,
    limit = 20,
    offset = 0,
  } = options;

  return useQuery({
    queryKey: [
      "blog-posts",
      status,
      authorId,
      categoryId,
      search,
      limit,
      offset,
    ],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(
          `
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text)
        `,
        )
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (authorId) {
        query = query.eq("author_id", authorId);
      }

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      // The category filter has to reach the database BEFORE the page is cut,
      // the way usePublicBlog does it. Filtering the page in JS afterwards
      // returned an empty page for any category whose posts sat on another
      // page.
      if (categoryId) {
        const { data: postCategories, error: categoryError } = await supabase
          .from("blog_post_categories")
          .select("post_id")
          .eq("category_id", categoryId);
        if (categoryError) throw categoryError;

        const postIds = postCategories?.map((pc) => pc.post_id) || [];
        if (postIds.length === 0) return [] as BlogPost[];
        query = query.in("id", postIds);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);
      if (error) throw error;

      return data as BlogPost[];
    },
  });
}

export function useBlogPost(slugOrId: string) {
  return useQuery({
    queryKey: ["blog-post", slugOrId],
    queryFn: async () => {
      // Try by slug first, then by ID
      let query = supabase.from("blog_posts").select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, display_name, avatar_url),
          featured_image:blog_media!blog_posts_featured_image_id_fkey(id, url, alt_text)
        `);

      // Check if it looks like a UUID
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          slugOrId,
        );

      if (isUUID) {
        query = query.eq("id", slugOrId);
      } else {
        query = query.eq("slug", slugOrId);
      }

      // A missing id is the normal not-found path, not an error. single()
      // threw on zero rows and the editor rendered an empty form with Publish
      // enabled.
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Fetch categories and tags
      const [categoriesResult, tagsResult] = await Promise.all([
        supabase
          .from("blog_post_categories")
          .select("category_id, blog_categories(*)")
          .eq("post_id", data.id),
        supabase
          .from("blog_post_tags")
          .select("tag_id, blog_tags(*)")
          .eq("post_id", data.id),
      ]);

      return {
        ...data,
        categories:
          categoriesResult.data?.map((pc) => pc.blog_categories) || [],
        tags: tagsResult.data?.map((pt) => pt.blog_tags) || [],
      } as BlogPost | null;
    },
    enabled: !!slugOrId,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BlogPostFormData>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { category_ids, tag_ids, ...postData } = data;

      // Generate slug if not provided
      const title = postData.title || "Untitled";
      const slug =
        postData.slug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const { data: post, error } = await supabase
        .from("blog_posts")
        .insert({
          title,
          slug,
          content: postData.content || null,
          excerpt: postData.excerpt || null,
          status: postData.status || "draft",
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

      // Add categories and tags. The post itself exists at this point, so a
      // failed link is reported rather than failing the whole create.
      if (category_ids?.length) {
        const { error: categoryError } = await supabase
          .from("blog_post_categories")
          .insert(
            category_ids.map((id) => ({ post_id: post.id, category_id: id })),
          );
        if (categoryError) {
          toast.error(
            `Post created, but its categories were not saved: ${categoryError.message}`,
          );
        }
      }

      if (tag_ids?.length) {
        const { error: tagError } = await supabase
          .from("blog_post_tags")
          .insert(tag_ids.map((id) => ({ post_id: post.id, tag_id: id })));
        if (tagError) {
          toast.error(
            `Post created, but its tags were not saved: ${tagError.message}`,
          );
        }
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post created");
    },
    onError: (error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });
}

/**
 * Saves of one post run one after another. The category and tag links are
 * rewritten as "delete all, insert the new set"; two saves overlapping (the
 * 3 s autosave and a click on Publish) interleaved those steps and could
 * leave a post with duplicate or missing links.
 */
const postSaveQueue = new Map<string, Promise<unknown>>();

function runInPostQueue<T>(postId: string, task: () => Promise<T>): Promise<T> {
  const previous = postSaveQueue.get(postId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  postSaveQueue.set(postId, next);
  void next
    .catch(() => undefined)
    .finally(() => {
      if (postSaveQueue.get(postId) === next) postSaveQueue.delete(postId);
    });
  return next;
}

async function relinkCategories(postId: string, categoryIds: string[]) {
  const { error: deleteError } = await supabase
    .from("blog_post_categories")
    .delete()
    .eq("post_id", postId);
  if (deleteError) {
    throw new Error(`Could not update categories: ${deleteError.message}`);
  }
  if (!categoryIds.length) return;
  const { error: insertError } = await supabase
    .from("blog_post_categories")
    .insert(
      categoryIds.map((catId) => ({ post_id: postId, category_id: catId })),
    );
  if (insertError) {
    throw new Error(`Could not update categories: ${insertError.message}`);
  }
}

async function relinkTags(postId: string, tagIds: string[]) {
  const { error: deleteError } = await supabase
    .from("blog_post_tags")
    .delete()
    .eq("post_id", postId);
  if (deleteError) {
    throw new Error(`Could not update tags: ${deleteError.message}`);
  }
  if (!tagIds.length) return;
  const { error: insertError } = await supabase
    .from("blog_post_tags")
    .insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
  if (insertError) {
    throw new Error(`Could not update tags: ${insertError.message}`);
  }
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BlogPostFormData>;
      /** Autosave: no success toast. Errors are still shown. */
      silent?: boolean;
    }) =>
      runInPostQueue(id, async () => {
        const { category_ids, tag_ids, ...postData } = data;

        const { data: post, error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (category_ids !== undefined) {
          await relinkCategories(id, category_ids);
        }
        if (tag_ids !== undefined) {
          await relinkTags(id, tag_ids);
        }

        return post;
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", variables.id] });
      if (!variables.silent) toast.success("Post updated");
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
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}
