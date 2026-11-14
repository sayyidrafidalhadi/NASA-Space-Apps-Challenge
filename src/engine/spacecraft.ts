import { LAUNCH_MASS_FACTOR, SCIENCE_SCALE, STRUCTURE_FACTOR } from "./constants";
import { num } from "@/utils/format";
import { COMPONENT_BY_ID } from "@/data/spacecraftComponents";
import { LAUNCH_VEHICLE_BY_ID } from "@/data/launchVehicles";
import { PLANET_BY_ID } from "@/data/planets";
import { OBJECTIVES_BY_BODY } from "@/data/missionObjectives";
import { evaluateCommunication, type CommunicationState } from "./communication";
import { evaluatePower, type PowerBreakdown } from "./powerSystem";
import { evaluatePropulsion, type PropulsionState } from "./propulsion";
import { evaluateThermal, type ThermalState } from "./thermalSystem";
import { missionDeltaV, planTransfer, LANDING_DESTINATIONS, type MissionDeltaV, type TransferPlan } from "./orbitalMechanics";
import type {
  ComponentSpec,
  DestinationId,
  MissionObjective,
  SpacecraftConfig,
} from "@/types";

/**
 * Spacecraft assembly.
 *
 * Every number the laboratory, the launch gate, the orbital planner and the
 * simulation show comes from this module. There are no stored derived values:
 * change a component and every constraint is recomputed immediately.
 */

export interface ResolvedSpacecraft {
  bus: ComponentSpec;
  power: ComponentSpec;
  thermal: ComponentSpec;
  propulsion: ComponentSpec;
  fuel: ComponentSpec;
  comms: ComponentSpec;
  battery: ComponentSpec;
  instruments: ComponentSpec[];
}

export const DEFAULT_SPACECRAFT_CONFIG: SpacecraftConfig = {
  busId: "bus-monoblock",
  powerId: "power-gaas-wing",
  thermalId: "thermal-heatpipe",
  propulsionId: "prop-biprop",
  fuelId: "fuel-mmh600",
  commsId: "comms-xband",
  batteryId: "battery-standard",
  instrumentIds: ["inst-imager", "inst-spectrometer"],
};

export function resolveSpacecraft(config: SpacecraftConfig): ResolvedSpacecraft {
  const pick = (id: string, fallback: string): ComponentSpec =>
    COMPONENT_BY_ID[id] ?? COMPONENT_BY_ID[fallback];

  return {
    bus: pick(config.busId, DEFAULT_SPACECRAFT_CONFIG.busId),
    power: pick(config.powerId, DEFAULT_SPACECRAFT_CONFIG.powerId),
    thermal: pick(config.thermalId, DEFAULT_SPACECRAFT_CONFIG.thermalId),
    propulsion: pick(config.propulsionId, DEFAULT_SPACECRAFT_CONFIG.propulsionId),
    fuel: pick(config.fuelId, DEFAULT_SPACECRAFT_CONFIG.fuelId),
    comms: pick(config.commsId, DEFAULT_SPACECRAFT_CONFIG.commsId),
    battery: pick(config.batteryId, DEFAULT_SPACECRAFT_CONFIG.batteryId),
    instruments: (config.instrumentIds ?? [])
      .map((id) => COMPONENT_BY_ID[id])
      .filter((item): item is ComponentSpec => Boolean(item)),
  };
}

/** Dry mass of every selected component, kg. */
export function dryMass(parts: ResolvedSpacecraft): number {
  return (
    parts.bus.massKg +
    parts.power.massKg +
    parts.thermal.massKg +
    parts.propulsion.massKg +
    parts.fuel.massKg +
    parts.comms.massKg +
    parts.battery.massKg +
    parts.instruments.reduce((sum, item) => sum + item.massKg, 0)
  );
}

/** Total mass including loaded propellant and the structural margin, kg. */
export function totalMass(parts: ResolvedSpacecraft): number {
  const propellant = parts.fuel.propellantCapacityKg ?? 0;
  return (dryMass(parts) + propellant) * (1 + STRUCTURE_FACTOR);
}

/** Cost of every selected component, millions of USD. */
export function componentCost(parts: ResolvedSpacecraft): number {
  return (
    parts.bus.costMillionUSD +
    parts.power.costMillionUSD +
    parts.thermal.costMillionUSD +
    parts.propulsion.costMillionUSD +
    parts.fuel.costMillionUSD +
    parts.comms.costMillionUSD +
    parts.battery.costMillionUSD +
    parts.instruments.reduce((sum, item) => sum + item.costMillionUSD, 0)
  );
}

/**
 * Science capability per objective at a destination.
 *
 * Each objective advances when the payload carries an instrument whose
 * science category matches. The rate is the instrument's data rate scaled by
 * its science weight and its affinity for the destination.
 */
