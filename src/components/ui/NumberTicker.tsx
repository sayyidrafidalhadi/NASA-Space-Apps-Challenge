import { useEffect, useRef, useState } from "react";

export interface NumberTickerProps {
  value: number;
  decimalPlaces?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * 21st.dev Animated Number Ticker.
 *
 * Smoothly rolls numerical telemetry values towards their target number,
 * evoking high-precision aerospace digital readouts.
 */
export function NumberTicker({
  value,
  decimalPlaces = 0,
  className = "",
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    prevValueRef.current = value;

    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 650; // ms
    const startTime = performance.now();

    let frameId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return (
    <span className={`font-mono tabular-nums tracking-tight ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
