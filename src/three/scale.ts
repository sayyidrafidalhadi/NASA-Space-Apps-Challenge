import { AU, SECONDS_PER_DAY } from "@/engine/constants";
import { PLANET_BY_ID } from "@/data/planets";
import type { BodyId } from "@/types";

/**
 * Visualisation scale for the 3D scene.
 *
 * The scene is NOT to scale. Two separate compressions are applied and both
 * are stated in the interface:
 *
 *   ORBITAL RADIUS   r_scene = 11.5 × a_AU^0.42
 *   BODY RADIUS      R_scene = 0.44 × (R_km / 6371)^0.40
 *
 * A true-scale solar system would put Neptune 30 times further out than it is
 * drawn and would render Jupiter as a tenth of a pixel next to Earth. The
 * power law keeps the ordering, the relative spacing and the sense of the
 * hierarchy while making every body selectable.
 *
 * The engine never uses these numbers. Simulation values always come from
 * the SI-unit physics in `engine/`.
 */

export const SCENE_SCALE_NOTICE =
  "Visual scale is compressed: orbit radii follow a^0.42 and body radii are exaggerated as R^0.40. Positions and sizes are not to scale.";

export const SCENE_SCALE_NOTICE_SHORT =
  "Compressed visual scale — not to scale";

export const ORBIT_RADIUS_EXPONENT = 0.42;
export const BODY_RADIUS_EXPONENT = 0.4;
export const ORBIT_RADIUS_SCALE = 11.5;
export const BODY_RADIUS_SCALE = 0.44;
export const EARTH_RADIUS_KM = 6371;

/** Scene-space orbital radius for a heliocentric semi-major axis in AU. */
export function orbitRadius(semiMajorAxisAU: number): number {
  if (semiMajorAxisAU <= 0) return 0;
  return ORBIT_RADIUS_SCALE * semiMajorAxisAU ** ORBIT_RADIUS_EXPONENT;
}

/** Scene-space radius for a body of a given physical radius in kilometres. */
export function bodyRadius(radiusKm: number): number {
  return BODY_RADIUS_SCALE * (radiusKm / EARTH_RADIUS_KM) ** BODY_RADIUS_EXPONENT;
}

/** Scene-space radius for the Sun, capped so it does not swamp the scene. */
export function sunRadius(): number {
  return 2.2;
}

/**
 * Orbital angle of a body at a given epoch, in radians.
 * A fixed epoch is used so the scene is stable and the planets do not spin
 * wildly when the mission clock advances; the simulation clock offsets the
 * angle separately when it needs to show motion.
 */
export function orbitalAngle(bodyId: BodyId, epochDays = 0): number {
  const planet = PLANET_BY_ID[bodyId];
  if (!planet || planet.semiMajorAxisAU <= 0) return 0;
  const periodS = planet.orbitalPeriodDays * SECONDS_PER_DAY;
  return ((epochDays * SECONDS_PER_DAY) / periodS) * 2 * Math.PI;
}

/** Scene-space position of a body. */
export function scenePosition(bodyId: BodyId, epochDays = 0): [number, number, number] {
  const planet = PLANET_BY_ID[bodyId];
  if (!planet) return [0, 0, 0];
  if (planet.id === "sun") return [0, 0, 0];
  const radius = orbitRadius(planet.semiMajorAxisAU);
  const angle = orbitalAngle(bodyId, epochDays);
  return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
}

/** Physical distance between two bodies in AU, used for the range readout. */
export function physicalDistanceAU(a: BodyId, b: BodyId): number {
  const pa = PLANET_BY_ID[a];
  const pb = PLANET_BY_ID[b];
  if (!pa || !pb) return 0;
  return Math.abs(pa.semiMajorAxisAU - pb.semiMajorAxisAU);
}

/** Scene-space point along a transfer ellipse, for the trajectory ribbon. */
export function transferPoint(
  departureRadiusAU: number,
  arrivalRadiusAU: number,
  fraction: number,
  startAngle: number,
): [number, number, number] {
  const t = Math.min(1, Math.max(0, fraction));
  // Semi-major axis and eccentricity of the transfer ellipse.
  const a = (departureRadiusAU + arrivalRadiusAU) / 2;
  const e = (arrivalRadiusAU - departureRadiusAU) / (arrivalRadiusAU + departureRadiusAU);
  const meanAnomaly = Math.PI * t;
  let E = meanAnomaly;
  for (let i = 0; i < 6; i += 1) {
    E -= (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
  }
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);
  const angle = Math.atan2(y, x) + startAngle;
  const radius = orbitRadius(Math.hypot(x, y));
  return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
}

/** Convert a physical heliocentric radius in metres into scene units. */
export function metresToSceneRadius(metres: number): number {
  return orbitRadius(metres / AU);
}
