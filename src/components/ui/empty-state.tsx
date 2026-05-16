import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  /** Internal route — renders as <Link>. */
  to?: string;
  /** External href — renders as <a>. */
  href?: string;
  /** Click handler — renders as <button>. */
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** "default" = full panel; "compact" = inline used inside an already-titled section */
  variant?: "default" | "compact";
  className?: string;
}

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "default" | "secondary" | "outline" | "ghost";
}) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {action.label}
    </>
  );

  if (action.to) {
    return (
      <Button asChild variant={variant} className="gap-2">
        <Link to={action.to}>{content}</Link>
      </Button>
    );
  }
  if (action.href) {
    return (
      <Button asChild variant={variant} className="gap-2">
        <a href={action.href} target="_blank" rel="noreferrer">
          {content}
        </a>
      </Button>
    );
  }
  return (
    <Button variant={variant} className="gap-2" onClick={action.onClick}>
      {content}
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact
          ? "py-8 gap-3"
          : "py-16 gap-4 rounded-xl border border-dashed border-border bg-muted/20 px-6",
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-primary/10 text-primary",
            isCompact ? "h-10 w-10" : "h-16 w-16 mb-1",
          )}
        >
          <Icon className={isCompact ? "h-5 w-5" : "h-8 w-8"} />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3
          className={cn(
            "font-semibold text-foreground",
            isCompact ? "text-base" : "text-lg",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {primaryAction ? (
            <ActionButton action={primaryAction} variant="default" />
          ) : null}
          {secondaryAction ? (
            <ActionButton action={secondaryAction} variant="outline" />
          ) : null}
        </div>
      )}
    </div>
  );
}
