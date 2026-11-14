import { AU, DAYS_PER_MONTH, MU_SUN, SECONDS_PER_DAY } from "./constants";
import type { DestinationId, Planet } from "@/types";
import { PLANET_BY_ID } from "@/data/planets";

/**
 * Simplified heliocentric orbital mechanics.
 *
 * MODEL
 * Every planet is treated as a point mass on a circular (or near-circular)
 * Kepler orbit around the Sun. Transfers are modelled as Hohmann-like two-
 * impulse transfers between coplanar circular orbits. This is an educational
 * approximation: it ignores planetary rotation, non-coplanar inclination
 * changes, launch window geometry, arrival capture mechanics and any
 * mission-specific trade.
 *
 * It is NOT flight-dynamics software and must not be used to plan a real
 * mission.
 */

export interface OrbitState {
  /** Heliocentric distance, m. */
  radiusM: number;
  /** Position angle along the orbit, radians. */
  angleRad: number;
  /** Orbital speed, m/s. */
  speedMs: number;
}

export interface TransferPlan {
  originId: DestinationId;
  destinationId: DestinationId;
  /** Heliocentric distance of the departure orbit, m. */
  departureRadiusM: number;
  /** Heliocentric distance of the arrival orbit, m. */
  arrivalRadiusM: number;
  /** Departure heliocentric speed, m/s. */
  departureSpeedMs: number;
  /** Arrival heliocentric speed, m/s. */
  arrivalSpeedMs: number;
  /** Transfer orbit periapsis speed, m/s. */
  transferPeriapsisSpeedMs: number;
  /** Transfer orbit apoapsis speed, m/s. */
  transferApoapsisSpeedMs: number;
  /** Δv to leave the departure orbit, m/s. */
  departureDeltaVMs: number;
  /** Δv to circularise at arrival, m/s. */
  arrivalDeltaVMs: number;
  /** Total heliocentric Δv, m/s. */
  totalDeltaVMs: number;
  /** Time of flight for the transfer, seconds. */
  timeOfFlightS: number;
  /** Time of flight, days. */
  timeOfFlightDays: number;
  /** Time of flight, months. */
  timeOfFlightMonths: number;
  /** Semi-major axis of the transfer orbit, m. */
  transferSemiMajorAxisM: number;
  /** Required phase angle at departure, radians. */
  departurePhaseAngleRad: number;
  /** Current phase angle between origin and destination, radians. */
  currentPhaseAngleRad: number;
  /** Days until the next alignment window opens. */
  daysToWindow: number;
  /** Orbital period of the departure orbit, seconds. */
  departurePeriodS: number;
  /** Orbital period of the arrival orbit, seconds. */
  arrivalPeriodS: number;
  /** True when the transfer moves outward from the Sun. */
  outward: boolean;
}

/** Circular orbital speed at a heliocentric radius. */
export function circularSpeed(radiusM: number): number {
  return Math.sqrt(MU_SUN / radiusM);
}

/** Circular orbital period at a heliocentric radius. */
export function orbitalPeriod(radiusM: number): number {
  return 2 * Math.PI * Math.sqrt((radiusM * radiusM * radiusM) / MU_SUN);
}

/** Semi-major axis of the orbit for a given orbital period. */
export function semiMajorAxisFromPeriod(periodS: number): number {
  return Math.cbrt((MU_SUN * periodS * periodS) / (4 * Math.PI * Math.PI));
}

/** Speed on an ellipse at a given radius (vis-viva equation). */
export function visViva(radiusM: number, semiMajorAxisM: number): number {
  return Math.sqrt(MU_SUN * (2 / radiusM - 1 / semiMajorAxisM));
}

/**
 * Position of a body on its orbit at a given epoch, in the orbital plane.
 * Uses the mean anomaly treated as the true anomaly — accurate enough for a
 * circular orbit and free of the eccentric-anomaly trigonometry.
 */
export function orbitalState(planet: Planet, epochDays: number): OrbitState {
  const radiusM = planet.semiMajorAxisAU * AU;
  const periodS = planet.orbitalPeriodDays * SECONDS_PER_DAY;
  const angleRad = ((epochDays * SECONDS_PER_DAY) / periodS) * 2 * Math.PI;
  return {
    radiusM,
    angleRad: angleRad % (2 * Math.PI),
    speedMs: circularSpeed(radiusM),
  };
}

