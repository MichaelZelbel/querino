import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  Workflow,
  Plus,
  Library,
  FolderOpen,
  User,
  Users,
  Settings,
  Github,
  LayoutDashboard,
  Compass,
  Activity,
  CreditCard,
  Globe,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCommandPaletteSearch, ArtefactType } from "@/hooks/useCommandPaletteSearch";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const artefactIcons: Record<ArtefactType, React.ComponentType<{ className?: string }>> = {
  prompt: Sparkles,
  skill: FileText,
  workflow: Workflow,
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { teams, switchWorkspace } = useWorkspace();
  const { artefacts, publicPrompts, isLoading, hasQuery } = useCommandPaletteSearch(query);

  // Reset query when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  // Quick actions
  const quickActions = [
    { label: "New Prompt", icon: Plus, action: () => navigate("/prompts/new"), requiresAuth: true },
    { label: "New Skill", icon: Plus, action: () => navigate("/skills/new"), requiresAuth: true },
    { label: "New Workflow", icon: Plus, action: () => navigate("/workflows/new"), requiresAuth: true },
    { label: "Open My Library", icon: Library, action: () => navigate("/library"), requiresAuth: true },
    { label: "Open My Collections", icon: FolderOpen, action: () => navigate("/collections"), requiresAuth: true },
    { label: "Open My Profile", icon: User, action: () => navigate("/profile/edit"), requiresAuth: true },
    { label: "Open Settings", icon: Settings, action: () => navigate("/settings"), requiresAuth: true },
    { label: "GitHub Sync Settings", icon: Github, action: () => navigate("/settings"), requiresAuth: true },
  ];

  // Navigation commands
  const navigationCommands = [
    { label: "Go to Dashboard", icon: LayoutDashboard, action: () => navigate("/dashboard"), requiresAuth: true },
    { label: "Go to Discover", icon: Compass, action: () => navigate("/discover"), requiresAuth: false },
    { label: "Go to Activity Feed", icon: Activity, action: () => navigate("/activity"), requiresAuth: false },
    
  ];

  // Filter quick actions based on query
  const filteredQuickActions = quickActions.filter((action) => {
    if (action.requiresAuth && !user) return false;
    if (!query.trim()) return true;
    return action.label.toLowerCase().includes(query.toLowerCase());
  });

  const filteredNavigation = navigationCommands.filter((cmd) => {
    if (cmd.requiresAuth && !user) return false;
    if (!query.trim()) return true;
    return cmd.label.toLowerCase().includes(query.toLowerCase());
  });

  // Team switching commands
  const teamCommands = teams
    .filter((team) => {
      if (!query.trim()) return true;
      return team.name.toLowerCase().includes(query.toLowerCase()) || 
             "switch workspace".includes(query.toLowerCase());
    })
    .map((team) => ({
      label: `Switch to ${team.name}`,
      icon: Users,
      action: () => {
        switchWorkspace(team.id);
        navigate("/library");
      },
    }));

  // Should we show public prompts?
  const showPublicPrompts = hasQuery && artefacts.length === 0 && publicPrompts.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Search artefacts, run commands..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Searching..." : "No results found."}
          </CommandEmpty>

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <CommandGroup heading="Quick Actions">
              {filteredQuickActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={() => runCommand(action.action)}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Team Switching */}
          {teamCommands.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Workspaces">
                <CommandItem
                  onSelect={() => runCommand(() => {
                    switchWorkspace("personal");
                    navigate("/library");
                  })}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Switch to Personal Workspace</span>
                </CommandItem>
                {teamCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.label}
                    onSelect={() => runCommand(cmd.action)}
                    className="flex items-center gap-2"
                  >
                    <cmd.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* User Artefacts */}
          {artefacts.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Your Artefacts">
                {artefacts.map((artefact) => {
                  const Icon = artefactIcons[artefact.type];
                  const route = artefact.type === "prompt"
                    ? `/prompts/${artefact.id}`
                    : artefact.type === "skill"
                    ? `/skills/${artefact.id}`
                    : `/workflows/${artefact.id}`;

                  return (
                    <CommandItem
                      key={`${artefact.type}-${artefact.id}`}
                      onSelect={() => runCommand(() => navigate(route))}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="truncate">{artefact.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {artefact.type}
                        </Badge>
                        {artefact.teamName && (
                          <Badge variant="secondary" className="text-xs">
                            {artefact.teamName}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {/* Public Prompts (fallback) */}
          {showPublicPrompts && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Public Prompts">
                {publicPrompts.map((prompt) => (
                  <CommandItem
                    key={prompt.id}
                    onSelect={() => runCommand(() => navigate(`/prompts/${prompt.id}`))}
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{prompt.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Public
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Navigation */}
          {filteredNavigation.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                {filteredNavigation.map((cmd) => (
                  <CommandItem
                    key={cmd.label}
                    onSelect={() => runCommand(cmd.action)}
                    className="flex items-center gap-2"
                  >
                    <cmd.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
