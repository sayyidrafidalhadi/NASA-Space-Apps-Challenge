import type { DestinationId } from "@/types";

/**
 * Mission event catalogue.
 *
 * Events are configuration-dependent: an event only fires when the
 * spacecraft is actually exposed to it. A solar-powered mission to Jupiter
 * never sees a dust storm; a nuclear-powered one never sees a solar flare.
 *
 * Scenario wording is original to this project and is inspired by the event
 * types catalogued by NASA's Space Weather Prediction Center and the
 * Deep Space Network. No operational data is used.
 */

export type EventPhase = "cruise" | "operations" | "any";

export interface EventEffects {
  /** Multiplier applied to power generation while the event is active. */
  powerMultiplier?: number;
  /** Multiplier applied to the downlink rate while the event is active. */
  downlinkMultiplier?: number;
  /** Multiplier applied to science production while the event is active. */
  scienceMultiplier?: number;
  /** Immediate health damage, 0–100. */
  healthDamage?: number;
  /** Propellant consumed, kg. */
  propellantLossKg?: number;
  /** Duration of the event in mission days. */
  durationDays?: number;
  /** Distance the spacecraft drifts off the planned trajectory, km. */
  trajectoryErrorKm?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffects;
  /** Probability that the aggressive choice backfires, 0–1. */
  risk?: number;
  /** What happens when the risk roll fails. */
  riskEffects?: EventEffects;
  /** Text shown for the outcome. */
  outcome: string;
}

export interface MissionEventDefinition {
  id: string;
  title: string;
  description: string;
  phase: EventPhase;
  /** Position in the mission where the event can trigger, 0–1 of the flight. */
  triggerFraction: number;
  /** Destinations the event applies to. `"all"` means every destination. */
  destinations: DestinationId[] | "all";
  /** Condition that must hold for the event to be possible. */
  condition?: "solar-power" | "nuclear-power" | "deep-space" | "dusty" | "any";
  severity: "info" | "warning" | "danger";
  choices: EventChoice[];
}

