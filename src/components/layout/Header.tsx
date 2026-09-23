import { Link, useNavigate, useLocation } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkles,
  Menu,
  X,
  Library,
  Settings,
  LogOut,
  Plus,
  FileText,
  Workflow,
  User,
  Activity,
  Command,
  Shield,
  Wand2,
  Upload,
  Package,
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { WorkspacePicker } from "@/components/workspace/WorkspacePicker";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreditsPill } from "@/components/settings/CreditsPill";
import { useMarkdownImport } from "@/hooks/useMarkdownImport";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Header() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut } = useAuthContext();
  const { isAdmin } = useUserRole();
  const { triggerFileSelect: triggerPromptImport } =
    useMarkdownImport("prompt");

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      // Take first letter of each word for multi-word names (e.g., "Mister Q" -> "MQ")
      return profile.display_name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img src={logoImage} alt="Querino" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Querino
            </span>
          </Link>

          {/* Workspace Picker - Desktop */}
          {user && (
            <div className="hidden lg:block border-l border-border pl-2 ml-2">
              <WorkspacePicker />
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {user && (
            <Button
              asChild
              variant={isActive("/library") ? "secondary" : "ghost"}
              size="sm"
              className={cn(isActive("/library") && "bg-secondary font-medium")}
            >
              <Link to="/library">My Library</Link>
            </Button>
          )}
          <Button
            asChild
            variant={isActive("/discover") ? "secondary" : "ghost"}
            size="sm"
            className={cn(isActive("/discover") && "bg-secondary font-medium")}
          >
            <Link to="/discover">Discover</Link>
          </Button>
          {user && (
            <Button
              asChild
              variant={isActive("/collections") ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                isActive("/collections") && "bg-secondary font-medium",
              )}
            >
              <Link to="/collections">Collections</Link>
            </Button>
          )}
          {user && (
            <Button
              asChild
              variant={isActive("/activity") ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                isActive("/activity") && "bg-secondary font-medium",
              )}
            >
              <Link to="/activity">Activity</Link>
            </Button>
          )}
          {!user && (
            <Button
              asChild
              variant={isActive("/docs") ? "secondary" : "ghost"}
              size="sm"
              className={cn(isActive("/docs") && "bg-secondary font-medium")}
            >
              <Link to="/docs">Docs</Link>
            </Button>
          )}
        </nav>

        {/* Desktop CTA / User Menu */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Command Palette Button */}
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Open command palette"
              >
                <Command className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search and Navigate (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <ThemeToggle />

          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <CreditsPill />

              {/* Create Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/prompts/new"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      New Prompt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/prompts/wizard"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Wand2 className="h-4 w-4" />
                      Kickstart Template
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={triggerPromptImport}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    Import Prompt from .md
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/skills/new"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      New Skill
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/workflows/new"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Workflow className="h-4 w-4" />
                      New Workflow
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/prompt-kits/new"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="h-4 w-4" />
                      New Prompt Kit
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.display_name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/library"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Library className="h-4 w-4" />
                      My Library
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile/edit"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 cursor-pointer text-primary"
                        >
                          <Shield className="h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/blog/admin"
                          className="flex items-center gap-2 cursor-pointer text-primary"
                        >
                          <FileText className="h-4 w-4" />
                          Blog Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link to="/auth?tab=signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {/* Mobile Workspace Picker */}
            {user && (
              <div className="mb-3 pb-3 border-b border-border">
                <p className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Workspace
                </p>
                <WorkspacePicker />
              </div>
            )}

            {user && (
              <Button
                asChild
                variant={isActive("/library") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive("/library") && "font-medium",
                )}
              >
                <Link to="/library" onClick={() => setMobileMenuOpen(false)}>
                  My Library
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant={isActive("/discover") ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive("/discover") && "font-medium",
              )}
            >
              <Link to="/discover" onClick={() => setMobileMenuOpen(false)}>
                Discover
              </Link>
            </Button>
            {user && (
              <Button
                asChild
                variant={isActive("/collections") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive("/collections") && "font-medium",
                )}
              >
                <Link
                  to="/collections"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </Link>
              </Button>
            )}
            {user && (
              <Button
                asChild
                variant={isActive("/activity") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive("/activity") && "font-medium",
                )}
              >
                <Link to="/activity" onClick={() => setMobileMenuOpen(false)}>
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </Link>
              </Button>
            )}
            {!user && (
              <Button
                asChild
                variant={isActive("/docs") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive("/docs") && "font-medium",
                )}
              >
                <Link to="/docs" onClick={() => setMobileMenuOpen(false)}>
                  Docs
                </Link>
              </Button>
            )}

            {/* Mobile Create Section */}
            {user && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Create
                </p>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <Link
                    to="/prompts/new"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles className="h-4 w-4" />
                    New Prompt
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <Link
                    to="/prompts/wizard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Wand2 className="h-4 w-4" />
                    Kickstart Template
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    triggerPromptImport();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Import Prompt from .md
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <Link
                    to="/skills/new"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    New Skill
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <Link
                    to="/workflows/new"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Workflow className="h-4 w-4" />
                    New Workflow
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <Link
                    to="/prompt-kits/new"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    New Prompt Kit
                  </Link>
                </Button>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCommandPaletteOpen(true);
                }}
              >
                <Command className="h-4 w-4" />
                Search and navigate
              </Button>
              {user && (
                <div className="px-3">
                  <CreditsPill />
                </div>
              )}
              <ThemeToggle withLabel />

              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile?.display_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Link
                      to="/profile/edit"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start gap-2 text-primary"
                      >
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Admin
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start gap-2 text-primary"
                      >
                        <Link
                          to="/blog/admin"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <FileText className="h-4 w-4" />
                          Blog Admin
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild variant="default" className="w-full">
                    <Link
                      to="/auth?tab=signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </header>
  );
}
