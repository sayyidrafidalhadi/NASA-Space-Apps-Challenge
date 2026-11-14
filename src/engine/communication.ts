import { C_LIGHT, AU } from "./constants";
import type { ComponentSpec } from "@/types";

/**
 * Simplified deep-space communication model.
 *
 * The free-space path loss grows with the square of the distance, so the
 * usable downlink rate at a given range is
 *
 *     effective = nominal × (referenceDistance / actualDistance)²
 *
 * where each communication system quotes its nominal rate at its own
 * reference distance. The model ignores atmospheric losses, weather, pointing
 * jitter, coding overhead and the geometry of the ground-station antenna
 * array. It reproduces the direction and rough scale of the trade-off: a
 * high-gain dish beats an omni by orders of magnitude, and everything
 * degrades with range.
 */

export type LinkStatus = "nominal" | "degraded" | "marginal" | "critical";

export interface CommunicationState {
  distanceAU: number;
  distanceKm: number;
  /** Quoted downlink rate at the system's reference distance, Mbps. */
  nominalMbps: number;
  /** Reference distance the system was sized for, AU. */
  referenceDistanceAU: number;
  /** Usable downlink rate at the current range, Mbps. */
  effectiveMbps: number;
  /** Fraction of the nominal rate still available, 0–1. */
  linkQuality: number;
  /** One-way light time to Earth, seconds. */
  lightTimeS: number;
  /** Ground contact available per day, hours. */
  contactHoursPerDay: number;
  status: LinkStatus;
  /** Human-readable explanation of the current margin. */
  note: string;
}

/** Effective downlink rate for a communication system at a given range. */
export function effectiveDownlinkMbps(comms: ComponentSpec, distanceAU: number): number {
  const reference = comms.referenceDistanceAU ?? 1;
  if (distanceAU <= 0) return 0;
  return (comms.dataRateMbps ?? 0) * (reference / distanceAU) ** 2;
}

/** One-way light time between two bodies separated by `distanceAU`. */
export function lightTimeSeconds(distanceAU: number): number {
  return (distanceAU * AU) / C_LIGHT;
}

/** Link status bucket from the remaining link quality. */
export function linkStatus(quality: number): LinkStatus {
  if (quality >= 0.45) return "nominal";
  if (quality >= 0.2) return "degraded";
  if (quality > 0) return "marginal";
  return "critical";
}

/**
 * Full communication state for a mission at a given range from Earth.
 */
export function evaluateCommunication(
  comms: ComponentSpec,
  distanceAU: number,
  contactHoursPerDay = 8,
): CommunicationState {
  const nominalMbps = comms.dataRateMbps ?? 0;
  const referenceDistanceAU = comms.referenceDistanceAU ?? 1;
  const effectiveMbps = effectiveDownlinkMbps(comms, distanceAU);
  const linkQuality = nominalMbps > 0 ? Math.min(1, effectiveMbps / nominalMbps) : 0;
  const status = linkStatus(linkQuality);

  const notes: Record<LinkStatus, string> = {
    nominal: "Link margin is healthy. Full science return is possible.",
    degraded: "Path loss is eroding the link. Expect intermittent dropouts.",
    marginal: "The link is barely closing. Recorder overflow is likely.",
    critical: "The link is effectively unusable at this range.",
  };

  return {
    distanceAU,
    distanceKm: distanceAU * AU / 1000,
    nominalMbps,
    referenceDistanceAU,
    effectiveMbps,
    linkQuality,
    lightTimeS: lightTimeSeconds(distanceAU),
    contactHoursPerDay,
    status,
    note: notes[status],
  };
}

/**
 * How much science data the mission can actually return over its lifetime,
 * accounting for the recorder buffer and the effective link rate.
 */
export function dataReturnGbit(
  generatedGbitPerMonth: number,
  effectiveMbps: number,
  contactHoursPerDay: number,
  recorderGbit: number,
  missionMonths: number,
): { transmittedGbit: number; lostGbit: number } {
  const downlinkGbitPerMonth =
    (effectiveMbps * contactHoursPerDay * 3600 * missionMonths * 30.4375 * 86400) / 1000;
  const totalGenerated = generatedGbitPerMonth * missionMonths;
  const transmitted = Math.min(totalGenerated, downlinkGbitPerMonth + recorderGbit);
  return { transmittedGbit: transmitted, lostGbit: Math.max(0, totalGenerated - transmitted) };
}
