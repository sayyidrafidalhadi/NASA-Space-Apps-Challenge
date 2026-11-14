/**
 * Formatting helpers shared across the interface.
 * All values keep their unit in the label so the reader never has to guess.
 */

/** Fixed-decimal number with thousands separators. */
export function num(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Compact number with a magnitude suffix, for large quantities. */
export function compact(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${num(value / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${num(value / 1_000, 1)}k`;
  return num(value, abs < 10 ? 1 : 0);
}

/** Money in millions of USD. */
export function money(millions: number, digits = 1): string {
  return `$${num(millions, digits)}M`;
}

/** Percentage with a sign when relevant. */
export function percent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${num(value, digits)}%`;
}

/** Signed percentage, used for margins. */
export function signedPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${num(value, digits)}%`;
}

/** Velocity in km/s. */
export function velocity(ms: number, digits = 2): string {
  return `${num(ms / 1000, digits)} km/s`;
}

/** Duration in days → "18.4 days" or "6.1 months". */
export function duration(days: number): string {
  if (days < 45) return `${num(days, 1)} d`;
  return `${num(days / 30.4375, 1)} mo`;
}

/** Bytes → a readable data volume. */
export function dataVolume(gbit: number): string {
  if (!Number.isFinite(gbit)) return "—";
  if (gbit >= 1000) return `${num(gbit / 1000, 2)} Tbit`;
  return `${num(gbit, 1)} Gbit`;
}

/** Temperature in kelvin → °C. */
export function kelvinToCelsius(kelvin: number): string {
  return `${num(kelvin - 273.15, 1)} °C`;
}

/** A readable date from a millisecond timestamp. */
export function dateLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Mission clock label from elapsed days. */
export function missionClock(days: number): string {
  const whole = Math.floor(days);
  const hours = Math.floor((days - whole) * 24);
  const minutes = Math.floor(((days - whole) * 24 - hours) * 60);
  return `T+${whole}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Truncate a string with an ellipsis. */
export function truncate(value: string, max = 90): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
