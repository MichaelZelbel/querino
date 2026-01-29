import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import PublicPromptDiscovery from "./pages/PublicPromptDiscovery";
import SignUp from "./pages/SignUp";

import PromptCreation from "./pages/PromptCreation";
import PromptRefinement from "./pages/PromptRefinement";
import PromptLibrary from "./pages/PromptLibrary";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Impressum from "./pages/Impressum";
import Auth from "./pages/Auth";
import Library from "./pages/Library";
import PromptDetail from "./pages/PromptDetail";
import PromptNew from "./pages/PromptNew";
import PromptEdit from "./pages/LibraryPromptEdit";
import VersionHistory from "./pages/VersionHistory";
import PromptWizard from "./pages/PromptWizard";
import SkillNew from "./pages/SkillNew";
import SkillDetail from "./pages/SkillDetail";
import SkillEdit from "./pages/SkillEdit";
import WorkflowNew from "./pages/WorkflowNew";
import WorkflowDetail from "./pages/WorkflowDetail";
import WorkflowEdit from "./pages/WorkflowEdit";
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import Collections from "./pages/Collections";
import CollectionNew from "./pages/CollectionNew";
import CollectionDetail from "./pages/CollectionDetail";
import CollectionEdit from "./pages/CollectionEdit";
import TeamSettings from "./pages/TeamSettings";
import Activity from "./pages/Activity";
import TeamActivity from "./pages/TeamActivity";
import UserActivity from "./pages/UserActivity";
import Admin from "./pages/Admin";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/library" element={<Library />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/public-prompt-discovery-copy" element={<PublicPromptDiscovery />} />
            <Route path="/free-user-sign-up-initial-exploration" element={<SignUp />} />
            <Route path="/premium-feature-upgrade" element={<Pricing />} />
            <Route path="/prompt-creation-publishing-premium-free-" element={<PromptCreation />} />
            <Route path="/prompt-refinement-with-ai-tools-premium-" element={<PromptRefinement />} />
            <Route path="/organizing-managing-prompt-library-free-premium-" element={<PromptLibrary />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/impressum" element={<Impressum />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
