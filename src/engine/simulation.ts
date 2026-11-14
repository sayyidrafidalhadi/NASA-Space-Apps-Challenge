import { DAYS_PER_MONTH, HEALTH_LOSS_PER_POWER_DEFICIT, SCIENCE_SCALE, STRUCTURE_FACTOR } from "./constants";
import { evaluateCommunication, type CommunicationState } from "./communication";
import { evaluatePower, type PowerBreakdown } from "./powerSystem";
import { evaluateThermal, type ThermalState } from "./thermalSystem";
import {
  LANDING_DESTINATIONS,
  missionDeltaV,
  planTransfer,
  transferPositionRadius,
  type MissionDeltaV,
} from "./orbitalMechanics";
import { burnPropellant } from "./propulsion";
import { dryMass, resolveSpacecraft } from "./spacecraft";
import { eligibleEvents, type EventEffects, type MissionEventDefinition } from "./missionEvents";
import { PLANET_BY_ID } from "@/data/planets";
import { OBJECTIVES_BY_BODY } from "@/data/missionObjectives";
import { nextRandom } from "@/utils/rng";
import type {
  DestinationId,
  EventSeverity,
  MissionEventRecord,
  ObjectiveProgress,
  SimulationPhase,
  SpacecraftConfig,
  TelemetrySample,
} from "@/types";

/**
 * Mission simulation.
 *
 * A deterministic, fixed-step state machine. The clock advances in steps of
 * `SIM_STEP_DAYS` so that a mission flown at 8× produces exactly the same
 * result as the same mission flown at 1×. All randomness comes from the
 * generator state carried in the runtime object.
 *
 * The physics are simplified but configuration-dependent: a solar-powered
 * mission to Jupiter really does run out of power, a heavy comms system really
 * does eat the power budget, an electric thruster really cannot land, and a
 * spacecraft with no instruments really does return no science.
 */

export const SIM_STEP_DAYS = 0.25;

export interface SimulationConfig {
  missionId: string;
  missionName: string;
  destination: DestinationId;
  durationMonths: number;
  spacecraft: SpacecraftConfig;
  launchVehicleId: string | null;
  seed: number;
}

export interface ActiveModifier {
  power: number;
  downlink: number;
  science: number;
  untilDay: number;
  label: string;
}

export interface SimulationRuntime {
  missionId: string;
  phase: SimulationPhase;
  elapsedDays: number;
  missionDays: number;
  cruiseEndDay: number;
  arrivalDay: number;
  operationsEndDay: number;
  health: number;
  science: number;
  fuelKg: number;
  fuelInitialKg: number;
  /** Dry spacecraft mass including the tank structure, kg. */
  dryMassKg: number;
  batteryWh: number;
  batteryCapacityWh: number;
  recorderGbit: number;
  recorderCapacityGbit: number;
  rangeAU: number;
  heliocentricAU: number;
  commLink: number;
  thermalC: number;
  generatedW: number;
  loadW: number;
  power: PowerBreakdown | null;
  thermal: ThermalState | null;
  communication: CommunicationState | null;
  deltaV: MissionDeltaV;
  modifiers: ActiveModifier;
  events: MissionEventRecord[];
  resolvedEventIds: string[];
  pendingEventId: string | null;
  objectives: ObjectiveProgress[];
  failures: Array<{ id: string; title: string; detail: string }>;
  recoveries: Array<{ id: string; title: string; detail: string }>;
  samples: TelemetrySample[];
  rngState: number;
  completed: boolean;
  outcome: "success" | "partial" | "failure" | null;
  endReason: string | null;
  powerDeficitDays: number;
  dataLostGbit: number;
  dataTransmittedGbit: number;
  /** Burns already performed, so each one happens exactly once. */
  burns: string[];
}

/* ------------------------------------------------------------------ helpers */

