import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * Empty state used wherever a panel has nothing to show yet.
 * The application never leaves a blank region without an explanation.
 */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="text-ink-muted/70">{icon ?? <Inbox size={20} strokeWidth={1.4} />}</div>
      <div className="text-[13px] font-medium text-ink">{title}</div>
      {description ? (
        <p className="max-w-sm text-[11px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
