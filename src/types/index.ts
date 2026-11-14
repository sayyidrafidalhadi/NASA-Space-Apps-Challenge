/**
 * MISSIONFORGE — shared domain types.
 *
 * Every physical quantity carries its unit in the property name. The engine
 * works in SI (kg, m, s, W, J, K) and never mixes in the visual scene scale
 * used by the 3D views.
 */

/* ------------------------------------------------------------------ solar system */

export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

/** A body that can be the destination of a mission (everything but the Sun). */
export type DestinationId = Exclude<BodyId, "sun">;

export type BodyType = "star" | "terrestrial" | "gas giant" | "ice giant";

export interface Planet {
  id: BodyId;
  name: string;
  designation: string;
  type: BodyType;
  /** Order from the Sun, 0 for the Sun itself. */
  order: number;
  radiusKm: number;
  massKg: number;
  /** Semi-major axis of the heliocentric orbit, in astronomical units. */
  semiMajorAxisAU: number;
  eccentricity: number;
  inclinationDeg: number;
  orbitalPeriodDays: number;
  rotationPeriodHours: number;
  axialTiltDeg: number;
  /** Mean surface / cloud-top temperature in °C. */
  meanSurfaceTempC: number;
  surfaceGravityMS2: number;
  escapeVelocityKms: number;
  /** Total solar irradiance at the body, W/m². */
  solarIrradianceWm2: number;
  /** Solar constant at the body's orbit relative to Earth's 1361 W/m². */
  solarConstantRelative: number;
  /** Bond albedo, 0–1. */
  albedo: number;
  moons: number;
  atmosphere: string;
  color: string;
  accent: string;
  /** Base colour used by the procedural 3D material. */
  surfaceColor: number;
  atmosphereColor: number;
  hasRings: boolean;
  description: string;
  facts: Array<{ label: string; value: string }>;
  scienceObjectives: string[];
  /** Environmental hazard indices, 0–100. Educational severity ratings. */
  hazard: { radiation: number; thermal: number; dust: number };
  sourceNote: string;
}

/* ------------------------------------------------------------------- launch vehicles */

export interface LaunchVehiclePublished {
  /** Payload to low Earth orbit, kg — published figure. */
  payloadLEOKg: number;
  /** Payload to geostationary transfer orbit, kg — published figure. */
  payloadGTOkg: number;
  costMillionUSD: number;
  costBasis: string;
  heightM: number;
  diameterM: number;
  thrustKN: number;
  firstFlight: string;
  propulsion: string;
  reusable: boolean;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  agency: string;
  provider: string;
  published: LaunchVehiclePublished;
  /**
   * Educational estimate of the usable payload mass when delivered on a
   * trans-planetary trajectory to each destination. Derived from the published
   * LEO figure and a destination-specific delta-v class — not an advertised
   * capability.
   */
  estimatedPayloadKg: Partial<Record<DestinationId, number>>;
  estimationNote: string;
  description: string;
  source: string;
}

/* -------------------------------------------------------------- spacecraft components */

export type ComponentCategory =
  | "bus"
  | "power"
  | "thermal"
  | "propulsion"
  | "fuel"
  | "comms"
  | "battery"
  | "instrument";

export interface ComponentSpec {
  id: string;
  category: ComponentCategory;
  name: string;
  shortName: string;
  massKg: number;
  costMillionUSD: number;
  /**
   * Electrical generation (W) for power sources, measured at 1 AU for solar
   * arrays and constant for radioisotope sources.
   */
  powerGenerationW: number;
  /** Average electrical load (W) for every other subsystem. */
  powerLoadW: number;
  /** True when the source output does not depend on solar distance. */
  constantPower: boolean;
  /** Chemical or electric propulsion specific impulse, seconds. */
  ispSeconds?: number;
  /** Propellant capacity, kg. */
  propellantCapacityKg?: number;
  /** Dry mass of the propulsion system, kg. */
  propulsionDryMassKg?: number;
  /** Thrust, newtons. */
  thrustN?: number;
  /** Battery energy storage, watt-hours. */
  capacityWh?: number;
  /** Instrument data rate, megabits per second. */
  dataRateMbps?: number;
  /**
   * Heliocentric distance (AU) at which a communication system delivers its
   * quoted downlink rate. Systems quoted at 1 AU are short-range; systems
   * quoted beyond 1 AU are sized for deep space.
   */
  referenceDistanceAU?: number;
  /** Relative scientific value per bit for this instrument (1 = baseline). */
  scienceWeight?: number;
  /** Instrument science discipline. */
  scienceCategory?: string;
  /** Destination affinity multipliers, 1 = neutral. */
  affinity?: Partial<Record<DestinationId, number>>;
  /** Radiative/thermal protection ratings, 0–100. */
  radiationShielding?: number;
  thermalControl?: number;
  /** Radiator area, m². */
  radiatorAreaM2?: number;
  description: string;
  specs: Array<{ label: string; value: string }>;
  constraints: string[];
  compatibility: string[];
  source: string;
}