/** Heliocentric position in the ecliptic plane, metres. */
export function eclipticPosition(planet: Planet, epochDays: number): { x: number; y: number } {
  const { radiusM, angleRad } = orbitalState(planet, epochDays);
  return { x: radiusM * Math.cos(angleRad), y: radiusM * Math.sin(angleRad) };
}

/**
 * Build a two-impulse transfer plan between two bodies.
 *
 * The model assumes coplanar circular orbits and ignores window geometry
 * beyond reporting the phase angle and the wait for the next alignment.
 */
export function planTransfer(originId: DestinationId, destinationId: DestinationId, epochDays = 0): TransferPlan {
  const origin = PLANET_BY_ID[originId];
  const destination = PLANET_BY_ID[destinationId];

  const departureRadiusM = origin.semiMajorAxisAU * AU;
  const arrivalRadiusM = destination.semiMajorAxisAU * AU;
  const departurePeriodS = orbitalPeriod(departureRadiusM);
  const arrivalPeriodS = orbitalPeriod(arrivalRadiusM);

  const transferSemiMajorAxisM = (departureRadiusM + arrivalRadiusM) / 2;
  const timeOfFlightS = Math.PI * Math.sqrt((transferSemiMajorAxisM ** 3) / MU_SUN);

  const departureSpeedMs = circularSpeed(departureRadiusM);
  const arrivalSpeedMs = circularSpeed(arrivalRadiusM);
  const transferPeriapsisSpeedMs = visViva(departureRadiusM, transferSemiMajorAxisM);
  const transferApoapsisSpeedMs = visViva(arrivalRadiusM, transferSemiMajorAxisM);

  const outward = arrivalRadiusM >= departureRadiusM;
  const departureDeltaVMs = Math.abs(transferPeriapsisSpeedMs - departureSpeedMs);
  const arrivalDeltaVMs = Math.abs(arrivalSpeedMs - transferApoapsisSpeedMs);
  const totalDeltaVMs = departureDeltaVMs + arrivalDeltaVMs;

  // Required phase angle at departure for a Hohmann-like transfer.
  const nDeparture = (2 * Math.PI) / departurePeriodS;
  const nArrival = (2 * Math.PI) / arrivalPeriodS;
  const phaseTarget = Math.PI - nArrival * timeOfFlightS;

  const originState = orbitalState(origin, epochDays);
  const destinationState = orbitalState(destination, epochDays);
  let currentPhase = destinationState.angleRad - originState.angleRad;
  while (currentPhase < 0) currentPhase += 2 * Math.PI;
  while (currentPhase >= 2 * Math.PI) currentPhase -= 2 * Math.PI;

  // Relative angular rate, normalised to the positive direction.
  const relativeRate = (nDeparture - nArrival) % (2 * Math.PI);
  let daysToWindow = 0;
  if (Math.abs(relativeRate) > 1e-9) {
    let delta = (phaseTarget - currentPhase) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    daysToWindow = delta / Math.abs(relativeRate) / SECONDS_PER_DAY;
  }

  return {
    originId,
    destinationId,
    departureRadiusM,
    arrivalRadiusM,
    departureSpeedMs,
    arrivalSpeedMs,
    transferPeriapsisSpeedMs,
    transferApoapsisSpeedMs,
    departureDeltaVMs,
    arrivalDeltaVMs,
    totalDeltaVMs,
    timeOfFlightS,
    timeOfFlightDays: timeOfFlightS / SECONDS_PER_DAY,
    timeOfFlightMonths: timeOfFlightS / SECONDS_PER_DAY / DAYS_PER_MONTH,
    transferSemiMajorAxisM,
    departurePhaseAngleRad: phaseTarget,
    currentPhaseAngleRad: currentPhase,
    daysToWindow,
    departurePeriodS,
    arrivalPeriodS,
    outward,
  };
}

/**
 * Total mission Δv including launch, departure, arrival capture and a
 * reserve for course correction and landing.
 *
 * The budget is split in two, because real missions split it in two:
 *
 *   LAUNCH VEHICLE ENERGY — the Earth departure burn and the heliocentric
 *   injection are provided by the launch vehicle's upper stage. They are
 *   reported for the trajectory view but they are not charged against the
 *   spacecraft's propellant.
 *
 *   SPACECRAFT PROPELLANT BUDGET — orbit insertion, course correction, the
 *   arrival capture and (for the inner planets) the landing burn. These are
 *   the burns the spacecraft actually performs and they are the ones the
 *   player has to propellant for.
 */
