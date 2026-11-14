/**
 * Aerospace HUD Reticle & Corner Brackets.
 *
 * Adds clean optical crosshairs (+) or brackets to corners of panels,
 * directly referencing mission control HUD displays and brutalist tech UI.
 */
export function HudCorners({ className = "text-white/30" }: { className?: string }) {
  return (
    <>
      <span className={`pointer-events-none absolute -left-1 -top-1 font-mono text-[9px] leading-none select-none ${className}`}>
        +
      </span>
      <span className={`pointer-events-none absolute -right-1 -top-1 font-mono text-[9px] leading-none select-none ${className}`}>
        +
      </span>
      <span className={`pointer-events-none absolute -bottom-1 -left-1 font-mono text-[9px] leading-none select-none ${className}`}>
        +
      </span>
      <span className={`pointer-events-none absolute -bottom-1 -right-1 font-mono text-[9px] leading-none select-none ${className}`}>
        +
      </span>
    </>
  );
}

export function HudBracket({
  className = "border-white/40",
  size = 6,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <>
      <div
        className={`pointer-events-none absolute left-0 top-0 border-l border-t ${className}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 border-r border-t ${className}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`pointer-events-none absolute bottom-0 left-0 border-b border-l ${className}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`pointer-events-none absolute bottom-0 right-0 border-b border-r ${className}`}
        style={{ width: size, height: size }}
      />
    </>
  );
}
