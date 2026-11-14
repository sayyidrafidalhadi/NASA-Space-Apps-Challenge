import { useId, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

/**
 * Contextual tooltip for technical concepts.
 *
 * Opens on hover and on keyboard focus so the explanation is reachable
 * without a pointer.
 */

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Render a small help glyph instead of wrapping the children. */
  variant?: "wrap" | "icon";
  className?: string;
}

export function Tooltip({ content, children, variant = "wrap", className = "" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (variant === "icon") {
    return (
      <span className={`relative inline-flex ${className}`}>
        <button
          type="button"
          aria-describedby={open ? id : undefined}
          aria-label="Technical explanation"
          className="inline-flex items-center text-ink-muted transition-colors hover:text-accent"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <HelpCircle size={13} strokeWidth={1.8} />
        </button>
        {open ? (
          <span
            id={id}
            role="tooltip"
            className="panel-elevated absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 p-2.5 text-[11px] font-normal leading-relaxed text-ink shadow-xl"
          >
            {content}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span tabIndex={0} aria-describedby={open ? id : undefined} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
        {children}
      </span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="panel-elevated absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 p-2.5 text-[11px] font-normal leading-relaxed text-ink shadow-xl"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
