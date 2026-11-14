import type { DestinationId, LaunchVehicle } from "@/types";

/**
 * Launch vehicle catalogue.
 *
 * PUBLISHED values (payload to LEO/GTO, height, diameter, thrust, first
 * flight, cost) come from NASA and operator published data — see the
 * `source` field on each entry and the NASA Launch Services Program fact
 * sheets.
 *
 * The per-destination payload figures are EDUCATIONAL ESTIMATES. They are
 * derived by multiplying the published LEO capacity by a destination mass
 * fraction that represents the energy class of the transfer. They are not
 * advertised vehicle capabilities and must not be used for real mission
 * planning.
 */

/**
 * Destination mass fraction applied to the published LEO capacity.
 *
 * `earth` is a near-Earth orbit mission and keeps the full fraction.
 * Everything else pays an inverse penalty that grows with transfer energy.
 */
export const DESTINATION_MASS_FRACTION: Record<DestinationId, number> = {
  earth: 1.0,
  mercury: 0.055,
  venus: 0.09,
  mars: 0.085,
  jupiter: 0.045,
  saturn: 0.035,
  uranus: 0.026,
  neptune: 0.022,
};

/** Representative delta-v class (km/s) beyond low Earth orbit for each target. */
export const DESTINATION_DELTAV_CLASS_KMS: Record<DestinationId, number> = {
  earth: 1.2,
  mercury: 5.6,
  venus: 3.6,
  mars: 4.2,
  jupiter: 6.3,
  saturn: 6.8,
  uranus: 7.1,
  neptune: 7.4,
};

export const DESTINATION_DELTAV_NOTE =
  "Delta-v class is a simplified energy budget: departure burn, cruise injection, " +
  "arrival capture and any circularisation, expressed as a single representative value.";

const VEHICLES: Array<
  Omit<LaunchVehicle, "estimatedPayloadKg">
