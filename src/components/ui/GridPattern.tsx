/**
 * 21st.dev Technical Grid Pattern Background.
 *
 * Renders an ultra-subtle coordinate grid with a radial vignetted mask
 * over pure pitch black.
 */
export function GridPattern({
  width = 36,
  height = 36,
  className = "",
  strokeColor = "rgba(255, 255, 255, 0.05)",
}: {
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_65%,transparent_100%)] ${className}`}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mf-grid-pattern" width={width} height={height} patternUnits="userSpaceOnUse">
            <path d={`M ${width} 0 L 0 0 0 ${height}`} fill="none" stroke={strokeColor} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mf-grid-pattern)" />
      </svg>
    </div>
  );
}
