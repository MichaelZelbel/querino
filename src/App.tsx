import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookieBanner } from "@/components/CookieBanner";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import PublicPromptDiscovery from "./pages/PublicPromptDiscovery";
import SignUp from "./pages/SignUp";
import PremiumUpgrade from "./pages/PremiumUpgrade";
import PromptCreation from "./pages/PromptCreation";
import PromptRefinement from "./pages/PromptRefinement";
import PromptLibrary from "./pages/PromptLibrary";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/public-prompt-discovery-copy" element={<PublicPromptDiscovery />} />
          <Route path="/free-user-sign-up-initial-exploration" element={<SignUp />} />
          <Route path="/premium-feature-upgrade" element={<PremiumUpgrade />} />
          <Route path="/prompt-creation-publishing-premium-free-" element={<PromptCreation />} />
          <Route path="/prompt-refinement-with-ai-tools-premium-" element={<PromptRefinement />} />
          <Route path="/organizing-managing-prompt-library-free-premium-" element={<PromptLibrary />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
