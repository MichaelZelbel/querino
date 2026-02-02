import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BlogMedia } from "@/types/blog";
import { toast } from "sonner";

export function useBlogMedia() {
  return useQuery({
    queryKey: ['blog-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogMedia[];
    },
  });
}

export function useUploadBlogMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-media')
        .getPublicUrl(filePath);

      // Get image dimensions if it's an image
      let width: number | null = null;
      let height: number | null = null;

      if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      // Create media record
      const { data: media, error: dbError } = await supabase
        .from('blog_media')
        .insert({
          url: publicUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          width,
          height,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return media;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-media'] });
      toast.success('Media uploaded');
    },
    onError: (error) => {
      toast.error(`Failed to upload media: ${error.message}`);
    },
  });
}

export function useUpdateBlogMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { alt_text?: string } }) => {
      const { data: media, error } = await supabase
        .from('blog_media')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return media;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-media'] });
      toast.success('Media updated');
    },
    onError: (error) => {
      toast.error(`Failed to update media: ${error.message}`);
    },
  });
}

export function useDeleteBlogMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_media')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-media'] });
      toast.success('Media deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete media: ${error.message}`);
    },
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