function phaseForDay(runtime: SimulationRuntime): SimulationPhase {
  const { elapsedDays, cruiseEndDay, arrivalDay, operationsEndDay, completed, outcome } = runtime;
  if (completed) return outcome === "failure" ? "failed" : "complete";
  if (elapsedDays < 0.5) return "launch";
  if (elapsedDays < 2) return "orbital-insertion";
  if (elapsedDays < 6) return "deployment";
  if (elapsedDays < cruiseEndDay) {
    // A course correction sits at the midpoint of the cruise.
    const midpoint = 6 + (cruiseEndDay - 6) * 0.5;
    return elapsedDays >= midpoint ? "course-correction" : "cruise";
  }
  if (elapsedDays < arrivalDay) return "arrival";
  if (elapsedDays < operationsEndDay) return "operations";
  return "operations";
}

/** Mission phase labels for the timeline. */
export const PHASE_LABELS: Record<SimulationPhase, string> = {
  idle: "Pre-Launch",
  "pre-launch": "Pre-Launch",
  launch: "Launch",
  "orbital-insertion": "Orbital Insertion",
  deployment: "Deployment",
  cruise: "Interplanetary Cruise",
  "course-correction": "Course Correction",
  arrival: "Destination Arrival",
  operations: "Scientific Operations",
  complete: "Mission Complete",
  failed: "Mission Failed",
};

export const PHASE_ORDER: SimulationPhase[] = [
  "pre-launch",
  "launch",
  "orbital-insertion",
  "deployment",
  "cruise",
  "course-correction",
  "arrival",
  "operations",
  "complete",
];

/* -------------------------------------------------------------- construction */

export function createSimulation(config: SimulationConfig): SimulationRuntime {
  const parts = resolveSpacecraft(config.spacecraft);
  const destination = PLANET_BY_ID[config.destination];
  const transfer = planTransfer("earth", config.destination);
  const cruiseEndDay = 6 + transfer.timeOfFlightDays;
  const arrivalDay = cruiseEndDay + 1;
  const missionDays = Math.max(config.durationMonths * DAYS_PER_MONTH, arrivalDay + 2);
  const operationsEndDay = missionDays;

  const power = evaluatePower(
    parts.power,
    parts.battery,
    parts.thermal,
    parts.comms,
    parts.instruments,
    destination.semiMajorAxisAU,
  );
  const thermal = evaluateThermal(
    parts.thermal,
    parts.power,
    parts.propulsion,
    destination.semiMajorAxisAU,
    power.averageLoadW,
    parts.propulsion.thrustN ?? 0,
  );
  const communication = evaluateCommunication(parts.comms, destination.semiMajorAxisAU);
  const landing = LANDING_DESTINATIONS.includes(config.destination);
  const deltaV = missionDeltaV(transfer, landing);

  const objectives: ObjectiveProgress[] = (OBJECTIVES_BY_BODY[config.destination] ?? []).map(
    (objective) => ({
      objectiveId: objective.id,
      title: objective.title,
      reward: objective.reward,
      progress: 0,
      complete: false,
    }),
  );

  const fuelInitialKg = parts.fuel.propellantCapacityKg ?? 0;

  return {
    missionId: config.missionId,
    phase: "pre-launch",
    elapsedDays: 0,
    missionDays,
    cruiseEndDay,
    arrivalDay,
    operationsEndDay,
    health: 100,
    science: 0,
    fuelKg: fuelInitialKg,
    fuelInitialKg,
    dryMassKg: dryMass(parts),
    batteryWh: parts.battery.capacityWh ?? 0,
    batteryCapacityWh: parts.battery.capacityWh ?? 0,
    recorderGbit: 0,
    recorderCapacityGbit: 64,
    rangeAU: 0,
    heliocentricAU: 1,
    commLink: 1,
    thermalC: thermal.electronicsTemperatureC,
    generatedW: power.generatedW,
    loadW: power.averageLoadW,
    power,
    thermal,
    communication,
    deltaV,
    modifiers: { power: 1, downlink: 1, science: 1, untilDay: 0, label: "Nominal" },
    events: [],
    resolvedEventIds: [],
    pendingEventId: null,
    objectives,
    failures: [],
    recoveries: [],
    samples: [],
    rngState: config.seed >>> 0,
    completed: false,
    outcome: null,
    endReason: null,
    powerDeficitDays: 0,
    dataLostGbit: 0,
    dataTransmittedGbit: 0,
    burns: [],
  };
}

