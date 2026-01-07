import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  GitCompare,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import type { PromptVersion } from "./VersionHistoryPanel";

interface VersionDetailViewProps {
  version: PromptVersion;
  onBack: () => void;
  onRestore: () => void;
  onCompare: () => void;
}

export function VersionDetailView({
  version,
  onBack,
  onRestore,
  onCompare,
}: VersionDetailViewProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header with back button */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="shrink-0">
            v{version.version_number}
          </Badge>
          <span className="text-sm font-medium text-foreground truncate">
            {version.title}
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(version.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>

          {version.change_notes && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Change notes:</span>{" "}
                {version.change_notes}
              </p>
            </div>
          )}

          {version.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </h4>
              <p className="text-sm text-foreground">{version.description}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prompt Content
            </h4>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                {version.content}
              </pre>
            </div>
          </div>

          {version.tags && version.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {version.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Footer */}
      <div className="flex items-center gap-2 p-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onCompare}
          className="gap-2 flex-1"
        >
          <GitCompare className="h-4 w-4" />
          Compare with Current
        </Button>
        <Button
          onClick={onRestore}
          className="gap-2 flex-1"
        >
          <RotateCcw className="h-4 w-4" />
          Restore
        </Button>
      </div>
    </div>
  );
}