export interface ObjectiveCapability {
  objective: MissionObjective;
  /** Normalised progress 0–1 achievable by the current payload. */
  potential: number;
  /** Science points per month the payload can earn on this objective. */
  rate: number;
  /** Instruments that advance this objective. */
  matchedInstruments: ComponentSpec[];
}

export function objectiveCapabilities(parts: ResolvedSpacecraft, destination: DestinationId): ObjectiveCapability[] {
  const objectives = OBJECTIVES_BY_BODY[destination] ?? [];
  return objectives.map((objective) => {
    const matched = parts.instruments.filter((instrument) =>
      (objective.instrumentCategories ?? []).includes(instrument.scienceCategory ?? ""),
    );
    const weight = matched.reduce(
      (sum, instrument) =>
        sum +
        (instrument.dataRateMbps ?? 0) *
          (instrument.scienceWeight ?? 1) *
          (instrument.affinity?.[destination] ?? 1),
      0,
    );
    const bestSingle = Math.max(
      0,
      ...matched.map(
        (instrument) =>
          (instrument.scienceWeight ?? 1) * (instrument.affinity?.[destination] ?? 1),
      ),
    );
    const potential = Math.min(1, bestSingle / 2.5);
    const rate = weight * SCIENCE_SCALE * 30.4375;
    return { objective, potential, rate, matchedInstruments: matched };
  });
}

/** Total science rate available per month at a destination. */
export function scienceRate(parts: ResolvedSpacecraft, destination: DestinationId): number {
  return objectiveCapabilities(parts, destination).reduce((sum, item) => sum + item.rate, 0);
}

/* ------------------------------------------------------------- full engineering report */

export type ConstraintSeverity = "blocking" | "warning" | "info";

export interface Constraint {
  id: string;
  title: string;
  detail: string;
  formula: string;
  severity: ConstraintSeverity;
}

export interface EngineeringReport {
  parts: ResolvedSpacecraft;
  destination: DestinationId;
  destinationName: string;
  dryMassKg: number;
  totalMassKg: number;
  launchMassKg: number;
  componentCostMillionUSD: number;
  launchCostMillionUSD: number;
  totalCostMillionUSD: number;
  budgetCapMillionUSD: number;
  budgetRemainingMillionUSD: number;
  payloadCapacityKg: number | null;
  massMarginKg: number | null;
  massMarginPct: number | null;
  power: PowerBreakdown;
  propulsion: PropulsionState;
  thermal: ThermalState;
  communication: CommunicationState;
  transfer: TransferPlan;
  deltaV: MissionDeltaV;
  deltaVShortfallMs: number;
  objectives: ObjectiveCapability[];
  scienceRatePerMonth: number;
  constraints: Constraint[];
  blockingCount: number;
  warningCount: number;
  readyToLaunch: boolean;
}

export interface EngineeringInput {
  spacecraft: SpacecraftConfig;
  destination: DestinationId;
  budgetCapMillionUSD: number;
  launchVehicleId: string | null;
  /** Landing or capture burn included in the Δv budget. */
  landing?: boolean;
}

/**
 * Evaluate the complete pre-launch engineering picture for a spacecraft
 * bound for a destination.
 */