export interface SpacecraftConfig {
  busId: string;
  powerId: string;
  thermalId: string;
  propulsionId: string;
  fuelId: string;
  commsId: string;
  batteryId: string;
  instrumentIds: string[];
}

/* ------------------------------------------------------------------------ mission */

export type MissionStatus = "draft" | "configured" | "launched" | "complete" | "failed";

export interface MissionConfig {
  id: string;
  name: string;
  destinationId: DestinationId;
  objectiveIds: string[];
  durationMonths: number;
  budgetMillionUSD: number;
  launchVehicleId: string | null;
  status: MissionStatus;
  createdAt: number;
  updatedAt: number;
}

export type ObjectiveCategory = "surface" | "atmosphere" | "interior" | "magnetosphere" | "rings" | "moons" | "flyby";

export interface MissionObjective {
  id: string;
  bodyId: DestinationId;
  title: string;
  description: string;
  category: ObjectiveCategory;
  /** Science points awarded when the objective is completed. */
  reward: number;
  /** Instrument categories that advance this objective. */
  instrumentCategories: string[];
  difficulty: "simple" | "moderate" | "complex" | "hard" | "extreme";
}

/* -------------------------------------------------------------------- simulation */

export type SimulationPhase =
  | "idle"
  | "pre-launch"
  | "launch"
  | "orbital-insertion"
  | "deployment"
  | "cruise"
  | "course-correction"
  | "arrival"
  | "operations"
  | "complete"
  | "failed";

export type EventSeverity = "info" | "success" | "warning" | "danger";

export interface MissionEventRecord {
  id: string;
  day: number;
  phase: SimulationPhase;
  title: string;
  message: string;
  severity: EventSeverity;
}

export interface ObjectiveProgress {
  objectiveId: string;
  title: string;
  reward: number;
  progress: number;
  complete: boolean;
}

export interface TelemetrySample {
  day: number;
  phase: SimulationPhase;
  batteryWh: number;
  batteryFraction: number;
  generatedW: number;
  loadW: number;
  commLink: number;
  distanceAu: number;
  fuelKg: number;
  health: number;
  science: number;
  thermalC: number;
}

export interface SimulationSnapshot {
  phase: SimulationPhase;
  elapsedDays: number;
  elapsedMonths: number;
  running: boolean;
  speed: number;
  samples: TelemetrySample[];
  events: MissionEventRecord[];
  objectives: ObjectiveProgress[];
  health: number;
  science: number;
  fuelKg: number;
  batteryWh: number;
  distanceAu: number;
  commLink: number;
  thermalC: number;
  failures: Array<{ id: string; title: string; detail: string }>;
  recoveries: Array<{ id: string; title: string; detail: string }>;
  completed: boolean;
  outcome: "success" | "partial" | "failure" | null;
  endReason: string | null;
  seed: number;
}

/* --------------------------------------------------------------------- scoring */

export interface ScoreCategory {
  id: string;
  label: string;
  weight: number;
  /** 0–1 normalised performance for this category. */
  ratio: number;
  detail: string;
}

export interface ScoreLine {
  label: string;
  value: number;
  max: number;
  detail: string;
}

export interface MissionReport {
  missionId: string;
  missionName: string;
  destinationId: DestinationId;
  destinationName: string;
  generatedAt: number;
  outcome: "success" | "partial" | "failure";
  outcomeTitle: string;
  outcomeSummary: string;
  score: number;
  scoreMax: number;
  categories: ScoreCategory[];
  objectives: ObjectiveProgress[];
  scienceAchieved: number;
  scienceTarget: number;
  budgetSpentMillionUSD: number;
  budgetCapMillionUSD: number;
  budgetEfficiency: number;
  massKg: number;
  deltaVKms: number;
  fuelUsedKg: number;
  fuelRemainingKg: number;
  daysFlown: number;
  monthsFlown: number;
  events: MissionEventRecord[];
  failures: Array<{ id: string; title: string; detail: string }>;
  recoveries: Array<{ id: string; title: string; detail: string }>;
  recommendations: Array<{ title: string; detail: string }>;
  assumptions: string[];
}

/* ------------------------------------------------------------------- settings */

export type GraphicsQuality = "low" | "medium" | "high";

export interface AppSettings {
  graphicsQuality: GraphicsQuality;
  showOrbits: boolean;
  showLabels: boolean;
  showScaleNotice: boolean;
  educationMode: "guided" | "advanced";
  soundEnabled: boolean;
  reduceMotion: boolean;
}

/* ------------------------------------------------------------------ utilities */

export interface SourceCitation {
  name: string;
  shortName: string;
  description: string;
  url: string;
  usedFor: string;
}
