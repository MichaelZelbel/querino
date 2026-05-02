import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

// Eager-loaded: top-level entry pages users hit first.
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded: everything else. Splits the bundle so the initial
// landing/auth experience does not have to download Tiptap, Recharts,
// the blog CMS, the admin panel, or any feature page that the user
// has not navigated to yet.
const Discover = lazy(() => import("./pages/Discover"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const PublicPromptDiscovery = lazy(() => import("./pages/PublicPromptDiscovery"));
const SignUp = lazy(() => import("./pages/SignUp"));
const PromptCreation = lazy(() => import("./pages/PromptCreation"));
const PromptRefinement = lazy(() => import("./pages/PromptRefinement"));
const PromptLibrary = lazy(() => import("./pages/PromptLibrary"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Library = lazy(() => import("./pages/Library"));
const PromptDetail = lazy(() => import("./pages/PromptDetail"));
const PromptNew = lazy(() => import("./pages/PromptNew"));
const PromptEdit = lazy(() => import("./pages/LibraryPromptEdit"));
const VersionHistory = lazy(() => import("./pages/VersionHistory"));
const PromptWizard = lazy(() => import("./pages/PromptWizard"));
const SkillNew = lazy(() => import("./pages/SkillNew"));
const SkillDetail = lazy(() => import("./pages/SkillDetail"));
const SkillEdit = lazy(() => import("./pages/SkillEdit"));
const WorkflowNew = lazy(() => import("./pages/WorkflowNew"));
const WorkflowDetail = lazy(() => import("./pages/WorkflowDetail"));
const WorkflowEdit = lazy(() => import("./pages/WorkflowEdit"));
const PromptKitNew = lazy(() => import("./pages/PromptKitNew"));
const PromptKitDetail = lazy(() => import("./pages/PromptKitDetail"));
const PromptKitEdit = lazy(() => import("./pages/PromptKitEdit"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionNew = lazy(() => import("./pages/CollectionNew"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const CollectionEdit = lazy(() => import("./pages/CollectionEdit"));
const TeamSettings = lazy(() => import("./pages/TeamSettings"));
const Activity = lazy(() => import("./pages/Activity"));
const TeamActivity = lazy(() => import("./pages/TeamActivity"));
const UserActivity = lazy(() => import("./pages/UserActivity"));
const Admin = lazy(() => import("./pages/Admin"));
const Docs = lazy(() => import("./pages/Docs"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const CreateFromMenerio = lazy(() => import("./pages/CreateFromMenerio"));

// Blog Admin (heavy editor — keep lazy)
const BlogAdminDashboard = lazy(() => import("./pages/blog/admin/BlogAdminDashboard"));
const BlogAdminPosts = lazy(() => import("./pages/blog/admin/BlogAdminPosts"));
const BlogAdminPostEditor = lazy(() => import("./pages/blog/admin/BlogAdminPostEditor"));
const BlogAdminCategories = lazy(() => import("./pages/blog/admin/BlogAdminCategories"));
const BlogAdminTags = lazy(() => import("./pages/blog/admin/BlogAdminTags"));
const BlogAdminMedia = lazy(() => import("./pages/blog/admin/BlogAdminMedia"));

// Public Blog
const BlogList = lazy(() => import("./pages/blog/BlogList"));
const BlogPost = lazy(() => import("./pages/blog/BlogPost"));
const BlogCategory = lazy(() => import("./pages/blog/BlogCategory"));
const BlogTag = lazy(() => import("./pages/blog/BlogTag"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid noisy refetches on every tab focus / remount.
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/library" element={<Library />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/public-prompt-discovery-copy" element={<PublicPromptDiscovery />} />
                <Route path="/free-user-sign-up-initial-exploration" element={<SignUp />} />
                <Route path="/premium-feature-upgrade" element={<NotFound />} />
                <Route path="/prompt-creation-publishing-premium-free-" element={<PromptCreation />} />
                <Route path="/prompt-refinement-with-ai-tools-premium-" element={<PromptRefinement />} />
                <Route path="/organizing-managing-prompt-library-free-premium-" element={<PromptLibrary />} />
                <Route path="/pricing" element={<NotFound />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/create-from-menerio" element={<CreateFromMenerio />} />
                <Route path="/prompts/new" element={<PromptNew />} />
                <Route path="/prompts/wizard" element={<PromptWizard />} />
                <Route path="/prompts/:slug" element={<PromptDetail />} />
                <Route path="/prompts/:slug/edit" element={<PromptEdit />} />
                <Route path="/library/:slug/edit" element={<PromptEdit />} />
                <Route path="/library/:slug/versions" element={<VersionHistory />} />
                <Route path="/skills/new" element={<SkillNew />} />
                <Route path="/skills/:slug" element={<SkillDetail />} />
                <Route path="/skills/:slug/edit" element={<SkillEdit />} />
                <Route path="/workflows/new" element={<WorkflowNew />} />
                <Route path="/workflows/:slug" element={<WorkflowDetail />} />
                <Route path="/workflows/:slug/edit" element={<WorkflowEdit />} />
                <Route path="/prompt-kits/new" element={<PromptKitNew />} />
                <Route path="/prompt-kits/:slug" element={<PromptKitDetail />} />
                <Route path="/prompt-kits/:slug/edit" element={<PromptKitEdit />} />
                <Route path="/u/:username" element={<UserProfile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/new" element={<CollectionNew />} />
                <Route path="/collections/:id" element={<CollectionDetail />} />
                <Route path="/collections/:id/edit" element={<CollectionEdit />} />
                <Route path="/team/:id/settings" element={<TeamSettings />} />
                <Route path="/team/:id/activity" element={<TeamActivity />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/u/:username/activity" element={<UserActivity />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/community-guidelines" element={<CommunityGuidelines />} />

                {/* Blog Admin Routes */}
                <Route path="/blog/admin" element={<BlogAdminDashboard />} />
                <Route path="/blog/admin/posts" element={<BlogAdminPosts />} />
                <Route path="/blog/admin/posts/new" element={<BlogAdminPostEditor />} />
                <Route path="/blog/admin/posts/:id/edit" element={<BlogAdminPostEditor />} />
                <Route path="/blog/admin/categories" element={<BlogAdminCategories />} />
                <Route path="/blog/admin/tags" element={<BlogAdminTags />} />
                <Route path="/blog/admin/media" element={<BlogAdminMedia />} />

                {/* Public Blog Routes */}
                <Route path="/blog" element={<BlogList />} />
                <Route path="/blog/category/:slug" element={<BlogCategory />} />
                <Route path="/blog/tag/:slug" element={<BlogTag />} />
                <Route path="/blog/:slug" element={<BlogPost />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieBanner />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
