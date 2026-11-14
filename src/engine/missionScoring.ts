import { OBJECTIVE_COMPLETION_THRESHOLD } from "./constants";
import { evaluateSpacecraft } from "./spacecraft";
import type { SimulationRuntime, SimulationConfig } from "./simulation";
import type { MissionReport, ScoreCategory, ScoreLine } from "@/types";

/**
 * Mission scoring.
 *
 * Every ratio below is computed from the flown mission state — nothing is
 * pre-assigned. The weights follow the specification in design.md §4 I.
 *
 *   Scientific objectives  30%
 *   Engineering performance 25%
 *   Mission completion     20%
 *   Budget efficiency      15%
 *   Resource management    10%
 */

export const SCORE_WEIGHTS = {
  science: 0.3,
  engineering: 0.25,
  completion: 0.2,
  budget: 0.15,
  resources: 0.1,
} as const;

export interface ScoringInput {
  runtime: SimulationRuntime;
  config: SimulationConfig;
  budgetCapMillionUSD: number;
}

export interface ScoringResult {
  score: number;
  categories: ScoreCategory[];
  lines: ScoreLine[];
  recommendations: Array<{ title: string; detail: string }>;
}

export function scoreMission(input: ScoringInput): ScoringResult {
  const { runtime, config, budgetCapMillionUSD } = input;
  const report = evaluateSpacecraft({
    spacecraft: config.spacecraft,
    destination: config.destination,
    budgetCapMillionUSD,
    launchVehicleId: config.launchVehicleId,
  });

  /* ------------------------------------------------------ science (30%) */
  const objectiveCount = runtime.objectives.length;
  const achieved = runtime.objectives.filter((o) => o.progress >= OBJECTIVE_COMPLETION_THRESHOLD).length;
  const partialProgress =
    runtime.objectives.reduce((sum, o) => sum + Math.min(1, o.progress / OBJECTIVE_COMPLETION_THRESHOLD), 0) /
    Math.max(1, objectiveCount);
  const scienceRatio = objectiveCount > 0 ? Math.min(1, (achieved + partialProgress) / objectiveCount) : 0;

  /* ------------------------------------------------- engineering (25%) */
  // Health, power margin, thermal margin and propellant remaining.
  const powerMargin = report.power.marginPct;
  const powerScore = Math.max(0, Math.min(1, powerMargin / 40));
  const thermalScore =
    report.thermal.excessHeatW > 0
      ? 0
      : Math.max(0, Math.min(1, (report.thermal.limitC - report.thermal.radiatorTemperatureC) / 60 + 0.5));
  const fuelRatio = report.propulsion.propellantKg > 0 ? runtime.fuelKg / report.propulsion.propellantKg : 0;
  const healthScore = runtime.health / 100;
  const engineeringRatio = Math.max(
    0,
    Math.min(1, healthScore * 0.4 + powerScore * 0.25 + thermalScore * 0.2 + Math.min(1, fuelRatio) * 0.15),
  );

  /* ------------------------------------------------- completion (20%) */
  const durationRatio = Math.min(1, runtime.elapsedDays / Math.max(1, runtime.operationsEndDay));
  const completionRatio = runtime.outcome === "failure" ? durationRatio * 0.4 : durationRatio;

  /* --------------------------------------------------- budget (15%) */
  const spent = report.totalCostMillionUSD;
  const budgetRatio =
    budgetCapMillionUSD > 0 ? Math.max(0, Math.min(1, 1 - spent / budgetCapMillionUSD)) : 0;

  /* ----------------------------------------------- resources (10%) */
  const batteryRatio =
    runtime.batteryCapacityWh > 0 ? runtime.batteryWh / runtime.batteryCapacityWh : 0;
  const dataRatio =
    runtime.dataLostGbit + runtime.dataTransmittedGbit > 0
      ? runtime.dataTransmittedGbit / (runtime.dataLostGbit + runtime.dataTransmittedGbit)
      : 1;
  const resourceRatio = Math.max(
    0,
    Math.min(1, batteryRatio * 0.4 + dataRatio * 0.4 + Math.min(1, fuelRatio) * 0.2),
  );

  const categories: ScoreCategory[] = [
    {
      id: "science",
      label: "Scientific objectives",
      weight: SCORE_WEIGHTS.science,
      ratio: scienceRatio,
      detail: `${achieved} of ${objectiveCount} objectives completed.`,
    },
    {
      id: "engineering",
      label: "Engineering performance",
      weight: SCORE_WEIGHTS.engineering,
      ratio: engineeringRatio,
      detail: `Health ${runtime.health.toFixed(0)}%, power margin ${powerMargin.toFixed(0)}%, fuel ${(fuelRatio * 100).toFixed(0)}%.`,
    },
    {
      id: "completion",
      label: "Mission completion",
      weight: SCORE_WEIGHTS.completion,
      ratio: completionRatio,
      detail: `Flown ${runtime.elapsedDays.toFixed(0)} of ${runtime.operationsEndDay.toFixed(0)} planned days.`,
    },
    {
      id: "budget",
      label: "Budget efficiency",
      weight: SCORE_WEIGHTS.budget,
      ratio: budgetRatio,
      detail: `$${spent.toFixed(1)}M spent of a $${budgetCapMillionUSD}M cap.`,
    },
    {
      id: "resources",
      label: "Resource management",
      weight: SCORE_WEIGHTS.resources,
      ratio: resourceRatio,
      detail: `Battery ${(batteryRatio * 100).toFixed(0)}%, science returned ${(dataRatio * 100).toFixed(0)}% of data generated.`,
    },
  ];

  const score = Math.round(
    categories.reduce((sum, category) => sum + category.ratio * category.weight, 0) * 100,
  );

  const lines: ScoreLine[] = categories.map((category) => ({
    label: category.label,
    value: Math.round(category.ratio * category.weight * 100),
    max: Math.round(category.weight * 100),
    detail: category.detail,
  }));

  /* ----------------------------------------------------- recommendations */
  const recommendations: Array<{ title: string; detail: string }> = [];

  if (report.power.marginPct < 12) {
    recommendations.push({
      title: "Increase the power margin",
      detail:
        report.power.constantPower
          ? "The nuclear source produces too little for this payload. Trim the instrument list or move to a larger generator."
          : "The array produces too little at this heliocentric distance. Add array area, drop a high-load instrument, or use a radioisotope source.",
    });
  }
  if (report.deltaVShortfallMs > 0) {
    recommendations.push({
      title: "Close the propellant shortfall",
      detail: `The spacecraft needs ${report.deltaV.spacecraftDeltaVKms.toFixed(2)} km/s of its own and the tank provides ${(report.propulsion.remainingDeltaVMs / 1000).toFixed(2)} km/s. Fit a larger tank, or move to a higher specific impulse engine and a propellant it can use.`,
    });
  }
  if (report.massMarginPct !== null && report.massMarginPct < 8) {
    recommendations.push({
      title: "Leave more payload margin",
      detail: `Only ${report.massMarginPct.toFixed(1)}% of the estimated capacity is spare. A heavier propellant tank or a larger array would break the manifest.`,
    });
  }
  if (runtime.dataLostGbit > runtime.dataTransmittedGbit * 0.25) {
    recommendations.push({
      title: "Match the downlink to the payload",
      detail: `${runtime.dataLostGbit.toFixed(0)} Gbit was generated but never returned. A higher-rate downlink, a larger recorder, or a lower-rate payload would all help.`,
    });
  }
  if (runtime.powerDeficitDays > 2) {
    recommendations.push({
      title: "Design for the dark side of the orbit",
      detail: `The spacecraft ran a power deficit for ${runtime.powerDeficitDays.toFixed(1)} days. More array area, a deeper battery, or a lower average load would close it.`,
    });
  }
  if (runtime.failures.length > 0) {
    recommendations.push({
      title: "Build recovery margin",
      detail: `${runtime.failures.length} event${runtime.failures.length === 1 ? "" : "s"} ended badly. Redundant instruments, shielding mass or a larger power reserve all reduce the exposure.`,
    });
  }
  if (achieved < objectiveCount) {
    recommendations.push({
      title: "Match the payload to the objectives",
      detail: "Every objective that had no matching instrument was impossible to complete. Select instruments whose science category appears in the objective list.",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: "No structural changes required",
      detail:
        "The design met every objective within budget with margin on power, propellant and mass. For a more demanding profile, increase the science payload or extend the science window.",
    });
  }

  return { score, categories, lines, recommendations };
}

