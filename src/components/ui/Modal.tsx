import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./Button";

/**
 * Modal dialog.
 *
 * Escape closes it, the background scroll is locked while it is open and the
 * dialog is announced as a modal to assistive technology.
 */

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function Modal({ open, title, subtitle, onClose, children, footer, width = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-void/80 p-4 backdrop-blur-[2px] sm:p-8">
      <div role="dialog" aria-modal="true" className={`panel my-auto w-full ${WIDTHS[width]} shadow-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</p> : null}
          </div>
          <IconButton label="Close dialog" icon={<X size={15} />} onClick={onClose} />
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
