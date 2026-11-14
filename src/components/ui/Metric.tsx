import type { ReactNode } from "react";
import { NumberTicker } from "./NumberTicker";

export type MetricTone = "default" | "accent" | "success" | "warning" | "danger";

const TONE: Record<MetricTone, string> = {
  default: "text-white",
  accent: "text-white font-bold",
  success: "text-[#00ff88]",
  warning: "text-[#ffb800]",
  danger: "text-[#ff3344]",
};

export interface MetricProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  tone?: MetricTone;
  detail?: ReactNode;
  size?: "sm" | "md" | "lg";
  ticker?: boolean;
  className?: string;
}

export function Metric({
  label,
  value,
  unit,
  tone = "default",
  detail,
  size = "md",
  ticker = false,
  className = "",
}: MetricProps) {
  const valueSize =
    size === "lg" ? "text-[28px]" : size === "sm" ? "text-[14px]" : "text-[20px]";

  const isNumeric = typeof value === "number";

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="label-tech truncate text-neutral-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`value-num ${valueSize} font-bold leading-none tracking-tight ${TONE[tone]}`}>
          {ticker && isNumeric ? <NumberTicker value={value} /> : value}
        </span>
        {unit ? <span className="value-num text-[11px] text-neutral-400 font-mono">{unit}</span> : null}
      </div>
      {detail ? <div className="mt-1 text-[11px] leading-snug text-neutral-400 font-mono">{detail}</div> : null}
    </div>
  );
}

/** A compact label/value pair for dense tables. */
export function DataRow({
  label,
  value,
  tone = "default",
  mono = true,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: MetricTone;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.04] py-1.5 last:border-0">
      <span className="label-tech text-neutral-400">{label}</span>
      <span className={`${mono ? "value-num" : ""} text-[12px] font-medium ${TONE[tone]}`}>{value}</span>
    </div>
  );
}

/** A high-tech status indicator with an optical beacon. */
export function StatusDot({
  tone = "default",
  label,
  pulse = false,
}: {
  tone?: MetricTone;
  label?: ReactNode;
  pulse?: boolean;
}) {
  const color =
    tone === "success"
      ? "bg-[#00ff88] text-[#00ff88]"
      : tone === "warning"
        ? "bg-[#ffb800] text-[#ffb800]"
        : tone === "danger"
          ? "bg-[#ff3344] text-[#ff3344]"
          : tone === "accent"
            ? "bg-white text-white"
            : "bg-neutral-500 text-neutral-400";

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2 items-center justify-center">
        {pulse ? (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-radar ${color}`} />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${color}`} />
      </span>
      {label ? <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-300">{label}</span> : null}
    </span>
  );
}

/** A technical horizontal meter with laser-level precision. */
export function Meter({
  value,
  max = 100,
  tone = "accent",
  label,
  className = "",
}: {
  value: number;
  max?: number;
  tone?: MetricTone;
  label?: ReactNode;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color =
    tone === "success"
      ? "bg-[#00ff88] shadow-[0_0_8px_#00ff88]"
      : tone === "warning"
        ? "bg-[#ffb800] shadow-[0_0_8px_#ffb800]"
        : tone === "danger"
          ? "bg-[#ff3344] shadow-[0_0_8px_#ff3344]"
          : "bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]";

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="label-tech text-neutral-400">{label}</span>
          <span className="value-num text-[11px] text-white font-mono">{pct.toFixed(0)}%</span>
        </div>
      ) : null}
      <div className="relative h-1.5 w-full overflow-hidden rounded-[1px] bg-neutral-900 border border-white/10">
        <div
          className={`h-full ${color} transition-[width] duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
