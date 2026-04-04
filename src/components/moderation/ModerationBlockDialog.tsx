import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

interface ModerationBlockDialogProps {
  open: boolean;
  onClose: () => void;
  category?: string;
  supportHint?: string;
}

export function ModerationBlockDialog({
  open,
  onClose,
  category,
  supportHint,
}: ModerationBlockDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Content cannot be published
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Your content appears to violate our{" "}
                <Link
                  to="/community-guidelines"
                  className="text-primary underline hover:text-primary/80"
                  onClick={onClose}
                >
                  Community Guidelines
                </Link>
                .
              </p>
              {category && (
                <p className="text-sm italic text-muted-foreground">
                  Category: {category}
                </p>
              )}
              <p className="text-sm">
                Please review and edit your content. Your artifact has been kept as a private draft — nothing was lost.
              </p>
              {supportHint && (
                <p className="text-sm text-muted-foreground">{supportHint}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Understood</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
