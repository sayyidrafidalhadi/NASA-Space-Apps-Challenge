import type { DestinationId, MissionObjective, ObjectiveCategory } from "@/types";

/**
 * Mission objectives.
 *
 * Each destination carries three objectives. An objective advances when the
 * spacecraft is carrying an instrument whose science category matches, scaled
 * by the instrument's affinity for that destination. Objective rewards are
 * gameplay values that express relative scientific value.
 */

export interface DestinationProfile {
  bodyId: DestinationId;
  budgetMillionUSD: number;
  recommendedDurationMonths: number;
  minDurationMonths: number;
  maxDurationMonths: number;
  difficulty: "moderate" | "hard" | "extreme";
  launchNote: string;
  brief: string;
}

export const DESTINATION_PROFILES: Record<DestinationId, DestinationProfile> = {
  mercury: {
    bodyId: "mercury",
    budgetMillionUSD: 1100,
    recommendedDurationMonths: 18,
    minDurationMonths: 12,
    maxDurationMonths: 36,
    difficulty: "hard",
    launchNote:
      "Mercury sits inside the solar flux envelope and swings 47° off the ecliptic. A solar-powered craft must survive 176-day nights.",
    brief:
      "A small, dense, airless world locked in a 3:2 resonance with the Sun. Reaching it demands a high-energy transfer and punishing thermal design.",
  },
  venus: {
    bodyId: "venus",
    budgetMillionUSD: 1300,
    recommendedDurationMonths: 20,
    minDurationMonths: 12,
    maxDurationMonths: 40,
    difficulty: "hard",
    launchNote:
      "Venus requires an atmospheric entry or a long-lived balloon platform. The surface is at 464 °C and 92 bar.",
    brief:
      "Earth's twin by size and nothing else. A runaway greenhouse beneath permanent cloud, and the most hostile surface in the solar system.",
  },
  earth: {
    bodyId: "earth",
    budgetMillionUSD: 900,
    recommendedDurationMonths: 12,
    minDurationMonths: 6,
    maxDurationMonths: 24,
    difficulty: "moderate",
    launchNote:
      "An Earth-orbit or Earth-return mission. Low energy, low cost, and the ideal place to learn the toolchain.",
    brief:
      "The home world. A magnetosphere mission here is the cheapest way to see how every subsystem behaves on a real flight.",
  },
  mars: {
    bodyId: "mars",
    budgetMillionUSD: 2000,
    recommendedDurationMonths: 30,
    minDurationMonths: 18,
    maxDurationMonths: 54,
    difficulty: "moderate",
    launchNote:
      "A 26-month class transfer that arrives at 43% of Earth's solar flux. Solar arrays still work; dust and storms do not forgive thin margins.",
    brief:
      "A cold desert with a thin atmosphere, seasonal dust storms and a geology that argues for ancient water — and ancient life.",
  },
  jupiter: {
    bodyId: "jupiter",
    budgetMillionUSD: 3400,
    recommendedDurationMonths: 48,
    minDurationMonths: 30,
    maxDurationMonths: 72,
    difficulty: "extreme",
    launchNote:
      "Only 5.1% of Earth's sunlight reaches Jupiter. A solar array is a rounding error — this mission needs a radioisotope source and heavy shielding.",
    brief:
      "The largest planet, the strongest magnetosphere, the most intense radiation environment. And the most scientifically spectacular destination in the catalogue.",
  },
  saturn: {
    bodyId: "saturn",
    budgetMillionUSD: 4000,
    recommendedDurationMonths: 54,
    minDurationMonths: 36,
    maxDurationMonths: 84,
    difficulty: "extreme",
    launchNote:
      "Saturn receives 1.1% of Earth's sunlight. The ring system and the Enceladus plume are the science, and the power budget is the problem.",
    brief:
      "An enormous ring system, a moon with a subsurface ocean venting into space, and a ring plane made of billions of particles of ice.",
  },
  uranus: {
    bodyId: "uranus",
    budgetMillionUSD: 5000,
    recommendedDurationMonths: 60,
    minDurationMonths: 42,
    maxDurationMonths: 90,
    difficulty: "extreme",
    launchNote:
      "Uranus receives 0.33% of Earth's sunlight — 3 W from a 260 W array. Only a nuclear source can carry a real payload here.",
    brief:
      "An ice giant on its side, with a 42-year seasonal cycle and a magnetic field that is both tilted and offset from the centre of the planet.",
  },
  neptune: {
    bodyId: "neptune",
    budgetMillionUSD: 6000,
    recommendedDurationMonths: 66,
    minDurationMonths: 48,
    maxDurationMonths: 96,
    difficulty: "extreme",
    launchNote:
      "Neptune receives 0.1% of Earth's sunlight. A 1400 W array produces 1.4 W there. This is a nuclear mission and nothing else.",
    brief:
      "The outermost planet, the fastest winds in the solar system, and a faint ring system barely visible from Earth.",
  },
};

