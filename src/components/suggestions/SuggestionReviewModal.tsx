import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Check,
  X,
  User,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { SuggestionWithAuthor } from "@/types/suggestion";
import { format } from "date-fns";
import { diffCounts, diffLines, sideBySide } from "@/lib/lineDiff";
import { baseContentOf, suggestionBaseState } from "./suggestionBase";

const ITEM_LABELS: Record<string, string> = {
  prompt: "prompt",
  skill: "skill",
  workflow: "workflow",
  prompt_kit: "prompt kit",
};

interface SuggestionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: SuggestionWithAuthor;
  originalTitle: string;
  originalDescription: string;
  originalContent: string;
  isOwner: boolean;
  /** Resolves false when nothing was accepted; the modal then stays open. */
  onAccept: (reviewComment?: string) => Promise<boolean | void>;
  onReject: (reviewComment?: string) => Promise<void>;
  onRequestChanges: (
    requestedChanges: string[],
    reviewComment?: string,
  ) => Promise<void>;
}

export function SuggestionReviewModal({
  open,
  onOpenChange,
  suggestion,
  originalTitle,
  originalDescription,
  originalContent,
  isOwner,
  onAccept,
  onReject,
  onRequestChanges,
}: SuggestionReviewModalProps) {
  const [reviewComment, setReviewComment] = useState("");
  const [requestedChangesText, setRequestedChangesText] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [showRequestChangesPanel, setShowRequestChangesPanel] = useState(false);
  const [confirmedOverwrite, setConfirmedOverwrite] = useState(false);

  // Accepting replaces the whole content with the suggested text, so the diff
  // is against the content as it is NOW: the red lines are exactly what goes,
  // including any edit made after the suggestion was written (2026-10-07).
  // Memoised: typing a review comment re-renders the dialog on every key.
  const { rows, counts } = useMemo(() => {
    const ops = diffLines(originalContent, suggestion.content);
    return { rows: sideBySide(ops), counts: diffCounts(ops) };
  }, [originalContent, suggestion.content]);
  const baseState = suggestionBaseState(
    baseContentOf(suggestion),
    originalContent,
  );
  const itemLabel = ITEM_LABELS[suggestion.item_type] ?? "item";
  const needsConfirm = isOwner && baseState === "changed";

  const handleAccept = async () => {
    if (needsConfirm && !confirmedOverwrite) return;
    setIsAccepting(true);
    try {
      const accepted = await onAccept(reviewComment || undefined);
      if (accepted === false) return;
      toast.success("Suggestion accepted and applied");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept suggestion");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(reviewComment || undefined);
      toast.success("Suggestion rejected");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject suggestion");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!requestedChangesText.trim()) {
      toast.error("Please specify what changes you would like");
      return;
    }

    setIsRequestingChanges(true);
    try {
      // Parse textarea into array of changes (split by newlines, filter empty)
      const changes = requestedChangesText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      await onRequestChanges(changes, reviewComment || undefined);
      toast.success("Changes requested");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to request changes");
    } finally {
      setIsRequestingChanges(false);
    }
  };

  const isProcessing = isAccepting || isRejecting || isRequestingChanges;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isOwner ? "Review Suggestion" : "View Suggestion"}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={suggestion.author?.avatar_url || ""} />
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span>{suggestion.author?.display_name || "Anonymous"}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {format(new Date(suggestion.created_at), "MMM d, yyyy")}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Title/Description changes */}
          {(suggestion.title || suggestion.description) && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              {suggestion.title && suggestion.title !== originalTitle && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Title Change
                  </Label>
                  <div className="flex gap-2 items-center text-sm">
                    <span className="line-through text-muted-foreground">
                      {originalTitle}
                    </span>
                    <span>→</span>
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                </div>
              )}
              {suggestion.description &&
                suggestion.description !== originalDescription && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Description Change
                    </Label>
                    <div className="text-sm">
                      <div className="line-through text-muted-foreground">
                        {originalDescription || "(empty)"}
                      </div>
                      <div className="font-medium">
                        {suggestion.description}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {baseState === "changed" && (
            <div
              role="alert"
              className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <div className="space-y-2">
                <p>
                  This {itemLabel} was changed after the suggestion was written.
                  Accepting replaces the whole content with the suggested text,
                  so the edits made since then are lost. The red lines below are
                  everything that would be removed.
                </p>
                {isOwner && (
                  <label className="flex items-start gap-2 font-medium cursor-pointer">
                    <Checkbox
                      checked={confirmedOverwrite}
                      onCheckedChange={(v) => setConfirmedOverwrite(v === true)}
                      disabled={isProcessing}
                      className="mt-0.5"
                    />
                    I understand that accepting replaces the later edits.
                  </label>
                )}
              </div>
            </div>
          )}
          {baseState === "unknown" && (
            <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                Accepting replaces the whole content with the suggested text. If
                this {itemLabel} was edited after the suggestion was written,
                those edits are lost too. The red lines below are everything
                that would be removed.
              </p>
            </div>
          )}

          {/* Content Diff */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Content Changes ({counts.removed} removed, {counts.added} added)
            </Label>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-muted text-xs font-medium border-b">
                <div className="px-3 py-1.5 border-r">Current</div>
                <div className="px-3 py-1.5">Suggested</div>
              </div>
              <ScrollArea className="h-[250px]">
                <div className="font-mono text-xs">
                  {rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-2">
                      <DiffCellView cell={row.left} className="border-r" />
                      <DiffCellView cell={row.right} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Request Changes Panel */}
          {isOwner && showRequestChangesPanel && (
            <div className="space-y-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <Label
                htmlFor="requested-changes"
                className="text-sm font-medium"
              >
                Requested Changes (one per line)
              </Label>
              <Textarea
                id="requested-changes"
                value={requestedChangesText}
                onChange={(e) => setRequestedChangesText(e.target.value)}
                placeholder="Clarify the input/output section&#10;Add a role definition&#10;Remove redundant constraints"
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Review Comment */}
          {isOwner && (
            <div className="space-y-2">
              <Label htmlFor="review-comment">Review Comment (optional)</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment about your decision..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {isOwner ? "Cancel" : "Close"}
          </Button>

          {isOwner && (
            <>
              {!showRequestChangesPanel ? (
                <Button
                  variant="outline"
                  onClick={() => setShowRequestChangesPanel(true)}
                  disabled={isProcessing}
                  className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Request Changes
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleRequestChanges}
                  disabled={isProcessing || !requestedChangesText.trim()}
                  className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                >
                  {isRequestingChanges && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Submit Change Request
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isRejecting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isProcessing || (needsConfirm && !confirmedOverwrite)}
              >
                {isAccepting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Check className="mr-1 h-4 w-4" />
                Accept & Apply
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiffCellView({
  cell,
  className = "",
}: {
  cell: {
    type: "unchanged" | "removed" | "added";
    content: string;
    line: number;
  } | null;
  className?: string;
}) {
  const tone =
    cell?.type === "removed"
      ? "bg-destructive/20 text-destructive"
      : cell?.type === "added"
        ? "bg-green-500/20 text-green-700 dark:text-green-400"
        : "";
  return (
    <div
      className={`flex px-2 py-0.5 whitespace-pre-wrap [overflow-wrap:anywhere] ${tone} ${
        cell ? "" : "bg-muted/40"
      } ${className}`}
    >
      <span className="text-muted-foreground mr-2 select-none w-8 shrink-0 text-right">
        {cell?.line ?? ""}
      </span>
      <span className="min-w-0">{cell ? cell.content || " " : ""}</span>
    </div>
  );
}
