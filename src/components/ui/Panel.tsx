import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { HudCorners } from "./HudBracket";
import { BorderBeam } from "./BorderBeam";

export interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  dense?: boolean;
  spotlight?: boolean;
  beam?: boolean;
  hudCorners?: boolean;
  id?: string;
}

/**
 * 21st.dev Inspired Aerospace HUD Panel.
 *
 * Built for high-contrast pitch black & white mission control interfaces.
 * Features optional mouse spotlight tracking, perimeter border beams,
 * and optical corner reticle brackets.
 */
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
  dense = false,
  spotlight = true,
  beam = false,
  hudCorners = true,
  id,
}: PanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <section
      id={id}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`panel relative flex min-h-0 flex-col overflow-hidden bg-[#080808] border border-white/10 ${className}`}
    >
      {/* 21st.dev Mouse Spotlight Layer */}
      {spotlight ? (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.05), transparent 70%)`,
          }}
        />
      ) : null}

      {/* 21st.dev Border Beam */}
      {beam ? <BorderBeam size={220} duration={8} /> : null}

      {/* Optical HUD reticle markers */}
      {hudCorners ? <HudCorners className="text-white/20" /> : null}

      {title || actions ? (
        <header className="relative z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#0c0c0c]/80 px-4 py-3 backdrop-blur-sm">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[12.5px] font-semibold tracking-wide text-white uppercase font-mono">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-400 font-mono">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      <div className={`relative z-10 min-h-0 flex-1 ${dense ? "p-0" : "p-4"} ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}

/** A lighter sub-panel used inside dense dashboards. */
export function SubPanel({
  title,
  children,
  className = "",
  actions,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={`panel-elevated relative bg-[#0e0e0e] border border-white/10 ${className}`}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#141414] px-3 py-1.5">
          {title ? <span className="label-tech text-neutral-300">{title}</span> : <span />}
          {actions}
        </div>
      ) : null}
      <div className="p-3">{children}</div>
    </div>
  );
}
