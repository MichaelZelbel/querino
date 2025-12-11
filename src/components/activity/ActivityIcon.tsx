import { 
  Plus, 
  Pencil, 
  Save, 
  Globe, 
  EyeOff, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Star, 
  GitBranch, 
  Users, 
  UserPlus, 
  UserMinus, 
  Crown,
  Github,
  Sparkles,
  BookOpen,
  Workflow,
  FolderOpen,
  User,
  LucideIcon
} from "lucide-react";

const actionIcons: Record<string, LucideIcon> = {
  create: Plus,
  update: Pencil,
  autosave: Save,
  publish: Globe,
  unpublish: EyeOff,
  clone: Copy,
  delete: Trash2,
  restore: RotateCcw,
  review: Star,
  version: GitBranch,
  team_create: Users,
  team_add_member: UserPlus,
  team_remove_member: UserMinus,
  team_promote_member: Crown,
  github_sync_triggered: Github,
};

const itemTypeIcons: Record<string, LucideIcon> = {
  prompt: Sparkles,
  skill: BookOpen,
  workflow: Workflow,
  collection: FolderOpen,
  profile: User,
  team: Users,
};

interface ActivityIconProps {
  action: string;
  itemType?: string | null;
  className?: string;
}

export function ActivityIcon({ action, itemType, className = "h-4 w-4" }: ActivityIconProps) {
  const Icon = actionIcons[action] || Pencil;
  return <Icon className={className} />;
}

export function ItemTypeIcon({ itemType, className = "h-4 w-4" }: { itemType: string; className?: string }) {
  const Icon = itemTypeIcons[itemType] || Sparkles;
  return <Icon className={className} />;
}

export function getActionLabel(action: string, itemType?: string | null): string {
  const itemLabel = itemType || "item";
  
  const labels: Record<string, string> = {
    create: `created a ${itemLabel}`,
    update: `updated a ${itemLabel}`,
    autosave: `autosaved a ${itemLabel}`,
    publish: `published a ${itemLabel}`,
    unpublish: `unpublished a ${itemLabel}`,
    clone: `cloned a ${itemLabel}`,
    delete: `deleted a ${itemLabel}`,
    restore: `restored a ${itemLabel}`,
    review: `reviewed a ${itemLabel}`,
    version: `created a new version of a ${itemLabel}`,
    team_create: "created a team",
    team_add_member: "added a team member",
    team_remove_member: "removed a team member",
    team_promote_member: "promoted a team member",
    github_sync_triggered: "triggered GitHub sync",
  };

  return labels[action] || `performed ${action} on a ${itemLabel}`;
}

export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    create: "text-green-500",
    update: "text-blue-500",
    autosave: "text-muted-foreground",
    publish: "text-emerald-500",
    unpublish: "text-yellow-500",
    clone: "text-purple-500",
    delete: "text-red-500",
    restore: "text-cyan-500",
    review: "text-amber-500",
    version: "text-indigo-500",
    team_create: "text-primary",
    team_add_member: "text-green-500",
    team_remove_member: "text-red-500",
    team_promote_member: "text-amber-500",
    github_sync_triggered: "text-muted-foreground",
  };

  return colors[action] || "text-muted-foreground";
}
