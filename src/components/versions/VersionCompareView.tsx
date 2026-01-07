import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Minus,
} from "lucide-react";
import type { PromptVersion } from "./VersionHistoryPanel";

interface CurrentPromptData {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[] | null;
}

interface VersionCompareViewProps {
  version: PromptVersion;
  currentPrompt: CurrentPromptData;
  onBack: () => void;
  onRestore: () => void;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
}

function computeLineDiff(original: string, current: string): DiffLine[] {
  const originalLines = original.split("\n");
  const currentLines = current.split("\n");
  const result: DiffLine[] = [];
  
  const maxLength = Math.max(originalLines.length, currentLines.length);
  
  for (let i = 0; i < maxLength; i++) {
    const origLine = originalLines[i];
    const currLine = currentLines[i];
    
    if (origLine === undefined && currLine !== undefined) {
      result.push({ type: "added", content: currLine });
    } else if (currLine === undefined && origLine !== undefined) {
      result.push({ type: "removed", content: origLine });
    } else if (origLine === currLine) {
      result.push({ type: "unchanged", content: origLine });
    } else {
      result.push({ type: "removed", content: origLine });
      result.push({ type: "added", content: currLine });
    }
  }
  
  return result;
}

function MetadataCompare({
  label,
  versionValue,
  currentValue,
}: {
  label: string;
  versionValue: string | null;
  currentValue: string | null;
}) {
  const changed = versionValue !== currentValue;
  
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-24 shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {changed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-muted shrink-0">
                v{label === "Title" ? "" : ""}Version
              </Badge>
              <span className="text-sm text-foreground truncate">
                {versionValue || "(empty)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs shrink-0">
                Current
              </Badge>
              <span className="text-sm text-foreground truncate">
                {currentValue || "(empty)"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-500" />
            <span className="text-sm text-muted-foreground">Unchanged</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TagsCompare({
  versionTags,
  currentTags,
}: {
  versionTags: string[] | null;
  currentTags: string[] | null;
}) {
  const vTags = versionTags || [];
  const cTags = currentTags || [];
  const changed = JSON.stringify(vTags.sort()) !== JSON.stringify([...cTags].sort());
  
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-24 shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Tags
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {changed ? (
          <div className="space-y-2">
            <div>
              <Badge variant="outline" className="text-xs bg-muted mb-1">Version</Badge>
              <div className="flex flex-wrap gap-1 mt-1">
                {vTags.length > 0 ? (
                  vTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
            <div>
              <Badge variant="outline" className="text-xs mb-1">Current</Badge>
              <div className="flex flex-wrap gap-1 mt-1">
                {cTags.length > 0 ? (
                  cTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-500" />
            <span className="text-sm text-muted-foreground">Unchanged</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function VersionCompareView({
  version,
  currentPrompt,
  onBack,
  onRestore,
}: VersionCompareViewProps) {
  const contentDiff = computeLineDiff(version.content, currentPrompt.content);
  const hasContentChanges = version.content !== currentPrompt.content;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header with back button */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground">
            Compare v{version.version_number} with Current
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Metadata Comparison */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Metadata Changes
            </h4>
            <div className="rounded-lg border border-border divide-y divide-border">
              <div className="px-3">
                <MetadataCompare
                  label="Title"
                  versionValue={version.title}
                  currentValue={currentPrompt.title}
                />
              </div>
              <div className="px-3">
                <MetadataCompare
                  label="Description"
                  versionValue={version.description}
                  currentValue={currentPrompt.description}
                />
              </div>
              <div className="px-3">
                <TagsCompare
                  versionTags={version.tags}
                  currentTags={currentPrompt.tags}
                />
              </div>
            </div>
          </div>

          {/* Content Diff */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Content Changes
            </h4>
            
            {!hasContentChanges ? (
              <div className="rounded-lg border border-border p-4 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Content is identical</span>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-2 border-b border-border bg-muted">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border">
                    Version v{version.version_number}
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Current
                  </div>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  <pre className="text-xs font-mono">
                    {contentDiff.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex min-h-[20px] ${
                          line.type === "added"
                            ? "bg-green-100 dark:bg-green-950/50"
                            : line.type === "removed"
                            ? "bg-red-100 dark:bg-red-950/50"
                            : ""
                        }`}
                      >
                        <span className="w-6 px-1 text-center text-muted-foreground select-none border-r border-border flex-shrink-0">
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                        </span>
                        <span
                          className={`flex-1 px-2 whitespace-pre-wrap break-all ${
                            line.type === "added"
                              ? "text-green-700 dark:text-green-300"
                              : line.type === "removed"
                              ? "text-red-700 dark:text-red-300"
                              : "text-foreground"
                          }`}
                        >
                          {line.content}
                        </span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Action Footer */}
      <div className="flex items-center gap-2 p-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back to List
        </Button>
        <Button
          onClick={onRestore}
          className="gap-2 flex-1"
        >
          <RotateCcw className="h-4 w-4" />
          Restore v{version.version_number}
        </Button>
      </div>
    </div>
  );
}
