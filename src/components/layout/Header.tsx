import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Menu, X, Library, Settings, LogOut, Plus, FileText, Workflow, User, Activity } from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { WorkspacePicker } from "@/components/workspace/WorkspacePicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut } = useAuthContext();

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
      return profile.display_name.slice(0, 2).toUpperCase();
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
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Querino</span>
          </Link>
          
          {/* Workspace Picker - Desktop */}
          {user && (
            <div className="hidden md:block border-l border-border pl-2 ml-2">
              <WorkspacePicker />
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {user && (
            <Link to="/library">
              <Button 
                variant={isActive("/library") ? "secondary" : "ghost"} 
                size="sm"
                className={cn(isActive("/library") && "bg-secondary font-medium")}
              >
                My Library
              </Button>
            </Link>
          )}
          <Link to="/discover">
            <Button 
              variant={isActive("/discover") ? "secondary" : "ghost"} 
              size="sm"
              className={cn(isActive("/discover") && "bg-secondary font-medium")}
            >
              Discover
            </Button>
          </Link>
          {user && (
            <Link to="/collections">
              <Button 
                variant={isActive("/collections") ? "secondary" : "ghost"} 
                size="sm"
                className={cn(isActive("/collections") && "bg-secondary font-medium")}
              >
                Collections
              </Button>
            </Link>
          )}
          <Link to="/activity">
            <Button 
              variant={isActive("/activity") ? "secondary" : "ghost"} 
              size="sm"
              className={cn(isActive("/activity") && "bg-secondary font-medium")}
            >
              Activity
            </Button>
          </Link>
          {!user && (
            <>
              <a href="/#features">
                <Button variant="ghost" size="sm">
                  Features
                </Button>
              </a>
              <Link to="/pricing">
                <Button 
                  variant={isActive("/pricing") ? "secondary" : "ghost"} 
                  size="sm"
                  className={cn(isActive("/pricing") && "bg-secondary font-medium")}
                >
                  Pricing
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Desktop CTA / User Menu */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              {/* Create Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/prompts/new" className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="h-4 w-4" />
                      New Prompt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/skills/new" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      New Skill
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/workflows/new" className="flex items-center gap-2 cursor-pointer">
                      <Workflow className="h-4 w-4" />
                      New Workflow
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile?.display_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/library" className="flex items-center gap-2 cursor-pointer">
                      <Library className="h-4 w-4" />
                      My Library
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="default" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {/* Mobile Workspace Picker */}
            {user && (
              <div className="mb-3 pb-3 border-b border-border">
                <p className="px-3 py-2 text-sm font-medium text-muted-foreground">Workspace</p>
                <WorkspacePicker />
              </div>
            )}
            
            {user && (
              <Link to="/library" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive("/library") ? "secondary" : "ghost"} 
                  className={cn("w-full justify-start", isActive("/library") && "font-medium")}
                >
                  My Library
                </Button>
              </Link>
            )}
            <Link to="/discover" onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/discover") ? "secondary" : "ghost"} 
                className={cn("w-full justify-start", isActive("/discover") && "font-medium")}
              >
                Discover
              </Button>
            </Link>
            {user && (
              <Link to="/collections" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive("/collections") ? "secondary" : "ghost"} 
                  className={cn("w-full justify-start", isActive("/collections") && "font-medium")}
                >
                  Collections
                </Button>
              </Link>
            )}
            <Link to="/activity" onClick={() => setMobileMenuOpen(false)}>
              <Button 
                variant={isActive("/activity") ? "secondary" : "ghost"} 
                className={cn("w-full justify-start", isActive("/activity") && "font-medium")}
              >
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </Button>
            </Link>
            {!user && (
              <>
                <a href="/#features" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Features
                  </Button>
                </a>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant={isActive("/pricing") ? "secondary" : "ghost"} 
                    className={cn("w-full justify-start", isActive("/pricing") && "font-medium")}
                  >
                    Pricing
                  </Button>
                </Link>
              </>
            )}
            
            {/* Mobile Create Section */}
            {user && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="px-3 py-2 text-sm font-medium text-muted-foreground">Create</p>
                <Link to="/prompts/new" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Sparkles className="h-4 w-4" />
                    New Prompt
                  </Button>
                </Link>
                <Link to="/skills/new" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    New Skill
                  </Button>
                </Link>
                <Link to="/workflows/new" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Workflow className="h-4 w-4" />
                    New Workflow
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
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
                      <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/profile/edit" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      Account
                    </Button>
                  </Link>
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
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