> = [
  {
    id: "falcon9",
    name: "Falcon 9 Block 5",
    agency: "NASA LSP certified",
    provider: "SpaceX",
    published: {
      payloadLEOKg: 22800,
      payloadGTOkg: 8300,
      costMillionUSD: 67,
      costBasis: "NASA Launch Services Program commercial average per launch",
      heightM: 70,
      diameterM: 3.7,
      thrustKN: 7607,
      firstFlight: "2010 (Block 5 from 2018)",
      propulsion: "LOX / RP-1, nine Merlin 1D engines, first stage reusable",
      reusable: true,
    },
    estimationNote:
      "Educational estimate = published LEO capacity × destination mass fraction. " +
      "The mass fraction encodes the energy class of each transfer, not a published performance curve.",
    description:
      "The commercial workhorse of the launch fleet. First-stage reuse brings the price of orbital delivery down far enough that a mid-size planetary mission can fit inside a modest science budget.",
    source: "NASA Launch Services Program — Falcon 9 fact sheet",
  },
  {
    id: "newglenn",
    name: "New Glenn",
    agency: "NASA LSP certified",
    provider: "Blue Origin",
    published: {
      payloadLEOKg: 45000,
      payloadGTOkg: 14500,
      costMillionUSD: 68,
      costBasis: "Operator published commercial list price",
      heightM: 98,
      diameterM: 7.0,
      thrustKN: 5340,
      firstFlight: "2025",
      propulsion: "LOX / CH₄, seven BE-4 engines, first stage reusable",
      reusable: true,
    },
    estimationNote:
      "Educational estimate = published LEO capacity × destination mass fraction. " +
      "The mass fraction encodes the energy class of each transfer, not a published performance curve.",
    description:
      "The largest reusable launch vehicle flying today, sized for a 45-tonne LEO payload. Its heavy-lift capacity makes it a natural fit for outer-planet missions carrying a large power system.",
    source: "NASA Launch Services Program — New Glenn fact sheet",
  },
  {
    id: "vulcan",
    name: "Vulcan Centaur",
    agency: "NASA LSP certified",
    provider: "United Launch Alliance",
    published: {
      payloadLEOKg: 27200,
      payloadGTOkg: 14500,
      costMillionUSD: 107,
      costBasis: "Operator published mission rate",
      heightM: 62.2,
      diameterM: 5.4,
      thrustKN: 5100,
      firstFlight: "2021",
      propulsion: "LOX / CH₄, two BE-4 engines, optional solid rocket boosters",
      reusable: false,
    },
    estimationNote:
      "Educational estimate = published LEO capacity × destination mass fraction. " +
      "The mass fraction encodes the energy class of each transfer, not a published performance curve.",
    description:
      "A high-energy expendable launcher with a wide 5.4 m fairing. Strong certified availability, but a middling price-to-capability ratio compared with the newest commercial vehicles.",
    source: "NASA Launch Services Program — Vulcan Centaur fact sheet",
  },
  {
    id: "ariane5",
    name: "Ariane 5 ECA",
    agency: "ESA / NASA LSP",
    provider: "Arianespace",
    published: {
      payloadLEOKg: 20000,
      payloadGTOkg: 9000,
      costMillionUSD: 160,
      costBasis: "ESA published launch price, converted at 1 USD = 0.9 EUR",
      heightM: 53.3,
      diameterM: 5.4,
      thrustKN: 11400,
      firstFlight: "1996 (ECA variant from 2002)",
      propulsion: "LOX / LH₂ cryogenic upper stage with two solid boosters",
      reusable: false,
    },
    estimationNote:
      "Educational estimate = published LEO capacity × destination mass fraction. " +
      "The mass fraction encodes the energy class of each transfer, not a published performance curve.",
    description:
      "Europe's flagship heavy launcher, and still the most flown vehicle in history. The expendable cryogenic upper stage gives reliable deep-space performance for planetary missions.",
    source: "ESA / NASA Launch Services Program — Ariane 5 fact sheet",
  },
  {
    id: "deltaiv",
    name: "Delta IV Heavy",
    agency: "NASA LSP certified",
    provider: "United Launch Alliance",
    published: {
      payloadLEOKg: 28370,
      payloadGTOkg: 14220,
      costMillionUSD: 350,
      costBasis: "NASA Launch Services Program published per-launch cost",
      heightM: 72,
      diameterM: 3.4,
      thrustKN: 10380,
      firstFlight: "2004",
      propulsion: "LOX / RP-1, one RS-27 core plus three strap-on solid boosters",
      reusable: false,
    },
    estimationNote:
      "Educational estimate = published LEO capacity × destination mass fraction. " +
      "The mass fraction encodes the energy class of each transfer, not a published performance curve.",
    description:
      "A three-core heavy launcher built for the National Security Space Launch mission class. Its sheer capacity is excellent for outer planets, but the price tag usually rules it out for a science-only mission.",
    source: "NASA Launch Services Program — Delta IV Heavy fact sheet",
  },
  {
    id: "sls",
    name: "NASA SLS Block 1",
    agency: "NASA Artemis",
    provider: "NASA / Boeing / Northrop Grumman",
    published: {
      payloadLEOKg: 27000,
      payloadGTOkg: 0,
      costMillionUSD: 4200,
      costBasis: "NASA Office of Inspector General launch cost estimate, development amortised",
      heightM: 98,
      diameterM: 8.8,
      thrustKN: 39600,
      firstFlight: "2022",
      propulsion: "LOX / LH₂ RS-25 engines with two five-segment solid boosters",
      reusable: false,
    },
    estimationNote:
      "Educational estimate = published LEO capacity × destination mass fraction. " +
      "The mass fraction encodes the energy class of each transfer, not a published performance curve.",
    description:
      "NASA's human-rated heavy lift system. Capacity is not the problem — cost is. The per-launch figure above includes the amortised development cost reported by NASA's Inspector General, so it alone can consume an entire planetary budget.",
    source: "NASA Office of Inspector General report on Artemis launch cost (2022)",
  },
];

export const LAUNCH_VEHICLES: LaunchVehicle[] = VEHICLES.map((vehicle) => {
  const estimatedPayloadKg: Partial<Record<DestinationId, number>> = {};
  for (const [body, fraction] of Object.entries(DESTINATION_MASS_FRACTION) as Array<[DestinationId, number]>) {
    estimatedPayloadKg[body] = Math.round(vehicle.published.payloadLEOKg * fraction);
  }
  return { ...vehicle, estimatedPayloadKg };
});

export const LAUNCH_VEHICLE_BY_ID: Record<string, LaunchVehicle> = LAUNCH_VEHICLES.reduce(
  (acc, vehicle) => {
    acc[vehicle.id] = vehicle;
    return acc;
  },
  {} as Record<string, LaunchVehicle>,
);

export function getLaunchVehicle(id: string | null): LaunchVehicle | null {
  if (!id) return null;
  return LAUNCH_VEHICLE_BY_ID[id] ?? null;
}