/* -------------------------------------------------------------- event lookup */

export function pendingEvent(
  runtime: SimulationRuntime,
  config: SimulationConfig,
): MissionEventDefinition | null {
  if (!runtime.pendingEventId) return null;
  const parts = resolveSpacecraft(config.spacecraft);
  const pool = eligibleEvents(config.destination, {
    solarPower: !parts.power.constantPower,
    nuclearPower: parts.power.constantPower,
  });
  return pool.find((event) => event.id === runtime.pendingEventId) ?? null;
}

/* ------------------------------------------------------------------ stepping */

function applyEffects(runtime: SimulationRuntime, effects: EventEffects): SimulationRuntime {
  const next: SimulationRuntime = { ...runtime };
  if (effects.powerMultiplier !== undefined) next.modifiers.power *= effects.powerMultiplier;
  if (effects.downlinkMultiplier !== undefined) next.modifiers.downlink *= effects.downlinkMultiplier;
  if (effects.scienceMultiplier !== undefined) next.modifiers.science *= effects.scienceMultiplier;
  if (effects.durationDays) next.modifiers.untilDay = runtime.elapsedDays + effects.durationDays;
  if (effects.healthDamage) next.health = Math.max(0, next.health - effects.healthDamage);
  if (effects.propellantLossKg) next.fuelKg = Math.max(0, next.fuelKg - effects.propellantLossKg);
  return next;
}

function sciencePerGbit(
  instruments: ReturnType<typeof resolveSpacecraft>["instruments"],
  destination: DestinationId,
): number {
  const totalRate = instruments.reduce((sum, item) => sum + (item.dataRateMbps ?? 0), 0);
  if (totalRate <= 0) return 0;
  const weighted = instruments.reduce(
    (sum, item) =>
      sum +
      (item.dataRateMbps ?? 0) *
        (item.scienceWeight ?? 1) *
        (item.affinity?.[destination] ?? 1),
    0,
  );
  return (weighted / totalRate) * SCIENCE_SCALE;
}

/** Current spacecraft mass, kg. */
function wetMass(runtime: SimulationRuntime): number {
  return (runtime.dryMassKg + runtime.fuelKg) * (1 + STRUCTURE_FACTOR);
}

/**
 * Perform one of the mission's discrete burns.
 * Returns the propellant left and whether the burn could be completed.
 */
function performBurn(
  runtime: SimulationRuntime,
  label: string,
  deltaVMs: number,
  ispSeconds: number,
): { fuelKg: number; complete: boolean; shortfallMs: number } {
  if (runtime.burns.includes(label) || deltaVMs <= 0) {
    return { fuelKg: runtime.fuelKg, complete: true, shortfallMs: 0 };
  }
  const mass = wetMass(runtime);
  const emptyMass = runtime.dryMassKg * (1 + STRUCTURE_FACTOR);
  const needed = burnPropellant(deltaVMs, mass, emptyMass, ispSeconds);
  const available = runtime.fuelKg;
  const used = Math.min(needed, available);
  const delivered = used > 0 ? ispSeconds * 9.80665 * Math.log(mass / Math.max(1e-6, mass - used)) : 0;

  return {
    fuelKg: Math.max(0, available - used),
    complete: delivered >= deltaVMs - 1,
    shortfallMs: Math.max(0, deltaVMs - delivered),
  };
}

/**
 * Advance the simulation by a fixed number of days.
 * Returns a new runtime object; the input is never mutated.
 */
