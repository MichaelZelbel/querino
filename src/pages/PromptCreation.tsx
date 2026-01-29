import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Save, 
   
  Eye, 
  EyeOff, 
  Tag, 
  FileText, 
  Sparkles,
  ArrowLeft,
  Check,
  Globe,
  Lock
} from "lucide-react";
import { categories } from "@/data/mockPrompts";
import { toast } from "sonner";
import heroCreate from "@/assets/hero-create.png";

export default function PromptCreation() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    toast.success("Prompt saved to your library!");
    setIsSaved(true);
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Editor */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-display-md text-foreground mb-2">Create New Prompt</h1>
              <p className="text-muted-foreground">Build and save your AI prompt to your personal library.</p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Give your prompt a descriptive title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe what this prompt does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Prompt Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Prompt Content
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Write your prompt here. Use {{variable}} for placeholders..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use {"{{variable}}"} syntax to create dynamic placeholders
                  </p>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.filter(c => c.id !== "all").map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    />
                    <Button variant="outline" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                          {tag}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visibility Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPublic ? (
                      <Globe className="h-4 w-4 text-success" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{isPublic ? "Public" : "Private"}</p>
                      <p className="text-xs text-muted-foreground">
                        {isPublic ? "Visible to everyone" : "Only you can see this"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                <Separator />

                {/* Save/Publish Buttons */}
                <div className="space-y-3">
                  <Button className="w-full gap-2" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    Save to Library
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {title || content ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">{title || "Untitled Prompt"}</h3>
                    {description && (
                      <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                    {content && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-mono text-muted-foreground line-clamp-4">
                          {content}
                        </p>
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Start typing to see a preview
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-accent/30 border-accent">
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Be specific about the desired output format</li>
                  <li>• Include examples when possible</li>
                  <li>• Use clear, concise language</li>
                  <li>• Add relevant tags for discoverability</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
