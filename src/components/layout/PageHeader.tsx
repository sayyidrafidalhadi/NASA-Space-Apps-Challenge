import type { ReactNode } from "react";

/**
 * High-Contrast Pitch Black & White Aerospace Page Header.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-white/10 bg-black/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="label-tech mb-1.5 flex items-center gap-2 text-neutral-400">
              <span className="inline-block h-1.5 w-1.5 bg-white shadow-[0_0_8px_white]" />
              <span>{eyebrow}</span>
            </div>
          ) : null}
          <h1 className="text-[22px] font-black uppercase tracking-tight text-white font-mono sm:text-[24px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-neutral-400 font-mono">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}

/** Consistent page body container. */
export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1600px] px-4 py-6 lg:px-6 ${className}`}>{children}</div>;
}
