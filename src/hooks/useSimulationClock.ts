import { useEffect, useRef } from "react";
import { useSimulationStore } from "@/store/simulationStore";

/**
 * The mission clock.
 *
 * The simulation advances in fixed steps of `SIM_STEP_DAYS` regardless of the
 * playback speed, so a mission flown at 8× produces exactly the same result
 * as the same mission flown at 1×. The clock only decides how many fixed
 * steps to request.
 */

/** Simulated days per wall-clock second at 1× speed. */
export const BASE_DAYS_PER_SECOND = 2;

export function useSimulationClock(enabled = true): void {
  const advance = useSimulationStore((state) => state.advance);
  const running = useSimulationStore((state) => state.running);
  const speed = useSimulationStore((state) => state.speed);
  const awaitingDecision = useSimulationStore((state) => state.awaitingDecision);
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !running || awaitingDecision) return;

    lastTime.current = performance.now();

    const loop = (now: number) => {
      const deltaSeconds = Math.min(0.25, (now - lastTime.current) / 1000);
      lastTime.current = now;
      const days = deltaSeconds * BASE_DAYS_PER_SECOND * speed;
      if (days > 0) advance(days);
      frame.current = requestAnimationFrame(loop);
    };

    frame.current = requestAnimationFrame(loop);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled, running, speed, awaitingDecision, advance]);
}