const OBJECTIVE_LIST: MissionObjective[] = [
  /* ---------------------------------------------------------------- Mercury */
  {
    id: "mercury-shadow",
    bodyId: "mercury",
    title: "Map permanently shadowed polar deposits",
    description:
      "Use radar to sound the ice trapped in craters that have not seen sunlight for billions of years, and bound the volatiles available for a future landed mission.",
    category: "surface",
    reward: 120,
    instrumentCategories: ["Subsurface", "Topography", "Remote Sensing"],
    difficulty: "complex",
  },
  {
    id: "mercury-exosphere",
    bodyId: "mercury",
    title: "Characterise the surface exosphere",
    description:
      "Measure the species, density and velocity distribution of Mercury's tenuous exosphere, which is replenished by the solar wind and by micrometeoroid impact.",
    category: "atmosphere",
    reward: 100,
    instrumentCategories: ["Particles", "Composition", "Composition"],
    difficulty: "moderate",
  },
  {
    id: "mercury-interior",
    bodyId: "mercury",
    title: "Resolve the oversized iron core",
    description:
      "Use gravity and magnetic field measurements to constrain the radius of a core that occupies more than half of Mercury's volume — a planet with an outsized iron heart.",
    category: "interior",
    reward: 110,
    instrumentCategories: ["Geodesy", "Fields"],
    difficulty: "complex",
  },

  /* ------------------------------------------------------------------ Venus */
  {
    id: "venus-atmos",
    bodyId: "venus",
    title: "Profile the cloud deck composition",
    description:
      "Sample the sulphuric acid cloud deck and the layers below it to determine how water and carbon dioxide are distributed through the atmosphere.",
    category: "atmosphere",
    reward: 130,
    instrumentCategories: ["Composition", "Atmosphere", "Particles"],
    difficulty: "complex",
  },
  {
    id: "venus-surface",
    bodyId: "venus",
    title: "Image the surface through the cloud windows",
    description:
      "Use near-infrared and radar to map the volcanic plains and the tessera highlands, and to identify active volcanism.",
    category: "surface",
    reward: 110,
    instrumentCategories: ["Remote Sensing", "Subsurface", "Topography"],
    difficulty: "moderate",
  },
  {
    id: "venus-interior",
    bodyId: "venus",
    title: "Constrain the volcanic and tectonic history",
    description:
      "Establish the gravity field to distinguish a layered planet from one with a single plate, a question that has been open for four decades.",
    category: "interior",
    reward: 100,
    instrumentCategories: ["Geodesy", "Thermal"],
    difficulty: "moderate",
  },

  /* ------------------------------------------------------------------ Earth */
  {
    id: "earth-magnetosphere",
    bodyId: "earth",
    title: "Image the auroral oval and the radiation belts",
    description:
      "Characterise how solar wind energy is funnelled into the polar ionosphere, and measure the trapped particle population that every other mission has to survive.",
    category: "magnetosphere",
    reward: 130,
    instrumentCategories: ["Particles", "Fields", "Remote Sensing"],
    difficulty: "moderate",
  },
  {
    id: "earth-geodesy",
    bodyId: "earth",
    title: "Establish a geodetic baseline",
    description:
      "Measure the gravity field and the sea level trend with enough precision to set the reference against which other planetary geodesy will be judged.",
    category: "interior",
    reward: 100,
    instrumentCategories: ["Geodesy", "Fields"],
    difficulty: "simple",
  },
  {
    id: "earth-atmos",
    bodyId: "earth",
    title: "Track the composition of the upper atmosphere",
    description:
      "Monitor the thermosphere and the ozone layer for trace constituents, and quantify the human-driven trend in the carbon budget.",
    category: "atmosphere",
    reward: 110,
    instrumentCategories: ["Atmosphere", "Composition", "Thermal"],
    difficulty: "moderate",
  },

  /* ------------------------------------------------------------------- Mars */
  {
    id: "mars-delta",
    bodyId: "mars",
    title: "Explore the Jezero delta and its lake sediments",
    description:
      "Image and drill the fine-grained deltaic clays, where organic chemistry and ancient water are most likely to have been preserved together.",
    category: "surface",
    reward: 150,
    instrumentCategories: ["In-situ", "Remote Sensing", "Subsurface", "Topography"],
    difficulty: "complex",
  },
  {
    id: "mars-atmos",
    bodyId: "mars",
    title: "Characterise the seasonal CO₂ cycle and dust",
    description:
      "Quantify how the seasonal carbon-dioxide caps and the global dust storms move through the thin atmosphere.",
    category: "atmosphere",
    reward: 110,
    instrumentCategories: ["Particles", "Composition", "Thermal", "Atmosphere"],
    difficulty: "moderate",
  },
  {
    id: "mars-cryosphere",
    bodyId: "mars",
    title: "Sound the subsurface ice and the mid-latitude mantle",
    description:
      "Use radar to map the latitude-dependent deposits that record the planet's climate history, and gravity to find the boundary between crust and mantle.",
    category: "interior",
    reward: 130,
    instrumentCategories: ["Subsurface", "Geodesy", "Fields"],
    difficulty: "complex",
  },

  /* ---------------------------------------------------------------- Jupiter */
  {
    id: "jupiter-atmos",
    bodyId: "jupiter",
    title: "Resolve the deep atmospheric water and ammonia features",
    description:
      "Map the plumes and the vortex shear at the cloud tops, and search for the ammonia clouds that mark the deepest accessible weather layer.",
    category: "atmosphere",
    reward: 160,
    instrumentCategories: ["Atmosphere", "Composition", "Remote Sensing", "Thermal"],
    difficulty: "complex",
  },
  {
    id: "jupiter-magnetosphere",
    bodyId: "jupiter",
    title: "Characterise the trapped radiation population",
    description:
      "Measure the flux and spectrum of the energetic particles that make the Jovian environment the most hazardous in the solar system.",
    category: "magnetosphere",
    reward: 150,
    instrumentCategories: ["Particles", "Fields"],
    difficulty: "extreme",
  },
  {
    id: "jupiter-moons",
    bodyId: "jupiter",
    title: "Survey the Galilean satellite system",
    description:
      "Characterise Europa's ice shell, Ganymede's magnetic field and Callisto's ancient surface from close orbit.",
    category: "moons",
    reward: 170,
    instrumentCategories: ["Subsurface", "Remote Sensing", "Topography", "Geodesy"],
    difficulty: "complex",
  },

  /* ----------------------------------------------------------------- Saturn */
  {
    id: "saturn-rings",
    bodyId: "saturn",
    title: "Sample the rings and measure the opacity",
    description:
      "Fly the ring plane to determine the size distribution and composition of the particles, and how the rings are fed and cleared.",
    category: "rings",
    reward: 170,
    instrumentCategories: ["Particles", "Composition", "Remote Sensing", "Topography"],
    difficulty: "complex",
  },
  {
    id: "saturn-atmos",
    bodyId: "saturn",
    title: "Characterise the polar vortex and the stratospheric haze",
    description:
      "Measure the hexagon at the north pole and the aerosols that give Saturn its pale, hazy appearance.",
    category: "atmosphere",
    reward: 140,
    instrumentCategories: ["Atmosphere", "Thermal", "Composition"],
    difficulty: "complex",
  },
  {
    id: "saturn-enceladus",
    bodyId: "saturn",
    title: "Sample the Enceladus plume ocean",
    description:
      "Fly through the water-ice jet erupting from the south pole of Enceladus and search the grains for salts and organics from the subsurface ocean.",
    category: "moons",
    reward: 190,
    instrumentCategories: ["Composition", "Particles", "Subsurface", "Geodesy"],
    difficulty: "extreme",
  },

  /* ----------------------------------------------------------------- Uranus */
  {
    id: "uranus-atmos",
    bodyId: "uranus",
    title: "Probe the methane-absorbing upper atmosphere",
    description:
      "Measure the vertical structure of the methane haze and the temperature inversion that makes the disc so featureless from Earth.",
    category: "atmosphere",
    reward: 150,
    instrumentCategories: ["Atmosphere", "Composition", "Thermal"],
    difficulty: "complex",
  },
  {
    id: "uranus-magnetosphere",
    bodyId: "uranus",
    title: "Resolve the tilted and offset magnetosphere",
    description:
      "Characterise a magnetic field whose dipole axis is tilted 59° from the rotation axis and displaced 0.3 planetary radii from the centre — unique in the solar system.",
    category: "magnetosphere",
    reward: 160,
    instrumentCategories: ["Particles", "Fields"],
    difficulty: "extreme",
  },
  {
    id: "uranus-rings",
    bodyId: "uranus",
    title: "Image the narrow dark ring system",
    description:
      "Resolve the 13 narrow rings and the sheet of dust that feeds them, most of which are too faint to see from Earth.",
    category: "rings",
    reward: 130,
    instrumentCategories: ["Remote Sensing", "Particles", "Topography"],
    difficulty: "hard",
  },

  /* ---------------------------------------------------------------- Neptune */
  {
    id: "neptune-storms",
    bodyId: "neptune",
    title: "Characterise the supersonic methane storms",
    description:
      "Track the great dark vortices and the high-speed methane jets that move faster than the sound speed of the atmosphere.",
    category: "atmosphere",
    reward: 170,
    instrumentCategories: ["Atmosphere", "Thermal", "Remote Sensing", "Composition"],
    difficulty: "complex",
  },
  {
    id: "neptune-interior",
    bodyId: "neptune",
    title: "Constrain the water–ammonia interior",
    description:
      "Use the gravity and magnetic field to distinguish a rocky core from the superionic fluid mantle hypothesised for the ice giants.",
    category: "interior",
    reward: 160,
    instrumentCategories: ["Geodesy", "Fields"],
    difficulty: "extreme",
  },
  {
    id: "neptune-triton",
    bodyId: "neptune",
    title: "Image Triton and the Neptunian rings",
    description:
      "Survey the captured Kuiper belt moon with its nitrogen geysers, and the faint ring arcs that share Triton's orbit.",
    category: "moons",
    reward: 150,
    instrumentCategories: ["Remote Sensing", "Topography", "Particles", "Thermal"],
    difficulty: "extreme",
  },
];

export const MISSION_OBJECTIVES: MissionObjective[] = OBJECTIVE_LIST;

export const OBJECTIVES_BY_BODY: Record<DestinationId, MissionObjective[]> = OBJECTIVE_LIST.reduce(
  (acc, objective) => {
    (acc[objective.bodyId] ??= []).push(objective);
    return acc;
  },
  {} as Record<DestinationId, MissionObjective[]>,
);

export const OBJECTIVE_BY_ID: Record<string, MissionObjective> = OBJECTIVE_LIST.reduce(
  (acc, objective) => {
    acc[objective.id] = objective;
    return acc;
  },
  {} as Record<string, MissionObjective>,
);

export function objectivesFor(bodyId: DestinationId): MissionObjective[] {
  return OBJECTIVES_BY_BODY[bodyId] ?? [];
}

export const OBJECTIVE_CATEGORY_LABELS: Record<ObjectiveCategory, string> = {
  surface: "Surface Science",
  atmosphere: "Atmospheric Science",
  interior: "Interior & Structure",
  magnetosphere: "Magnetosphere",
  rings: "Ring System",
  moons: "Satellite Survey",
  flyby: "Close Flyby",
};
