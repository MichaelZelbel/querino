import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Globe,
  Twitter,
  Github,
  User,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { SaveStateBadge } from "@/components/editors/SaveStateBadge";
import { avatarObjectPath, staleAvatarPaths } from "@/lib/avatar";

export default function EditProfile() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading: authLoading,
    refreshProfile,
  } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");

  type ProfileForm = {
    displayName: string;
    avatarUrl: string;
    bio: string;
    website: string;
    twitter: string;
    github: string;
  };
  // What the database holds, so a picture change (saved at once) can move the
  // clean baseline for the picture alone and leave other edits unsaved.
  const savedFormRef = useRef<ProfileForm | null>(null);

  const { isDirty, savedAt, markSaved, markLoaded } = useUnsavedChanges({
    data: { displayName, avatarUrl, bio, website, twitter, github },
    isSaving: saving,
    onSave: () => handleSave(),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/profile/edit");
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio, website, twitter, github")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;

      // The baseline is passed explicitly: the state of this render is still
      // the empty form, and snapshotting that made every profile dirty on load.
      const loaded: ProfileForm = {
        displayName: data?.display_name || "",
        avatarUrl: data?.avatar_url || "",
        bio: data?.bio || "",
        website: data?.website || "",
        twitter: data?.twitter || "",
        github: data?.github || "",
      };
      if (data) {
        setDisplayName(loaded.displayName);
        setAvatarUrl(loaded.avatarUrl);
        setBio(loaded.bio);
        setWebsite(loaded.website);
        setTwitter(loaded.twitter);
        setGithub(loaded.github);
      }
      savedFormRef.current = loaded;
      markLoaded(loaded);
    } catch (err) {
      console.error("Error loading profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    // Saving mid-upload would store the old avatar URL (Ctrl+S included).
    if (uploading) {
      toast.info("Wait for the avatar upload to finish, then save.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
          twitter: twitter.trim().replace("@", "") || null,
          github: github.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      savedFormRef.current = {
        displayName,
        avatarUrl,
        bio,
        website,
        twitter,
        github,
      };
      markSaved();
      // The header reads the profile from the auth context, which otherwise
      // kept the old name and avatar until a reload.
      await refreshProfile();
      toast.success("Profile updated successfully!");

      // Navigate to public profile
      if (displayName.trim()) {
        navigate(`/u/${encodeURIComponent(displayName.trim())}`);
      } else {
        navigate("/settings");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      // profiles_display_name_unique_ci: display names are unique, ignoring case.
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code?: unknown }).code
          : undefined;
      toast.error(
        code === "23505"
          ? "That display name is taken. Choose another one."
          : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    try {
      const path = avatarObjectPath(user.id, file.name);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // The upload has already replaced the stored file, so the picture is
      // saved here rather than on "Save": until then the header showed the
      // old picture next to the new preview (issue #67), and a reload showed
      // the new file under the old address anyway. The query string makes
      // every browser fetch the new file instead of its cached copy.
      await saveAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      void removeStaleAvatars(path);
      toast.success("Profile picture updated");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
      // The same file chosen again must fire onChange again.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await saveAvatarUrl(null);
      void removeStaleAvatars(null);
      toast.success("Profile picture removed");
    } catch (err) {
      console.error("Error removing avatar:", err);
      toast.error("Failed to remove the profile picture");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Store the picture on the profile now, show it everywhere on the page (the
   * header and its menu read the auth context) and count it as saved, while
   * any other edit on the form stays unsaved.
   */
  async function saveAvatarUrl(url: string | null) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;

    const value = url ?? "";
    setAvatarUrl(value);
    const saved = savedFormRef.current;
    if (saved) {
      savedFormRef.current = { ...saved, avatarUrl: value };
      markSaved(savedFormRef.current);
    }
    await refreshProfile();
  }

  /** Delete the person's stored pictures other than `keepPath`. Best effort:
   * the profile no longer points at them, so a failure only leaves a file. */
  async function removeStaleAvatars(keepPath: string | null) {
    if (!user) return;
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .list(user.id);
      if (error) throw error;
      const stale = staleAvatarPaths(
        user.id,
        (data ?? []).map((o) => o.name),
        keepPath,
      );
      if (stale.length === 0) return;
      const { error: removeError } = await supabase.storage
        .from("avatars")
        .remove(stale);
      if (removeError) throw removeError;
    } catch (err) {
      console.error("Error removing old avatar files:", err);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto max-w-2xl px-4">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <Link
            to="/settings"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>

          <Card>
            <CardHeader>
              <h1 className="flex items-center gap-2 text-xl font-semibold leading-none tracking-tight">
                <User className="h-5 w-5" />
                Edit Profile
              </h1>
              <CardDescription>
                Customize your public profile. This information will be visible
                to everyone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Profile Picture</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        onClick={handleAvatarRemove}
                        disabled={uploading}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove picture
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, or WebP. Max 5MB. A new or removed picture
                    is saved at once.
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This is how others will see you. Your profile URL will be /u/
                  {displayName || "your-name"}
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label>Social Links</Label>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="yourwebsite.com"
                      aria-label="Website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="username"
                      aria-label="X username"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="username"
                      aria-label="GitHub username"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end items-center gap-3 pt-4">
                <SaveStateBadge
                  isDirty={isDirty}
                  isSaving={saving}
                  savedAt={savedAt}
                  className="mr-auto"
                />
                <Button variant="outline" onClick={() => navigate("/settings")}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="gap-2"
                  title="Save (⌘S / Ctrl+S)"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
