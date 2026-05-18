import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon?: LucideIcon | (() => ReactNode);
  iconNode?: ReactNode;
  title: string;
  count: number;
  total?: number;
  showFraction?: boolean;
  action?: ReactNode;
  iconClassName?: string;
}

/**
 * Unified Library section header.
 * - h2 title + muted count chip (no italic, no mixed weight)
 * - Single-line layout at ≥640px (sm), wraps cleanly on mobile
 * - Action slot is right-aligned and stable
 */
export function SectionHeader({
  icon: Icon,
  iconNode,
  title,
  count,
  total,
  showFraction = false,
  action,
  iconClassName = "h-5 w-5 text-primary",
}: SectionHeaderProps) {
  const countLabel =
    showFraction && total !== undefined && total !== count
      ? `${count} of ${total}`
      : `${count}`;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:flex-nowrap">
      <div className="flex min-w-0 items-center gap-2">
        {iconNode ?? (Icon ? <Icon className={iconClassName} /> : null)}
        <h2 className="truncate text-xl font-semibold text-foreground">
          {title}
        </h2>
        <span
          className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
          aria-label={
            showFraction && total !== undefined && total !== count
              ? `${count} of ${total}`
              : `${count} items`
          }
        >
          {countLabel}
        </span>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