export const MISSION_EVENTS: MissionEventDefinition[] = [
  {
    id: "solar-flare",
    title: "Solar energetic particle event",
    description:
      "A Class X4 flare puts a burst of high-energy particles into the solar wind. The spacecraft is in the path.",
    phase: "any",
    triggerFraction: 0.28,
    destinations: "all",
    condition: "solar-power",
    severity: "danger",
    choices: [
      {
        id: "shelter",
        label: "Shelter the payload and power down",
        description:
          "Park the instruments, close the solar array latches and ride out the event on battery.",
        effects: { powerMultiplier: 0.55, scienceMultiplier: 0.3, durationDays: 12, healthDamage: 4 },
        outcome:
          "The array is partially shadowed and the payload is dark. Science is lost, but the electronics survived the particle flux.",
      },
      {
        id: "push-through",
        label: "Keep collecting through the event",
        description: "Keep the payload running and accept the radiation dose on the electronics.",
        effects: { scienceMultiplier: 1.2, durationDays: 12 },
        risk: 0.45,
        riskEffects: { healthDamage: 22, scienceMultiplier: 0.4, powerMultiplier: 0.7 },
        outcome:
          "The event passed while the instruments kept working. The dose counters tell a different story on the far side of the panel.",
      },
    ],
  },
  {
    id: "geomagnetic-storm",
    title: "Geomagnetic storm",
    description:
      "The solar wind compresses the magnetosphere. The spacecraft's attitude control is being buffeted and the ground-station elevation is degraded.",
    phase: "any",
    triggerFraction: 0.45,
    destinations: "all",
    severity: "warning",
    choices: [
      {
        id: "hold",
        label: "Enter a safe hold and wait it out",
        description: "Halt the payload, point the high-gain antenna away and hold attitude.",
        effects: { scienceMultiplier: 0.4, downlinkMultiplier: 0.3, durationDays: 9 },
        outcome:
          "The spacecraft sat stable through the storm. Contact windows were short and irregular.",
      },
      {
        id: "work-around",
        label: "Re-plan contact windows around the storm",
        description: "Keep the payload running and re-point the antenna to the parts of Earth that are still visible.",
        effects: { downlinkMultiplier: 0.75, scienceMultiplier: 0.9, durationDays: 9 },
        risk: 0.25,
        riskEffects: { healthDamage: 8, scienceMultiplier: 0.5 },
        outcome:
          "The re-planned passes delivered most of the data. One long burn to recover an antenna pointing error cost attitude-control margin.",
      },
    ],
  },
  {
    id: "micrometeoroid",
    title: "Micrometeoroid strike",
    description:
      "A grain the size of a grain of sand perforates a radiator panel and dents a structural member.",
    phase: "any",
    triggerFraction: 0.62,
    destinations: "all",
    severity: "warning",
    choices: [
      {
        id: "seal",
        label: "Seal the breach and continue",
        description: "Shut down the affected panel, vent the section and keep the primary bus running.",
        effects: { powerMultiplier: 0.86, healthDamage: 6, durationDays: 30 },
        outcome:
          "The leak was sealed. The spacecraft lost about 14% of its generated power for the rest of the mission.",
      },
      {
        id: "repair",
        label: "Attempt an EVA-style repair",
        description: "Send the robotic arm out to cover the hole and patch the panel.",
        effects: { powerMultiplier: 1, healthDamage: 2, durationDays: 14 },
        risk: 0.5,
        riskEffects: { healthDamage: 26, powerMultiplier: 0.6 },
        outcome:
          "The repair arm reached the panel. Whether the patch held depends on how much margin the structure had left.",
      },
    ],
  },
  {
    id: "instrument-fault",
    title: "Instrument anomaly",
    description:
      "A payload reports a calibration failure and stops producing valid data. Ground cannot command a repair.",
    phase: "operations",
    triggerFraction: 0.55,
    destinations: "all",
    severity: "warning",
    choices: [
      {
        id: "standby",
        label: "Place the instrument in standby",
        description: "Stop drawing power from the failed unit and accept the data loss.",
        effects: { scienceMultiplier: 0.75, powerMultiplier: 1.05, durationDays: 21 },
        outcome:
          "The instrument went quiet. Everything else kept collecting.",
      },
      {
        id: "recalibrate",
        label: "Run an on-board recalibration sequence",
        description: "Burn the remaining calibration margin and try to recover the unit.",
        effects: { scienceMultiplier: 1, durationDays: 7 },
        risk: 0.35,
        riskEffects: { scienceMultiplier: 0.5, healthDamage: 5 },
        outcome:
          "The recalibration took the instrument offline for a week. Whether it came back clean is a coin flip.",
      },
    ],
  },
  {
    id: "thermal-stress",
    title: "Thermal excursion",
    description:
      "A radiator segment has degraded and the electronics are running hotter than the design predicted.",
    phase: "any",
    triggerFraction: 0.4,
    destinations: "all",
    condition: "any",
    severity: "danger",
    choices: [
      {
        id: "throttle",
        label: "Throttle the payload and cool down",
        description: "Cut the instrument duty cycle and let the radiator catch up.",
        effects: { powerMultiplier: 0.92, scienceMultiplier: 0.5, durationDays: 18 },
        outcome:
          "The temperature came back to nominal. The science rate did not.",
      },
      {
        id: "survive",
        label: "Run hot and push on",
        description: "Accept the elevated temperature and keep collecting.",
        effects: { scienceMultiplier: 1.1, durationDays: 18 },
        risk: 0.55,
        riskEffects: { healthDamage: 24, scienceMultiplier: 0.4 },
        outcome:
          "The spacecraft ran hot for eighteen days. The radiation-hardened parts were fine. The rest were not.",
      },
    ],
  },
  {
    id: "navigation-error",
    title: "Navigation solution divergence",
    description:
      "The star tracker and the ground-referenced ephemeris have drifted apart. The predicted arrival is now uncertain.",
    phase: "cruise",
    triggerFraction: 0.5,
    destinations: "all",
    severity: "warning",
    choices: [
      {
        id: "course-correct",
        label: "Burn for a course correction",
        description: "Spend propellant to close the error and re-point at the target.",
        effects: { propellantLossKg: 18, scienceMultiplier: 0.95, durationDays: 4 },
        outcome: "The trajectory was closed. The correction cost propellant that the mission budget had not planned for.",
      },
      {
        id: "accept",
        label: "Accept the error and continue",
        description: "Fly the planned trajectory and correct at arrival if needed.",
        effects: { scienceMultiplier: 1, durationDays: 4 },
        risk: 0.4,
        riskEffects: { propellantLossKg: 42, scienceMultiplier: 0.7 },
        outcome:
          "The error was real and it grew. Arrival will need a burn nobody budgeted for.",
      },
    ],
  },
  {
    id: "fuel-leak",
    title: "Propellant line leak",
    description:
      "The pressurisation of a propellant tank has dropped. The tank is still usable, but at a reduced flow rate.",
    phase: "cruise",
    triggerFraction: 0.35,
    destinations: "all",
    condition: "any",
    severity: "warning",
    choices: [
      {
        id: "isolate",
        label: "Isolate the tank and use the remaining propellant",
        description: "Close the manifold and plan around the loss of that tank.",
        effects: { propellantLossKg: 28, durationDays: 5 },
        outcome: "The leak was isolated. The propellant that leaked was gone, but the tank that was intact was safe.",
      },
      {
        id: "seal-patch",
        label: "Attempt to patch the line",
        description: "Vent the line down and reseat the fitting while the spacecraft is in a stable attitude.",
        effects: { durationDays: 6 },
        risk: 0.5,
        riskEffects: { propellantLossKg: 60, healthDamage: 12 },
        outcome:
          "The fitting was reseated — or was not. Either way the propellant situation is worse than it was.",
      },
    ],
  },
  {
    id: "dust-storm",
    title: "Regional dust storm",
    description:
      "A regional dust storm has raised the optical depth over the target and is choking the deposited solar array.",
    phase: "operations",
    triggerFraction: 0.6,
    destinations: ["mars", "venus", "mercury"],
    condition: "solar-power",
    severity: "warning",
    choices: [
      {
        id: "wait-out",
        label: "Wait out the storm in a safe configuration",
        description: "Park on the surface, keep the payload warm and wait for the sky to clear.",
        effects: { powerMultiplier: 0.6, scienceMultiplier: 0.35, durationDays: 40 },
        outcome: "The array recovered as soon as the dust settled. Forty days of nothing.",
      },
      {
        id: "dust-off",
        label: "Shake the array and keep working",
        description: "Run the array cleaning cycles and continue collecting through the storm.",
        effects: { powerMultiplier: 0.85, scienceMultiplier: 0.8, durationDays: 40 },
        risk: 0.4,
        riskEffects: { powerMultiplier: 0.45, scienceMultiplier: 0.3, healthDamage: 10 },
        outcome:
          "The cleaning cycles ran, but the storm was depositing faster than the array could shed it.",
      },
    ],
  },
  {
    id: "radiation-belt",
    title: "Radiation belt exposure",
    description:
      "The spacecraft is passing through a trapped particle region of the destination's magnetosphere.",
    phase: "any",
    triggerFraction: 0.7,
    destinations: ["jupiter", "saturn", "uranus", "neptune"],
    severity: "danger",
    choices: [
      {
        id: "shelter-deep",
        label: "Retreat to a lower-radiation orbit",
        description: "Use the remaining propellant to drop below the trapped radiation region.",
        effects: { propellantLossKg: 22, scienceMultiplier: 0.5, durationDays: 25 },
        outcome:
          "The spacecraft moved to a cleaner orbit. Science dropped with the radiation dose.",
      },
      {
        id: "endure",
        label: "Endure the passage behind the shielding",
        description: "Stay in the high-radiation orbit and rely on the shielding mass.",
        effects: { scienceMultiplier: 1.15, durationDays: 25 },
        risk: 0.6,
        riskEffects: { healthDamage: 30, scienceMultiplier: 0.5 },
        outcome:
          "The shielding did its job, partly. The dose counters tell a story about how much margin was left.",
      },
    ],
  },
  {
    id: "software-fault",
    title: "On-board software fault",
    description:
      "A flight software exception has left the spacecraft in a safe mode with the payload offline.",
    phase: "any",
    triggerFraction: 0.33,
    destinations: "all",
    severity: "warning",
    choices: [
      {
        id: "ground-patch",
        label: "Upload a software patch from the ground",
        description: "Use the next contact to push a fix and restart the payload.",
        effects: { scienceMultiplier: 0.8, durationDays: 11 },
        outcome: "The patch worked. The payload came back, eleven days later.",
      },
      {
        id: "restart",
        label: "Try a remote restart",
        description: "Attempt to recover the payload without a dedicated contact.",
        effects: { scienceMultiplier: 0.7, durationDays: 6 },
        risk: 0.3,
        riskEffects: { healthDamage: 14, scienceMultiplier: 0.4 },
        outcome:
          "The restart command was accepted by the wrong subsystem. Recovery took longer than expected.",
      },
    ],
  },
  {
    id: "optical-deep-space",
    title: "Optical link acquisition failure",
    description:
      "The narrow-beam optical terminal cannot lock onto the ground station. The wide-beam backup is working.",
    phase: "cruise",
    triggerFraction: 0.48,
    destinations: "all",
    condition: "any",
    severity: "warning",
    choices: [
      {
        id: "backup",
        label: "Fall back to the wide-beam transmitter",
        description: "Switch to the low-rate backup link and rebuild the science backlog later.",
        effects: { downlinkMultiplier: 0.08, scienceMultiplier: 0.5, durationDays: 14 },
        outcome: "The backup link closed at a fraction of the rate. The backlog took weeks to clear.",
      },
      {
        id: "hold-attitude",
        label: "Hold a tight attitude and wait for the pass",
        description: "Stop thrusting and let the geometry improve for the next acquisition window.",
        effects: { downlinkMultiplier: 0.6, scienceMultiplier: 0.6, durationDays: 10 },
        risk: 0.35,
        riskEffects: { downlinkMultiplier: 0.05, scienceMultiplier: 0.35, healthDamage: 6 },
        outcome:
          "The spacecraft held a precise attitude for ten days. Whether the terminal acquired is another matter.",
      },
    ],
  },
  {
    id: "ring-particle",
    title: "Ring particle impact",
    description:
      "The spacecraft is flying through a dense sheet of ring particles and the outer shielding is taking hits.",
    phase: "operations",
    triggerFraction: 0.6,
    destinations: ["saturn", "uranus", "jupiter"],
    severity: "warning",
    choices: [
      {
        id: "expedite",
        label: "Expedite the outbound traverse",
        description: "Burn to clear the ring plane as quickly as possible.",
        effects: { propellantLossKg: 14, scienceMultiplier: 0.7, durationDays: 5 },
        outcome: "The spacecraft cleared the ring plane ahead of schedule, at the cost of propellant and data.",
      },
      {
        id: "survey",
        label: "Slow down and survey the particles",
        description: "Hold the traverse and let the particle analyser work in the dense sheet.",
        effects: { scienceMultiplier: 1.2, durationDays: 12, healthDamage: 8 },
        outcome:
          "The particle data is outstanding. The shielding is not. The spacecraft limped on with a dented panel.",
      },
    ],
  },
];

export const EVENT_BY_ID: Record<string, MissionEventDefinition> = MISSION_EVENTS.reduce(
  (acc, event) => {
    acc[event.id] = event;
    return acc;
  },
  {} as Record<string, MissionEventDefinition>,
);

/**
 * Filter the catalogue down to the events that can actually occur for a given
 * destination and spacecraft configuration.
 */
export function eligibleEvents(
  destination: DestinationId,
  options: { solarPower: boolean; nuclearPower: boolean },
): MissionEventDefinition[] {
  return MISSION_EVENTS.filter((event) => {
    if (event.destinations !== "all" && !event.destinations.includes(destination)) return false;
    if (!event.condition || event.condition === "any") return true;
    if (event.condition === "solar-power") return options.solarPower;
    if (event.condition === "nuclear-power") return options.nuclearPower;
    if (event.condition === "deep-space") return true;
    if (event.condition === "dusty") return ["mars", "venus", "mercury"].includes(destination);
    return true;
  });
}
