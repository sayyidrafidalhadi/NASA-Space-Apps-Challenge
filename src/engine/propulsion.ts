import { G0 } from "./constants";
import type { ComponentSpec } from "@/types";

/**
 * Idealised rocket propulsion.
 *
 * The model uses the Tsiolkovsky rocket equation
 *
 *     Δv = Isp · g0 · ln(m0 / mf)
 *
 * which assumes a single impulsive burn with constant exhaust velocity and
 * ignores gravity and drag losses, throttleable thrust, finite burn time
 * losses, tank residuals and staging. Real mission Δv budgets are typically
 * 10–30% higher than the ideal figure. This is an educational model.
 */

export interface PropulsionState {
  ispSeconds: number;
  thrustN: number;
  /** Usable propellant loaded at launch, kg. */
  propellantKg: number;
  /** Propellant consumed so far, kg. */
  propellantUsedKg: number;
  /** Remaining propellant, kg. */
  propellantRemainingKg: number;
  /** Dry mass of the propulsion hardware and tank, kg. */
  dryMassKg: number;
  /** Mass ratio achieved so far. */
  massRatio: number;
  /** Maximum Δv available from the remaining propellant, m/s. */
  remainingDeltaVMs: number;
  /** Δv delivered by the burns flown so far, m/s. */
  deliveredDeltaVMs: number;
  /** Burn time required to deliver the delivered Δv, seconds. */
  burnTimeS: number;
  /** Theoretical maximum Δv from the full load, m/s. */
  theoreticalMaxDeltaVMs: number;
}

/** Tsiolkovsky Δv for a burn between two masses. */
export function tsiolkovskyDeltaV(initialMassKg: number, finalMassKg: number, ispSeconds: number): number {
  if (initialMassKg <= 0 || finalMassKg <= 0 || finalMassKg > initialMassKg) return 0;
  return ispSeconds * G0 * Math.log(initialMassKg / finalMassKg);
}

/** Propellant required to deliver `deltaVMs` from an initial wet mass. */
export function propellantRequired(deltaVMs: number, initialMassKg: number, ispSeconds: number): number {
  if (deltaVMs <= 0) return 0;
  const massRatio = Math.exp(deltaVMs / (ispSeconds * G0));
  const finalMassKg = initialMassKg / massRatio;
  return Math.max(0, initialMassKg - finalMassKg);
}

/** Initial mass required to deliver `deltaVMs` with a given final mass. */
export function initialMassRequired(deltaVMs: number, finalMassKg: number, ispSeconds: number): number {
  if (deltaVMs <= 0) return finalMassKg;
  return finalMassKg * Math.exp(deltaVMs / (ispSeconds * G0));
}

/**
 * Assemble the propulsion state from the selected components.
 *
 * `dryMassKg` is the mass of the spacecraft with the tank empty — it already
 * includes the tank's own structure and the propulsion hardware. The loaded
 * mass adds the propellant, and the structural margin is applied to both so
 * that the mass ratio the rocket equation sees is the one the launcher sees.
 */
export function evaluatePropulsion(
  propulsion: ComponentSpec,
  fuel: ComponentSpec,
  dryMassKg: number,
  deliveredDeltaVMs = 0,
  structureFactor = 0,
): PropulsionState {
  const ispSeconds = propulsion.ispSeconds ?? 220;
  const thrustN = propulsion.thrustN ?? 0;
  const propellantKg = fuel.propellantCapacityKg ?? 0;
  const hardwareMassKg = (fuel.massKg ?? 0) + (propulsion.massKg ?? 0);
  const dryTotalKg = dryMassKg * (1 + structureFactor);
  const loadedMassKg = (dryMassKg + propellantKg) * (1 + structureFactor);

  const maxDeltaV = tsiolkovskyDeltaV(loadedMassKg, dryTotalKg, ispSeconds);
  const remainingPropellantKg = Math.max(
    0,
    propellantKg - deliveredDeltaVMsToPropellant(deliveredDeltaVMs, loadedMassKg, ispSeconds),
  );
  const currentMassKg = (dryMassKg + remainingPropellantKg) * (1 + structureFactor);
  const emptyMassKg = dryTotalKg;
  const remainingDeltaV = tsiolkovskyDeltaV(currentMassKg, emptyMassKg, ispSeconds);

  const burnRate = thrustN > 0 ? thrustN / (ispSeconds * G0) : 0;
  const burnTimeS = burnRate > 0 ? remainingPropellantKg / burnRate : 0;

  return {
    ispSeconds,
    thrustN,
    propellantKg,
    propellantUsedKg: propellantKg - remainingPropellantKg,
    propellantRemainingKg: remainingPropellantKg,
    dryMassKg: hardwareMassKg,
    massRatio: currentMassKg > 0 && emptyMassKg > 0 ? currentMassKg / emptyMassKg : 1,
    remainingDeltaVMs: Math.max(0, remainingDeltaV),
    deliveredDeltaVMs,
    burnTimeS,
    theoreticalMaxDeltaVMs: maxDeltaV,
  };
}

/**
 * Propellant consumed by a single impulsive burn of `deltaVMs` from a given
 * wet mass, using the rocket equation.
 */
export function burnPropellant(
  deltaVMs: number,
  wetMassKg: number,
  emptyMassKg: number,
  ispSeconds: number,
): number {
  if (deltaVMs <= 0) return 0;
  const massRatio = Math.exp(deltaVMs / (ispSeconds * G0));
  const finalMass = wetMassKg / massRatio;
  const needed = wetMassKg - finalMass;
  const available = wetMassKg - emptyMassKg;
  return Math.min(Math.max(0, needed), Math.max(0, available));
}

/** Propellant mass consumed by delivering a given Δv from a given wet mass. */
export function deliveredDeltaVMsToPropellant(
  deltaVMs: number,
  initialMassKg: number,
  ispSeconds: number,
): number {
  return propellantRequired(deltaVMs, initialMassKg, ispSeconds);
}

/**
 * Can the selected propulsion system deliver the required mission Δv within
 * its propellant load? Returns the shortfall in m/s (zero when feasible).
 */
export function deltaVShortfall(state: PropulsionState, requiredDeltaVMs: number): number {
  return Math.max(0, requiredDeltaVMs - state.remainingDeltaVMs);
}