export function stepSimulation(
  runtime: SimulationRuntime,
  config: SimulationConfig,
  days = SIM_STEP_DAYS,
): SimulationRuntime {
  if (runtime.completed || runtime.pendingEventId) return runtime;

  const parts = resolveSpacecraft(config.spacecraft);
  const transfer = planTransfer("earth", config.destination);
  const scienceWeight = sciencePerGbit(parts.instruments, config.destination);
  const ispSeconds = parts.propulsion.ispSeconds ?? 220;

  let current: SimulationRuntime = { ...runtime };

  for (let step = 0; step < Math.max(1, Math.round(days / SIM_STEP_DAYS)); step += 1) {
    const dt = SIM_STEP_DAYS;
    const day = current.elapsedDays;

    /* ---------------------------------------------------------- geometry */
    const cruiseFraction =
      day < 6 ? 0 : Math.min(1, (day - 6) / Math.max(1e-6, current.cruiseEndDay - 6));
    const transferPoint = transferPositionRadius(transfer, cruiseFraction);
    const heliocentricAU = day < 6 ? 1 : transferPoint.radiusM / 1.495978707e11;
    const rangeAU = Math.abs(heliocentricAU - 1);

    /* ------------------------------------------------------------ power */
    const power = evaluatePower(
      parts.power,
      parts.battery,
      parts.thermal,
      parts.comms,
      parts.instruments,
      heliocentricAU,
    );
    const generation = power.generatedW * current.modifiers.power;
    const load = power.averageLoadW;
    const netW = generation - load;

    const batteryDeltaWh = netW * dt * 24;
    let batteryWh = current.batteryWh + batteryDeltaWh;
    if (batteryWh < 0) {
      batteryWh = 0;
      current = { ...current, powerDeficitDays: current.powerDeficitDays + dt };
      // Sustained deficit damages the spacecraft.
      const damage = HEALTH_LOSS_PER_POWER_DEFICIT * dt * (Math.abs(netW) / Math.max(20, load));
      current = { ...current, health: Math.max(0, current.health - damage) };
    }
    batteryWh = Math.min(current.batteryCapacityWh, batteryWh);

    /* ------------------------------------------------------ communication */
    const communication = evaluateCommunication(parts.comms, rangeAU);
    const effectiveMbps = communication.effectiveMbps * current.modifiers.downlink;
    const linkQuality = Math.max(
      0,
      Math.min(1, effectiveMbps / Math.max(1e-9, communication.nominalMbps)),
    );

    /* ----------------------------------------------------------- thermal */
    const thermal = evaluateThermal(
      parts.thermal,
      parts.power,
      parts.propulsion,
      heliocentricAU,
      load,
      parts.propulsion.thrustN ?? 0,
    );
    if (thermal.status === "critical") {
      current = { ...current, health: Math.max(0, current.health - 1.8 * dt) };
    }

    /* -------------------------------------------------------------- data */
    const generatedGbit =
      parts.instruments.reduce((sum, item) => sum + (item.dataRateMbps ?? 0), 0) * (dt * 86400) / 1000;
    const contactSeconds = communication.contactHoursPerDay * dt * 3600;
    const downlinkGbit = (effectiveMbps * contactSeconds) / 1000;
    const available = generatedGbit + current.recorderGbit;
    const transmitted = Math.min(available, downlinkGbit);
    let recorder = available - transmitted;
    let lost = 0;
    if (recorder > current.recorderCapacityGbit) {
      lost = recorder - current.recorderCapacityGbit;
      recorder = current.recorderCapacityGbit;
    }

    const scienceGained = transmitted * scienceWeight * current.modifiers.science;

    /* ----------------------------------------------------------- science */
    const capabilities = (OBJECTIVES_BY_BODY[config.destination] ?? []).map((objective) => {
      const matched = parts.instruments.filter((instrument) =>
        (objective.instrumentCategories ?? []).includes(instrument.scienceCategory ?? ""),
      );
      const best = Math.max(
        0,
        ...matched.map(
          (instrument) =>
            (instrument.scienceWeight ?? 1) * (instrument.affinity?.[config.destination] ?? 1),
        ),
      );
      return { objective, potential: Math.min(1, best / 2.5) };
    });

    const objectives = current.objectives.map((entry) => {
      const capability = capabilities.find((item) => item.objective.id === entry.objectiveId);
      const increment = capability ? capability.potential * (scienceGained / Math.max(1, entry.reward)) : 0;
      const progress = Math.min(1, entry.progress + increment);
      return { ...entry, progress, complete: progress >= 0.85 };
    });

    /* --------------------------------------------------------- propellant */
    let fuelKg = current.fuelKg;
    const burns: string[] = current.burns;
    const burnFailures: string[] = [];

    const runBurn = (label: string, deltaVMs: number) => {
      const result = performBurn(current, label, deltaVMs, ispSeconds);
      fuelKg = result.fuelKg;
      if (!burns.includes(label)) burns.push(label);
      if (!result.complete) {
        burnFailures.push(
          `The ${label.replace(/-/g, " ")} burn could not be completed — ${(result.shortfallMs / 1000).toFixed(2)} km/s short of the required Δv.`,
        );
      }
    };

    if (day >= 0.5 && day < 1.25) {
      runBurn("orbit-insertion", current.deltaV.insertionDeltaVKms * 1000);
    }
    if (day >= 6 && day < current.cruiseEndDay) {
      // Course corrections are spread across the cruise.
      const burnFraction = dt / Math.max(1e-6, current.cruiseEndDay - 6);
      const correction = current.deltaV.courseCorrectionDeltaVKms * 1000 * burnFraction;
      if (!burns.includes("course-correction")) {
        burns.push("course-correction");
        const result = performBurn(
          { ...current, fuelKg, burns: [...burns] },
          "course-correction",
          current.deltaV.courseCorrectionDeltaVKms * 1000,
          ispSeconds,
        );
        fuelKg = result.fuelKg;
        if (!result.complete) {
          burnFailures.push(
            "The course correction could not be completed — the propellant budget was exhausted.",
          );
        }
      } else {
        fuelKg -= correction;
        fuelKg = Math.max(0, fuelKg);
      }
    }
    if (day >= current.cruiseEndDay && day < current.cruiseEndDay + 1.5) {
      runBurn("arrival-capture", current.deltaV.captureDeltaVKms * 1000);
    }
    if (day >= current.operationsEndDay - 0.5 && current.deltaV.landingDeltaVKms > 0) {
      runBurn("landing", current.deltaV.landingDeltaVKms * 1000);
    }

    const next: SimulationRuntime = {
      ...current,
      elapsedDays: day + dt,
      phase: phaseForDay({ ...current, elapsedDays: day + dt }),
      heliocentricAU,
      rangeAU,
      batteryWh,
      generatedW: generation,
      loadW: load,
      power,
      thermal,
      communication,
      commLink: linkQuality,
      thermalC: thermal.electronicsTemperatureC,
      recorderGbit: recorder,
      science: current.science + scienceGained,
      objectives,
      fuelKg,
      burns: [...burns],
      dataLostGbit: current.dataLostGbit + lost,
      dataTransmittedGbit: current.dataTransmittedGbit + transmitted,
    };

    /* ---------------------------------------------------------- sampling */
    const sample: TelemetrySample = {
      day: next.elapsedDays,
      phase: next.phase,
      batteryWh,
      batteryFraction: next.batteryCapacityWh > 0 ? batteryWh / next.batteryCapacityWh : 0,
      generatedW: generation,
      loadW: load,
      commLink: linkQuality,
      distanceAu: rangeAU,
      fuelKg,
      health: next.health,
      science: next.science,
      thermalC: next.thermalC,
    };
    next.samples = [...current.samples, sample];

    /* ---------------------------------------------------------- modifiers */
    if (next.modifiers.untilDay > 0 && next.elapsedDays >= next.modifiers.untilDay) {
      next.modifiers = { power: 1, downlink: 1, science: 1, untilDay: 0, label: "Nominal" };
    }

    current = next;

    /* ----------------------------------------------- propellant failure */
    if (burnFailures.length > 0) {
      const detail = burnFailures.join(" ");
      current = {
        ...current,
        failures: [...current.failures, { id: "propellant", title: "Insufficient propellant", detail }],
        events: [
          ...current.events,
          {
            id: `propellant-${Math.round(current.elapsedDays * 10)}`,
            day: current.elapsedDays,
            phase: current.phase,
            title: "Insufficient propellant",
            message: detail,
            severity: "danger",
          },
        ],
        completed: true,
        outcome: "failure",
        endReason: "The spacecraft ran out of propellant and could not complete its manoeuvre.",
        phase: "failed",
      };
      break;
    }

    /* ------------------------------------------------------------ events */
    const event = eventForDay(config, current, parts.power.constantPower);
    if (event) {
      current = {
        ...current,
        pendingEventId: event.id,
        events: [
          ...current.events,
          {
            id: `${event.id}-${Math.round(current.elapsedDays * 10)}`,
            day: current.elapsedDays,
            phase: current.phase,
            title: event.title,
            message: event.description,
            severity: event.severity as EventSeverity,
          },
        ],
      };
      break;
    }

    /* ------------------------------------------------------- completion */
    if (current.elapsedDays >= current.operationsEndDay) {
      current = finalise(current, config);
      break;
    }
    if (current.health <= 0) {
      current = {
        ...current,
        completed: true,
        outcome: "failure",
        endReason: "Spacecraft health reached zero. The mission could not continue.",
        phase: "failed",
        events: [
          ...current.events,
          {
            id: `failed-${Math.round(current.elapsedDays * 10)}`,
            day: current.elapsedDays,
            phase: "failed",
            title: "Mission failure",
            message: "The spacecraft was lost. Mission operations terminated.",
            severity: "danger",
          },
        ],
      };
      break;
    }
  }

  return current;
}

