import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BlogAdminLayout } from "@/components/blog/admin/BlogAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogTags } from "@/hooks/useBlogTags";
import { useAutosave } from "@/hooks/useAutosave";
import { AutosaveIndicator } from "@/components/editors/AutosaveIndicator";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Eye, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { BlogPostFormData, BlogPostStatus } from "@/types/blog";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function BlogAdminPostEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { data: post, isLoading: postLoading } = useBlogPost(id || '');
  const { data: categories } = useBlogCategories();
  const { data: tags } = useBlogTags();
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    published_at: null,
    featured_image_id: null,
    seo_title: '',
    seo_description: '',
    og_image_url: '',
    category_ids: [],
    tag_ids: [],
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  // Load post data
  useEffect(() => {
    if (post && !isNew) {
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content || '',
        excerpt: post.excerpt || '',
        status: post.status as BlogPostStatus,
        published_at: post.published_at,
        featured_image_id: post.featured_image_id,
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        og_image_url: post.og_image_url || '',
        category_ids: post.categories?.map(c => c.id) || [],
        tag_ids: post.tags?.map(t => t.id) || [],
      });
      setSlugManuallyEdited(true);
    }
  }, [post, isNew]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && formData.title) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, slugManuallyEdited]);

  // Autosave for drafts
  const autosaveData = useMemo(() => formData, [formData]);
  
  const { status: autosaveStatus, resetLastSaved } = useAutosave({
    data: autosaveData,
    onSave: async (data) => {
      if (!isNew && post && data.status === 'draft') {
        await updateMutation.mutateAsync({ id: post.id, data });
      }
    },
    delay: 3000,
    enabled: !isNew && formData.status === 'draft',
  });

  // Initialize autosave with loaded data
  useEffect(() => {
    if (post && !isNew) {
      resetLastSaved(autosaveData);
    }
  }, [post, isNew]);

  const handleSave = async (newStatus?: BlogPostStatus) => {
    const dataToSave = {
      ...formData,
      status: newStatus || formData.status,
      published_at: newStatus === 'published' ? new Date().toISOString() : formData.published_at,
    };

    if (isNew) {
      const result = await createMutation.mutateAsync(dataToSave);
      if (result) {
        navigate(`/blog/admin/posts/${result.id}/edit`);
      }
    } else if (id) {
      await updateMutation.mutateAsync({ id, data: dataToSave });
    }
  };

  const updateField = <K extends keyof BlogPostFormData>(key: K, value: BlogPostFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (catId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(catId)
        ? prev.category_ids.filter(id => id !== catId)
        : [...prev.category_ids, catId],
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  if (postLoading && !isNew) {
    return (
      <BlogAdminLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </BlogAdminLayout>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <BlogAdminLayout
      title={isNew ? 'New Post' : 'Edit Post'}
      actions={
        <div className="flex items-center gap-3">
          {!isNew && formData.status === 'draft' && (
            <AutosaveIndicator status={autosaveStatus} />
          )}
          <Button variant="outline" onClick={() => navigate('/blog/admin/posts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {formData.status !== 'published' && (
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          )}
          <Button onClick={() => handleSave('published')} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {formData.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter post title..."
              className="text-lg"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
              <span className="flex items-center text-sm text-muted-foreground">/blog/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  updateField('slug', e.target.value);
                }}
                placeholder="post-slug"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}>
                <TabsList className="h-8">
                  <TabsTrigger value="edit" className="text-xs px-3">Edit</TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs px-3">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {previewTab === 'edit' ? (
              <Textarea
                value={formData.content}
                onChange={(e) => updateField('content', e.target.value)}
                placeholder="Write your content in Markdown..."
                className="min-h-[400px] font-mono text-sm"
              />
            ) : (
              <div className="min-h-[400px] p-4 border border-input rounded-md bg-background prose prose-sm dark:prose-invert max-w-none">
                {formData.content ? (
                  <ReactMarkdown>{formData.content}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet...</p>
                )}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
              placeholder="Brief summary of the post..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField('status', v as BlogPostStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Publish Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.published_at?.slice(0, 16) || ''}
                    onChange={(e) => updateField('published_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={formData.category_ids.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">
                        {cat.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No categories yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        formData.tag_ids.includes(tag.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => updateField('seo_title', e.target.value)}
                  placeholder={formData.title || 'SEO title...'}
                />
                <p className="text-xs text-muted-foreground">
                  {(formData.seo_title || formData.title).length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => updateField('seo_description', e.target.value)}
                  placeholder="Brief description for search engines..."
                  className="min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image_url">OG Image URL</Label>
                <Input
                  id="og_image_url"
                  value={formData.og_image_url}
                  onChange={(e) => updateField('og_image_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BlogAdminLayout>
  );
}