/** Assemble the full mission report from the flown state. */
export function buildMissionReport(
  input: ScoringInput & { budgetCapMillionUSD: number },
): MissionReport {
  const { runtime, config, budgetCapMillionUSD } = input;
  const scoring = scoreMission(input);
  const report = evaluateSpacecraft({
    spacecraft: config.spacecraft,
    destination: config.destination,
    budgetCapMillionUSD,
    launchVehicleId: config.launchVehicleId,
  });

  const scienceTarget = runtime.objectives.reduce((sum, o) => sum + o.reward, 0);
  const scienceAchieved = runtime.objectives.reduce((sum, o) => sum + o.reward * Math.min(1, o.progress), 0);

  const outcome = runtime.outcome ?? "failure";
  const outcomeTitle =
    outcome === "success"
      ? "Mission success"
      : outcome === "partial"
        ? "Partial success"
        : "Mission failure";

  return {
    missionId: config.missionId,
    missionName: config.missionName,
    destinationId: config.destination,
    destinationName: report.destinationName,
    generatedAt: Date.now(),
    outcome,
    outcomeTitle,
    outcomeSummary: runtime.endReason ?? "The mission ended without a recorded outcome.",
    score: scoring.score,
    scoreMax: 100,
    categories: scoring.categories,
    objectives: runtime.objectives,
    scienceAchieved,
    scienceTarget,
    budgetSpentMillionUSD: report.totalCostMillionUSD,
    budgetCapMillionUSD,
    budgetEfficiency: budgetCapMillionUSD > 0 ? report.totalCostMillionUSD / budgetCapMillionUSD : 0,
    massKg: report.totalMassKg,
    deltaVKms: report.deltaV.spacecraftDeltaVKms,
    fuelUsedKg: Math.max(0, runtime.fuelInitialKg - runtime.fuelKg),
    fuelRemainingKg: runtime.fuelKg,
    daysFlown: runtime.elapsedDays,
    monthsFlown: runtime.elapsedDays / 30.4375,
    events: runtime.events,
    failures: runtime.failures,
    recoveries: runtime.recoveries,
    recommendations: scoring.recommendations,
    assumptions: [
      "Heliocentric orbits are treated as circular and coplanar; inclination changes are not modelled.",
      "The transfer is a two-impulse Hohmann approximation with no gravity assist or launch-window waiting.",
      "The rocket equation is idealised: no gravity or drag losses, no throttle losses, no residuals and no staging.",
      "Solar output follows the inverse-square law; radioisotope output is constant and decays only by the component's rated life.",
      "Communication uses a free-space path-loss model with a per-system reference range; weather, pointing and geometry are not modelled.",
      "Thermal balance is steady state with a Stefan–Boltzmann radiator; transient soak and conduction paths are not modelled.",
      "Instrument duty cycles, recorder overflow and downlink scheduling are simplified gameplay parameters.",
    ],
  };
}