/** The event, if any, that should trigger at the current mission day. */
function eventForDay(
  config: SimulationConfig,
  runtime: SimulationRuntime,
  nuclearPower: boolean,
): MissionEventDefinition | null {
  const parts = resolveSpacecraft(config.spacecraft);
  const pool = eligibleEvents(config.destination, {
    solarPower: !parts.power.constantPower,
    nuclearPower,
  });

  for (const event of pool) {
    if (runtime.resolvedEventIds.includes(event.id)) continue;

    // The trigger point is a fraction of the window the event belongs to.
    let due = false;
    if (event.phase === "cruise") {
      const window = Math.max(1e-6, runtime.cruiseEndDay - 6);
      due = runtime.phase === "cruise" || runtime.phase === "course-correction";
      if (due) {
        due = (runtime.elapsedDays - 6) / window >= event.triggerFraction;
      }
    } else if (event.phase === "operations") {
      const window = Math.max(1e-6, runtime.operationsEndDay - runtime.arrivalDay);
      due = runtime.phase === "operations" || runtime.phase === "arrival";
      if (due) {
        due = (runtime.elapsedDays - runtime.arrivalDay) / window >= event.triggerFraction;
      }
    } else {
      due = runtime.elapsedDays / Math.max(1, runtime.operationsEndDay) >= event.triggerFraction;
    }

    if (!due) continue;

    // Deterministically pick an event when several are due at once.
    const roll = nextRandom(runtime.rngState);
    if (roll.value > 0.75) continue;
    return event;
  }
  return null;
}

