import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompare, Save } from "lucide-react";

interface DiffViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  original: string;
  current: string;
  onCreateVersion?: () => void;
  isCreatingVersion?: boolean;
  showVersionButton?: boolean;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: number;
}

function computeDiff(original: string, current: string): { left: DiffLine[]; right: DiffLine[] } {
  const originalLines = original.split("\n");
  const currentLines = current.split("\n");
  
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  
  // Simple line-by-line diff
  const maxLength = Math.max(originalLines.length, currentLines.length);
  
  let leftLineNum = 1;
  let rightLineNum = 1;
  
  for (let i = 0; i < maxLength; i++) {
    const origLine = originalLines[i];
    const currLine = currentLines[i];
    
    if (origLine === undefined && currLine !== undefined) {
      // Added line
      left.push({ type: "unchanged", content: "", lineNumber: 0 });
      right.push({ type: "added", content: currLine, lineNumber: rightLineNum++ });
    } else if (currLine === undefined && origLine !== undefined) {
      // Removed line
      left.push({ type: "removed", content: origLine, lineNumber: leftLineNum++ });
      right.push({ type: "unchanged", content: "", lineNumber: 0 });
    } else if (origLine === currLine) {
      // Unchanged
      left.push({ type: "unchanged", content: origLine, lineNumber: leftLineNum++ });
      right.push({ type: "unchanged", content: currLine, lineNumber: rightLineNum++ });
    } else {
      // Changed - show as removed on left, added on right
      left.push({ type: "removed", content: origLine, lineNumber: leftLineNum++ });
      right.push({ type: "added", content: currLine, lineNumber: rightLineNum++ });
    }
  }
  
  return { left, right };
}

function DiffPanel({ lines, side }: { lines: DiffLine[]; side: "left" | "right" }) {
  return (
    <div className="flex-1 min-w-0 border border-border rounded-md overflow-hidden">
      <div className="bg-muted px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          {side === "left" ? "Last Saved" : "Current Changes"}
        </span>
      </div>
      <ScrollArea className="h-[400px]">
        <pre className="text-xs font-mono p-2">
          {lines.map((line, idx) => (
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
              <span className="w-10 px-2 text-right text-muted-foreground select-none border-r border-border mr-2 flex-shrink-0">
                {line.lineNumber > 0 ? line.lineNumber : ""}
              </span>
              <span
                className={`flex-1 whitespace-pre-wrap break-all ${
                  line.type === "added"
                    ? "text-green-700 dark:text-green-300"
                    : line.type === "removed"
                    ? "text-red-700 dark:text-red-300"
                    : "text-foreground"
                }`}
              >
                {line.type === "added" && "+ "}
                {line.type === "removed" && "- "}
                {line.content}
              </span>
            </div>
          ))}
        </pre>
      </ScrollArea>
    </div>
  );
}

export function DiffViewerModal({
  open,
  onOpenChange,
  title,
  original,
  current,
  onCreateVersion,
  isCreatingVersion,
  showVersionButton = true,
}: DiffViewerModalProps) {
  const { left, right } = computeDiff(original, current);
  const hasChanges = original !== current;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            View Changes - {title}
          </DialogTitle>
        </DialogHeader>

        {!hasChanges ? (
          <div className="py-12 text-center text-muted-foreground">
            No changes detected
          </div>
        ) : (
          <div className="flex gap-4">
            <DiffPanel lines={left} side="left" />
            <DiffPanel lines={right} side="right" />
          </div>
        )}

        <DialogFooter>
          {showVersionButton && hasChanges && onCreateVersion && (
            <Button
              onClick={onCreateVersion}
              disabled={isCreatingVersion}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isCreatingVersion ? "Creating Version…" : "Create Version from Changes"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