export interface MissionDeltaV {
  /** Earth departure burn, provided by the launch vehicle upper stage. */
  launchDeltaVKms: number;
  /** Heliocentric injection, provided by the launch vehicle upper stage. */
  injectionDeltaVKms: number;
  /** Heliocentric transfer energy, shown for the trajectory. */
  transferDeltaVKms: number;
  /** Orbit insertion performed by the spacecraft after launch. */
  insertionDeltaVKms: number;
  /** Arrival capture performed by the spacecraft. */
  captureDeltaVKms: number;
  /** Course correction reserve. */
  courseCorrectionDeltaVKms: number;
  /** Landing burn, for lander missions only. */
  landingDeltaVKms: number;
  /** Δv the spacecraft must produce itself. */
  spacecraftDeltaVKms: number;
  /** Total mission energy, including the launch vehicle's contribution. */
  totalDeltaVKms: number;
}

/** Δv needed to leave low Earth orbit, m/s. */
export const LEO_ESCAPE_DELTAV_MS = 3200;

/** Δv needed for a mid-course correction, m/s. */
export const COURSE_CORRECTION_DELTAV_MS = 150;

/** Orbit insertion performed by the spacecraft once the launcher releases it. */
export const ORBIT_INSERTION_DELTAV_MS = 600;

/** Landing burn from a low orbit, m/s. */
export const LANDING_DELTAV_MS = 900;

/**
 * Arrival capture performed by the spacecraft, per destination, in m/s.
 *
 * These are educational values. The outer-planet figures assume a gravity
 * assist or a low-thrust arrival that removes most of the arrival v-infinity,
 * which is how real outer-planet missions are flown.
 */
export const CAPTURE_DELTAV_MS: Record<string, number> = {
  earth: 100,
  mercury: 800,
  venus: 900,
  mars: 1000,
  jupiter: 3000,
  saturn: 3200,
  uranus: 3400,
  neptune: 3500,
};

/** Destinations that can be reached with a powered landing. */
export const LANDING_DESTINATIONS: readonly DestinationId[] = ["earth", "mercury", "venus", "mars"];

/**
 * Build the full mission Δv budget for a transfer.
 */
export function missionDeltaV(
  transfer: TransferPlan,
  landing = false,
): MissionDeltaV {
  const launch = LEO_ESCAPE_DELTAV_MS;
  const injection = transfer.departureDeltaVMs;
  const insertion = ORBIT_INSERTION_DELTAV_MS;
  const capture = CAPTURE_DELTAV_MS[transfer.destinationId] ?? 1000;
  const correction = COURSE_CORRECTION_DELTAV_MS;
  const landingDv = landing ? LANDING_DELTAV_MS : 0;

  const spacecraft = insertion + capture + correction + landingDv;

  return {
    launchDeltaVKms: launch / 1000,
    injectionDeltaVKms: injection / 1000,
    transferDeltaVKms: transfer.totalDeltaVMs / 1000,
    insertionDeltaVKms: insertion / 1000,
    captureDeltaVKms: capture / 1000,
    courseCorrectionDeltaVKms: correction / 1000,
    landingDeltaVKms: landingDv / 1000,
    spacecraftDeltaVKms: spacecraft / 1000,
    totalDeltaVKms: (launch + injection + spacecraft) / 1000,
  };
}

/**
 * Heliocentric distance of the spacecraft along the transfer path at a given
 * fraction of the flight, in metres. Used by the 3D trajectory view.
 */
export function transferPositionRadius(
  transfer: TransferPlan,
  fraction: number,
): { radiusM: number; angleRad: number } {
  const t = Math.min(1, Math.max(0, fraction));
  // Mean anomaly grows linearly in time along the transfer ellipse.
  const meanAnomaly = Math.PI * t;
  const e = (transfer.arrivalRadiusM - transfer.departureRadiusM) / (transfer.arrivalRadiusM + transfer.departureRadiusM);
  // Solve Kepler's equation for the eccentric anomaly (four Newton steps).
  let E = meanAnomaly;
  for (let i = 0; i < 6; i += 1) {
    E -= (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
  }
  const a = transfer.transferSemiMajorAxisM;
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const radiusM = Math.hypot(x, y);
  return { radiusM, angleRad: Math.atan2(y, x) };
}

/** Format a distance in astronomical units with sensible precision. */
export function toAU(metres: number): number {
  return metres / AU;
}

/** Format a distance in kilometres with sensible precision. */
export function toKm(metres: number): number {
  return metres / 1000;
}