/**
 * Resolve the pending event with the player's choice.
 * The risk roll is deterministic for a given runtime state.
 */
export function resolveEvent(
  runtime: SimulationRuntime,
  eventId: string,
  choiceId: string,
  config: SimulationConfig,
): SimulationRuntime {
  const parts = resolveSpacecraft(config.spacecraft);
  const pool = eligibleEvents(config.destination, {
    solarPower: !parts.power.constantPower,
    nuclearPower: parts.power.constantPower,
  });
  const event = pool.find((item) => item.id === eventId);
  if (!event) return { ...runtime, pendingEventId: null };

  const choice = event.choices.find((item) => item.id === choiceId) ?? event.choices[0];

  let next = applyEffects(runtime, choice.effects);
  let severity: EventSeverity = "info";
  let outcomeText = choice.outcome;

  if (choice.risk && choice.risk > 0) {
    const roll = nextRandom(next.rngState);
    next = { ...next, rngState: roll.state };
    if (roll.value < choice.risk) {
      next = applyEffects(next, choice.riskEffects ?? {});
      severity = "danger";
      outcomeText = `${choice.outcome} The roll went the other way.`;
    } else {
      severity = "success";
      outcomeText = choice.outcome;
    }
  } else {
    severity = choice.effects.healthDamage ? "warning" : "success";
  }

  const record: MissionEventRecord = {
    id: `${event.id}-${choice.id}-${Math.round(next.elapsedDays * 10)}`,
    day: next.elapsedDays,
    phase: next.phase,
    title: `${event.title} — ${choice.label}`,
    message: outcomeText,
    severity,
  };

  const failures = [...next.failures];
  const recoveries = [...next.recoveries];
  if (severity === "danger") {
    failures.push({ id: event.id, title: event.title, detail: outcomeText });
  } else {
    recoveries.push({ id: event.id, title: choice.label, detail: outcomeText });
  }

  next = {
    ...next,
    pendingEventId: null,
    resolvedEventIds: [...next.resolvedEventIds, event.id],
    events: [...next.events, record],
    failures,
    recoveries,
  };

  return next;
}