export function evaluateSpacecraft(input: EngineeringInput): EngineeringReport {
  const parts = resolveSpacecraft(input.spacecraft);
  const destination = PLANET_BY_ID[input.destination];
  const vehicle = input.launchVehicleId ? LAUNCH_VEHICLE_BY_ID[input.launchVehicleId] : null;

  const dry = dryMass(parts);
  const wet = totalMass(parts);
  const launch = wet * LAUNCH_MASS_FACTOR;

  const componentCostMillionUSD = componentCost(parts);
  const launchCostMillionUSD = vehicle?.published.costMillionUSD ?? 0;
  const totalCostMillionUSD = componentCostMillionUSD + launchCostMillionUSD;

  const payloadCapacityKg = vehicle ? vehicle.estimatedPayloadKg[input.destination] ?? null : null;
  const massMarginKg = payloadCapacityKg === null ? null : payloadCapacityKg - launch;
  const massMarginPct =
    payloadCapacityKg === null || payloadCapacityKg <= 0
      ? null
      : ((payloadCapacityKg - launch) / payloadCapacityKg) * 100;

  const power = evaluatePower(
    parts.power,
    parts.battery,
    parts.thermal,
    parts.comms,
    parts.instruments,
    destination.semiMajorAxisAU,
  );

  const propulsion = evaluatePropulsion(
    parts.propulsion,
    parts.fuel,
    dry,
    0,
    STRUCTURE_FACTOR,
  );

  const thermal = evaluateThermal(
    parts.thermal,
    parts.power,
    parts.propulsion,
    destination.semiMajorAxisAU,
    power.averageLoadW,
    parts.propulsion.thrustN ?? 0,
  );

  const communication = evaluateCommunication(
    parts.comms,
    destination.semiMajorAxisAU,
  );

  const transfer = planTransfer("earth", input.destination);
  const landing = LANDING_DESTINATIONS.includes(input.destination);
  const deltaV = missionDeltaV(transfer, landing);
  const deltaVShortfallMs = Math.max(
    0,
    deltaV.spacecraftDeltaVKms * 1000 - propulsion.remainingDeltaVMs,
  );

  const objectives = objectiveCapabilities(parts, input.destination);
  const scienceRatePerMonth = objectives.reduce((sum, item) => sum + item.rate, 0);

  const constraints: Constraint[] = [];

  if (!vehicle) {
    constraints.push({
      id: "vehicle",
      title: "No launch vehicle selected",
      detail: "Select a launch vehicle to complete the mass and budget analysis.",
      formula: "—",
      severity: "blocking",
    });
  }

  if (vehicle && payloadCapacityKg !== null && launch > payloadCapacityKg) {
    constraints.push({
      id: "mass",
      title: "Exceeds launch vehicle payload capacity",
      detail: `Launch mass is ${Math.round(launch)} kg including structural margin and propellant. ${vehicle.name} is estimated to deliver at most ${payloadCapacityKg} kg to ${destination.name}.`,
      formula: `m_launch ${Math.round(launch)} kg > m_payload ${payloadCapacityKg} kg`,
      severity: "blocking",
    });
  } else if (vehicle && massMarginPct !== null && massMarginPct < 8) {
    constraints.push({
      id: "mass-tight",
      title: "Payload margin is thin",
      detail: `Only ${massMarginPct.toFixed(1)}% of the estimated payload capacity is spare. Any mass growth blocks the mission.`,
      formula: `margin = ${massMarginPct.toFixed(1)}% of ${payloadCapacityKg} kg`,
      severity: "warning",
    });
  }

  if (totalCostMillionUSD > input.budgetCapMillionUSD) {
    constraints.push({
      id: "budget",
      title: "Mission funding cap exceeded",
      detail: `The mission costs $${totalCostMillionUSD.toFixed(1)}M against a $${input.budgetCapMillionUSD}M cap — $${(totalCostMillionUSD - input.budgetCapMillionUSD).toFixed(1)}M over.`,
      formula: `$${launchCostMillionUSD.toFixed(0)}M launch + $${componentCostMillionUSD.toFixed(1)}M spacecraft > $${input.budgetCapMillionUSD}M cap`,
      severity: "blocking",
    });
  } else {
    const remaining = input.budgetCapMillionUSD - totalCostMillionUSD;
    if (remaining / input.budgetCapMillionUSD < 0.08) {
      constraints.push({
        id: "budget-tight",
        title: "Little budget contingency",
        detail: `Only $${remaining.toFixed(1)}M of the $${input.budgetCapMillionUSD}M cap remains. There is no room for a scope increase or a contingency launch.`,
        formula: `remaining = $${remaining.toFixed(1)}M of $${input.budgetCapMillionUSD}M`,
        severity: "warning",
      });
    }
  }

  if (power.deficit) {
    constraints.push({
      id: "power",
      title: "Negative power budget",
      detail: parts.power.constantPower
        ? `The ${parts.power.name} generates ${power.generatedW.toFixed(1)} W but the average load is ${power.averageLoadW.toFixed(1)} W — a deficit of ${Math.abs(power.netPowerW).toFixed(1)} W.`
        : `The ${parts.power.name} generates ${power.generatedW.toFixed(1)} W at ${destination.semiMajorAxisAU} AU (${(power.solarFraction * 100).toFixed(1)}% of 1 AU output) but the average load is ${power.averageLoadW.toFixed(1)} W — a deficit of ${Math.abs(power.netPowerW).toFixed(1)} W.`,
      formula: parts.power.constantPower
        ? `P_gen ${power.generatedW.toFixed(1)} W − P_load ${power.averageLoadW.toFixed(1)} W`
        : `P = ${power.generatedAt1AUW} W / (${destination.semiMajorAxisAU} AU)² = ${power.generatedW.toFixed(1)} W`,
      severity: "blocking",
    });
  } else if (power.marginPct < 12) {
    constraints.push({
      id: "power-tight",
      title: "Thin power margin",
      detail: `The array produces only ${power.marginPct.toFixed(1)}% more power than the average load. Any instrument added later will tip the design into deficit.`,
      formula: `margin = ${power.marginPct.toFixed(1)}%`,
      severity: "warning",
    });
  }

  if (power.peakDeficit) {
    constraints.push({
      id: "power-peak",
      title: "Battery cannot cover a full ground pass",
      detail: `Peak draw exceeds generation by ${Math.abs(power.peakNetPowerW).toFixed(1)} W. An 8-hour pass needs ${power.passEnergyKWh.toFixed(2)} kWh but the pack stores ${power.usableBatteryKWh.toFixed(2)} kWh of usable energy.`,
      formula: `${power.passEnergyKWh.toFixed(2)} kWh required > ${power.usableBatteryKWh.toFixed(2)} kWh usable`,
      severity: "warning",
    });
  }

  if (deltaVShortfallMs > 0) {
    constraints.push({
      id: "delta-v",
      title: "Insufficient propellant",
      detail: `The spacecraft must produce ${deltaV.spacecraftDeltaVKms.toFixed(2)} km/s of Δv for insertion, cruise correction, capture${landing ? " and landing" : ""}. The selected tank and engine combination provides ${(propulsion.remainingDeltaVMs / 1000).toFixed(2)} km/s — a shortfall of ${(deltaVShortfallMs / 1000).toFixed(2)} km/s.`,
      formula: `Δv = Isp·g₀·ln(m₀/m_f) = ${propulsion.ispSeconds}·9.80665·ln(${num(propulsion.massRatio, 3)}) = ${(propulsion.remainingDeltaVMs / 1000).toFixed(2)} km/s`,
      severity: "blocking",
    });
  }

  if (landing && (parts.propulsion.ispSeconds ?? 0) > 1000) {
    constraints.push({
      id: "electric-landing",
      title: "Electric propulsion cannot land",
      detail:
        "A gridded ion or Hall thruster produces far too little thrust for a powered landing. " +
        `${parts.propulsion.name} can only fly an orbiter or a flyby of ${destination.name}.`,
      formula: "F = 0.25–0.30 N against a landing requirement of several kN",
      severity: "blocking",
    });
  }

  if (thermal.excessHeatW > 0) {
    constraints.push({
      id: "thermal",
      title: "Thermal system cannot reject the heat load",
      detail: thermal.notes[0] ?? "The radiator area is insufficient for the waste heat.",
      formula: `q = ${thermal.totalHeatW.toFixed(0)} W > ${thermal.rejectionCapacityW.toFixed(0)} W at ${thermal.limitC.toFixed(0)} °C`,
      severity: "blocking",
    });
  } else if (thermal.status === "hot" || thermal.status === "warm") {
    constraints.push({
      id: "thermal-warn",
      title: "Thermal margin is thin",
      detail: thermal.notes[0] ?? "The radiator will run hot.",
      formula: `T_rad = ${thermal.radiatorTemperatureC.toFixed(0)} °C vs ${thermal.limitC.toFixed(0)} °C limit`,
      severity: "warning",
    });
  }

  if (communication.status === "critical" || communication.status === "marginal") {
    constraints.push({
      id: "comms",
      title: "Communication link is marginal at this range",
      detail: `${communication.note} The effective downlink at ${destination.semiMajorAxisAU} AU is ${(communication.effectiveMbps * 1000).toFixed(1)} kbps against a quoted ${(communication.nominalMbps * 1000).toFixed(0)} kbps.`,
      formula: `rate = ${(communication.nominalMbps * 1000).toFixed(0)} kbps × (${communication.referenceDistanceAU} / ${destination.semiMajorAxisAU})²`,
      severity: communication.status === "critical" ? "blocking" : "warning",
    });
  }

  if (parts.instruments.length === 0) {
    constraints.push({
      id: "no-payload",
      title: "No scientific payload",
      detail: "This spacecraft carries no instruments. It will return no science and score zero on the science objectives.",
      formula: "—",
      severity: "blocking",
    });
  } else {
    const unmatched = objectives.filter((item) => item.matchedInstruments.length === 0);
    if (unmatched.length > 0 && unmatched.length === objectives.length) {
      constraints.push({
        id: "payload-mismatch",
        title: "Payload does not match any objective",
        detail: `None of the selected instruments match the science categories of ${destination.name} objectives.`,
        formula: "—",
        severity: "warning",
      });
    }
  }

  const blockingCount = constraints.filter((c) => c.severity === "blocking").length;
  const warningCount = constraints.filter((c) => c.severity === "warning").length;

  return {
    parts,
    destination: input.destination,
    destinationName: destination.name,
    dryMassKg: dry,
    totalMassKg: wet,
    launchMassKg: launch,
    componentCostMillionUSD,
    launchCostMillionUSD,
    totalCostMillionUSD,
    budgetCapMillionUSD: input.budgetCapMillionUSD,
    budgetRemainingMillionUSD: input.budgetCapMillionUSD - totalCostMillionUSD,
    payloadCapacityKg,
    massMarginKg,
    massMarginPct,
    power,
    propulsion,
    thermal,
    communication,
    transfer,
    deltaV,
    deltaVShortfallMs,
    objectives,
    scienceRatePerMonth,
    constraints,
    blockingCount,
    warningCount,
    readyToLaunch: blockingCount === 0,
  };
}
