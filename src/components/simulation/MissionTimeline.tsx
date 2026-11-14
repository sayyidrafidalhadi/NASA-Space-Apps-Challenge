import { PHASE_LABELS, PHASE_ORDER } from "@/engine/simulation";
import type { SimulationPhase } from "@/types";

/**
 * The mission timeline.
 *
 * Nine phases from pre-launch to mission completion, with the current
 * position marked and each phase annotated with its scheduled window.
 */

export interface MissionTimelineProps {
  currentPhase: SimulationPhase;
  elapsedDays: number;
  cruiseEndDay: number;
  arrivalDay: number;
  operationsEndDay: number;
  className?: string;
}

function phaseWindow(
  phase: SimulationPhase,
  cruiseEndDay: number,
  arrivalDay: number,
  operationsEndDay: number,
): [number, number] {
  switch (phase) {
    case "pre-launch":
      return [0, 0];
    case "launch":
      return [0, 0.5];
    case "orbital-insertion":
      return [0.5, 2];
    case "deployment":
      return [2, 6];
    case "cruise":
      return [6, 6 + (cruiseEndDay - 6) * 0.5];
    case "course-correction":
      return [6 + (cruiseEndDay - 6) * 0.5, cruiseEndDay];
    case "arrival":
      return [cruiseEndDay, arrivalDay];
    case "operations":
      return [arrivalDay, operationsEndDay];
    default:
      return [operationsEndDay, operationsEndDay];
  }
}

export function MissionTimeline({
  currentPhase,
  elapsedDays,
  cruiseEndDay,
  arrivalDay,
  operationsEndDay,
  className = "",
}: MissionTimelineProps) {
  const total = Math.max(1, operationsEndDay);
  const position = Math.min(100, (elapsedDays / total) * 100);

  return (
    <div className={className}>
      <div className="relative h-8 font-mono">
        {/* Track. */}
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-white/10" />
        {/* Progress. */}
        <div
          className="absolute left-0 top-3 h-0.5 bg-white shadow-[0_0_8px_white] transition-[width] duration-300"
          style={{ width: `${position}%` }}
        />
        {/* Markers. */}
        {PHASE_ORDER.map((phase) => {
          const [start, end] = phaseWindow(phase, cruiseEndDay, arrivalDay, operationsEndDay);
          const left = Math.min(100, (start / total) * 100);
          const done = elapsedDays >= end && end > 0;
          const active = currentPhase === phase;
          return (
            <div
              key={phase}
              className="absolute top-[8px] h-3 w-px -translate-x-1/2"
              style={{ left: `${left}%` }}
              title={PHASE_LABELS[phase]}
            >
              <span
                className={`block h-3 w-px ${
                  active ? "bg-white shadow-[0_0_6px_white]" : done ? "bg-white/40" : "bg-white/15"
                }`}
              />
            </div>
          );
        })}
        {/* Spacecraft marker. */}
        <div
          className="absolute top-[6px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-black shadow-[0_0_12px_white] transition-[left] duration-300 flex items-center justify-center"
          style={{ left: `${position}%` }}
        >
          <span className="h-1 w-1 rounded-full bg-white animate-ping" />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 font-mono">
        {PHASE_ORDER.map((phase) => {
          const active = currentPhase === phase;
          return (
            <span
              key={phase}
              className={`text-[9.5px] uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "text-white font-bold underline underline-offset-4 decoration-white"
                  : "text-neutral-500"
              }`}
            >
              {PHASE_LABELS[phase]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