/* --------------------------------------------------------------- completion */

function finalise(runtime: SimulationRuntime, config: SimulationConfig): SimulationRuntime {
  const parts = resolveSpacecraft(config.spacecraft);
  const capabilities = (OBJECTIVES_BY_BODY[config.destination] ?? []).map((objective) => {
    const matched = parts.instruments.filter((instrument) =>
      (objective.instrumentCategories ?? []).includes(instrument.scienceCategory ?? ""),
    );
    const best = Math.max(
      0,
      ...matched.map(
        (instrument) =>
          (instrument.scienceWeight ?? 1) * (instrument.affinity?.[config.destination] ?? 1),
      ),
    );
    return { objective, potential: Math.min(1, best / 2.5) };
  });

  const objectives = runtime.objectives.map((entry) => {
    const capability = capabilities.find((item) => item.objective.id === entry.objectiveId);
    const maximum = capability?.potential ?? 0;
    return {
      ...entry,
      progress: Math.max(entry.progress, Math.min(maximum, entry.progress)),
      complete: entry.progress >= 0.85 * Math.max(0.3, maximum),
    };
  });

  const completedObjectives = objectives.filter((o) => o.complete).length;
  const scienceRatio = objectives.length > 0 ? completedObjectives / objectives.length : 0;

  let outcome: "success" | "partial" | "failure" = "success";
  let endReason = "All planned science operations completed.";

  if (runtime.health <= 0) {
    outcome = "failure";
    endReason = "The spacecraft was lost before the science window closed.";
  } else if (scienceRatio >= 0.99 && runtime.health >= 55) {
    outcome = "success";
    endReason = "Every objective was met with spacecraft health to spare.";
  } else if (scienceRatio >= 0.5) {
    outcome = "partial";
    endReason = "The mission returned useful science but did not close every objective.";
  } else {
    outcome = "failure";
    endReason = "Too few objectives were met to justify the mission.";
  }

  return {
    ...runtime,
    phase: outcome === "failure" ? "failed" : "complete",
    completed: true,
    outcome,
    endReason,
    objectives,
    events: [
      ...runtime.events,
      {
        id: `complete-${Math.round(runtime.elapsedDays * 10)}`,
        day: runtime.elapsedDays,
        phase: outcome === "failure" ? "failed" : "complete",
        title: outcome === "failure" ? "Mission failed" : "Mission complete",
        message: endReason,
        severity: outcome === "failure" ? "danger" : "success",
      },
    ],
  };
}

/** Total propellant used over the mission. */
export function propellantUsed(runtime: SimulationRuntime): number {
  return Math.max(0, runtime.fuelInitialKg - runtime.fuelKg);
}
