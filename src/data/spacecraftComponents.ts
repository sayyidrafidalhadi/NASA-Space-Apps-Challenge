import type { ComponentCategory, ComponentSpec, DestinationId } from "@/types";

/**
 * Spacecraft component catalogue.
 *
 * Masses and costs are EDUCATIONAL GAMEPLAY VALUES scaled from published
 * subsystem heritage (NASA/ESA flight hardware) to a common currency of
 * millions of USD. They are internally consistent and reproduce the real
 * direction of every trade-off, but they are not procurement prices.
 *
 * Electrical quantities are in watts. Solar arrays quote their output at 1 AU
 * and are scaled by the inverse square of heliocentric distance elsewhere;
 * radioisotope sources quote a constant output.
 */

function make(
  spec: Omit<
    ComponentSpec,
    "powerGenerationW" | "powerLoadW" | "constantPower" | "compatibility" | "constraints"
  > &
    Partial<Pick<ComponentSpec, "powerGenerationW" | "powerLoadW" | "constantPower" | "compatibility" | "constraints">>,
): ComponentSpec {
  return {
    powerGenerationW: 0,
    powerLoadW: 0,
    constantPower: false,
    compatibility: [],
    constraints: [],
    ...spec,
  };
}

/* ------------------------------------------------------------------- buses */

export const BUS_COMPONENTS: ComponentSpec[] = [
  make({
    id: "bus-cube",
    category: "bus",
    name: "CubeSat-Class Minibus",
    shortName: "Minibus",
    massKg: 14,
    costMillionUSD: 28,
    powerLoadW: 9,
    description:
      "A compact primary structure with integrated avionics and reaction wheels. Efficient per kilogram, but there is no internal volume for a large payload or tank.",
    specs: [
      { label: "Primary structure", value: "Aluminium honeycomb" },
      { label: "Attitude control", value: "4 × reaction wheel" },
      { label: "Onboard memory", value: "8 Gb rad-hard" },
    ],
    constraints: ["Limited internal volume", "No room for a propulsion system larger than 2 kg"],
    compatibility: ["Any power system", "Single instrument"],
    source: "Educational value scaled from CubeSat-class flight hardware",
  }),
  make({
    id: "bus-monoblock",
    category: "bus",
    name: "Monoblock Avionics Bus",
    shortName: "Monoblock",
    massKg: 48,
    costMillionUSD: 84,
    powerLoadW: 14,
    description:
      "A single-cast primary structure with the avionics deck bonded on top. The default choice for a planetary lander or orbiter of moderate size.",
    specs: [
      { label: "Structure", value: "Isogrid aluminium" },
      { label: "Attitude control", value: "4 × reaction wheel + star tracker" },
      { label: "Command", value: "Dual-redundant flight computer" },
    ],
    constraints: ["Cannot host more than two instruments"],
    compatibility: ["Any power system", "Any propulsion system"],
    source: "Educational value scaled from planetary orbiter buses",
  }),
  make({
    id: "bus-heritage",
    category: "bus",
    name: "Heritage Three-Axis Bus",
    shortName: "Heritage",
    massKg: 128,
    costMillionUSD: 190,
    powerLoadW: 24,
    description:
      "A long-heritage three-axis stabilised bus with a propellant tank in every corner and a clean payload deck. Designed for multi-year planetary cruise.",
    specs: [
      { label: "Structure", value: "Machined aluminium + composite" },
      { label: "Attitude control", value: "4 × reaction wheel, 0.02° pointing" },
      { label: "Thermal", value: "8-zone radiator loop" },
    ],
    constraints: ["Requires a thermal system with at least 30 m² of radiator area"],
    compatibility: ["Any power system", "Any propulsion system"],
    source: "Educational value scaled from multi-year planetary cruise buses",
  }),
  make({
    id: "bus-flagship",
    category: "bus",
    name: "Flagship Ring Bus",
    shortName: "Flagship",
    massKg: 340,
    costMillionUSD: 450,
    powerLoadW: 42,
    description:
      "A large ring-shaped primary structure with an open payload deck, capable of carrying a heavy power system, several instruments and a nuclear source into deep space.",
    specs: [
      { label: "Structure", value: "Ring frame, 4 m diameter" },
      { label: "Attitude control", value: "6 × reaction wheel + CMG" },
      { label: "Power bus", value: "28 V and 100 V redundant buses" },
    ],
    constraints: ["Exceeds the payload capacity of most medium-lift vehicles for outer-planet targets"],
    compatibility: ["Any power system", "Any propulsion system"],
    source: "Educational value scaled from flagship-class planetary spacecraft",
  }),
];

/* -------------------------------------------------------------- power systems */

export const POWER_COMPONENTS: ComponentSpec[] = [
  make({
    id: "power-gaas-small",
    category: "power",
    name: "Rigid GaAs Solar Array",
    shortName: "GaAs 260 W",
    massKg: 26,
    costMillionUSD: 56,
    powerGenerationW: 260,
    description:
      "A body-mounted gallium-arsenide array. Cheap and light, but the output collapses with distance — 63 W at Mars and 3 W at Jupiter.",
    specs: [
      { label: "Cell type", value: "Triple-junction GaAs" },
      { label: "Output at 1 AU", value: "260 W (beginning of life)" },
      { label: "Degradation", value: "≈ 2% per year in LEO-equivalent radiation" },
    ],
    constraints: ["Cannot power any outer-planet mission", "Needs a body with enough area"],
    compatibility: ["Any bus"],
    source: "NASA Glenn Research Center — photovoltaic array performance",
  }),
  make({
    id: "power-gaas-wing",
    category: "power",
    name: "GaAs Deployable Solar Wings",
    shortName: "GaAs 480 W",
    massKg: 58,
    costMillionUSD: 76,
    powerGenerationW: 480,
    description:
      "Twin body-mounted wings using heritage triple-junction cells. The workhorse choice for a Mars-class mission.",
    specs: [
      { label: "Cell type", value: "Triple-junction GaAs / GaInP" },
      { label: "Output at 1 AU", value: "480 W (beginning of life)" },
      { label: "Degradation", value: "≈ 1% per year at 1 AU" },
    ],
    constraints: ["Output below 200 W beyond 2 AU"],
    compatibility: ["Any bus"],
    source: "NASA Glenn Research Center — photovoltaic array performance",
  }),
  make({
    id: "power-gaas-mega",
    category: "power",
    name: "Mega-Deployable Solar Array",
    shortName: "GaAs 1400 W",
    massKg: 186,
    costMillionUSD: 175,
    powerGenerationW: 1400,
    description:
      "Large stowed arrays with five deployable panels. At 1 AU this is a power plant; at Jupiter it is a rounding error, and the mass hurts every other trade-off.",
    specs: [
      { label: "Cell type", value: "Triple-junction GaAs" },
      { label: "Output at 1 AU", value: "1400 W (beginning of life)" },
      { label: "Degradation", value: "≈ 0.8% per year at 1 AU" },
    ],
    constraints: ["Heavy — needs a heavy-lift vehicle for outer-planet targets"],
    compatibility: ["Any bus"],
    source: "NASA Glenn Research Center — photovoltaic array performance",
  }),
  make({
    id: "power-mrtg",
    category: "power",
    name: "MMRTG Radioisotope Generator",
    shortName: "MMRTG 110 W",
    massKg: 46,
    costMillionUSD: 385,
    powerGenerationW: 110,
    constantPower: true,
    description:
      "A Multi-Mission Radioisotope Thermoelectric Generator. Constant output regardless of distance from the Sun, which makes it the only practical power source for Jupiter and beyond.",
    specs: [
      { label: "Power at start of life", value: "110 W electrical" },
      { label: "Heat rejection", value: "≈ 2,000 W thermal" },
      { label: "Fuel", value: "Plutonium-238 dioxide" },
    ],
    constraints: ["Requires dedicated radiator space for ~2 kW of waste heat"],
    compatibility: ["Any bus"],
    source: "NASA Radioisotope Power Systems — MMRTG",
  }),
  make({
    id: "power-kilopower",
    category: "power",
    name: "Kilopower Fission Unit",
    shortName: "Kilopower 150 W",
    massKg: 58,
    costMillionUSD: 510,
    powerGenerationW: 150,
    constantPower: true,
    description:
      "A fission surface power unit with no fuel limitation and long operating life. Illustrative design for the game — NASA's Kilopower programme is still in ground demonstration.",
    specs: [
      { label: "Power at start of life", value: "150 W electrical (illustrative)" },
      { label: "Architecture", value: "Brayton conversion, solid core" },
      { label: "Status", value: "Technology demonstrator — illustrative" },
    ],
    constraints: ["Requires dedicated radiator space", "Illustrative technology"],
    compatibility: ["Any bus"],
    source: "NASA / DOE Kilopower programme (illustrative gameplay values)",
  }),
];

/* ------------------------------------------------------------ thermal control */

export const THERMAL_COMPONENTS: ComponentSpec[] = [
  make({
    id: "thermal-mli",
    category: "thermal",
    name: "Multi-Layer Insulation Blanket",
    shortName: "MLI Blanket",
    massKg: 16,
    costMillionUSD: 28,
    powerLoadW: 0,
    thermalControl: 35,
    radiatorAreaM2: 2.5,
    description:
      "Passive insulation on every external surface. Almost free thermally, but it does nothing on its own to remove waste heat from a powered spacecraft.",
    specs: [
      { label: "Layers", value: "15 aluminised Kapton / MLI" },
      { label: "Emittance", value: "0.05 outer / 0.25 inner" },
      { label: "Heater power", value: "None" },
    ],
    constraints: ["Insulation only — does not reject heat"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight MLI blankets",
  }),
  make({
    id: "thermal-heatpipe",
    category: "thermal",
    name: "Heat-Pipe Radiator Array",
    shortName: "Heat Pipe",
    massKg: 34,
    costMillionUSD: 64,
    powerLoadW: 4,
    thermalControl: 62,
    radiatorAreaM2: 4.5,
    description:
      "Loop heat pipes move waste heat from the electronics to a deployable radiator. A good general-purpose thermal solution with a modest parasitic load.",
    specs: [
      { label: "Transport", value: "Loop heat pipes, ammonia" },
      { label: "Radiator area", value: "4.5 m²" },
      { label: "Parasitic load", value: "4 W pump power" },
    ],
    constraints: ["Needs radiator clearance in the spacecraft stack"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from spacecraft thermal subsystems",
  }),
  make({
    id: "thermal-loop",
    category: "thermal",
    name: "Active Fluid Loop + Louvers",
    shortName: "Active Loop",
    massKg: 58,
    costMillionUSD: 110,
    powerLoadW: 26,
    thermalControl: 78,
    radiatorAreaM2: 6.5,
    description:
      "A pumped fluid loop with variable-emissivity louvers. The only thermal system that can hold a large radioisotope source at a workable temperature, at a real power cost.",
    specs: [
      { label: "Transport", value: "Single-phase pumped loop" },
      { label: "Radiator area", value: "6.5 m²" },
      { label: "Parasitic load", value: "26 W at full pump rate" },
    ],
    constraints: ["Power draw is significant on solar-only spacecraft"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from active thermal control systems",
  }),
  make({
    id: "thermal-rhu",
    category: "thermal",
    name: "Radioisotope Heater Units + MLI",
    shortName: "RHU + MLI",
    massKg: 27,
    costMillionUSD: 52,
    powerLoadW: 0,
    thermalControl: 55,
    radiatorAreaM2: 3.0,
    description:
      "A blanket plus a set of radioisotope heater units that keep mechanisms alive through deep-cold eclipses without drawing a single watt.",
    specs: [
      { label: "Heaters", value: "8 × radioisotope heater unit" },
      { label: "Radiator area", value: "3.0 m² (MLI only)" },
      { label: "Parasitic load", value: "None" },
    ],
    constraints: ["No active heat removal — poor for radioisotope power sources"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from radioisotope heater units",
  }),
];

/* --------------------------------------------------------------- propulsion */

export const PROPULSION_COMPONENTS: ComponentSpec[] = [
  make({
    id: "prop-mono",
    category: "propulsion",
    name: "Chemical Monopropulsion Thruster",
    shortName: "Monoprop",
    massKg: 6,
    costMillionUSD: 28,
    ispSeconds: 220,
    thrustN: 445,
    description:
      "A pressure-fed monopropellant thruster using a storable oxidiser. Cheap and simple, but its specific impulse limits how much delta-v it can buy.",
    specs: [
      { label: "Propellant", value: "Hydrazine / NTO" },
      { label: "Specific impulse", value: "220 s" },
      { label: "Vacuum thrust", value: "445 N" },
    ],
    constraints: ["Low specific impulse", "Single thruster — no backup"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight hydrazine thrusters",
  }),
  make({
    id: "prop-biprop",
    category: "propulsion",
    name: "Chemical Bipropellant Thruster",
    shortName: "Bipropellant",
    massKg: 46,
    costMillionUSD: 92,
    ispSeconds: 311,
    thrustN: 920,
    description:
      "A hypergolic bipropellant engine with a restartable gimballed nozzle. The workhorse for orbit insertion and landing burns.",
    specs: [
      { label: "Propellant", value: "MMH / MON-3" },
      { label: "Specific impulse", value: "311 s" },
      { label: "Vacuum thrust", value: "920 N" },
    ],
    constraints: ["Gimbal hardware adds mass", "Propellant is toxic and expensive to handle"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight bipropellant engines",
  }),
  make({
    id: "prop-hall",
    category: "propulsion",
    name: "Hall Effect Thruster",
    shortName: "Hall Thruster",
    massKg: 26,
    costMillionUSD: 110,
    ispSeconds: 1600,
    thrustN: 0.3,
    description:
      "A gridded ion thruster with a xenon feed system. Enormous specific impulse for cruise, but it needs thousands of hours of continuous operation and cannot handle a large impulsive burn.",
    specs: [
      { label: "Propellant", value: "Xenon" },
      { label: "Specific impulse", value: "1,600 s" },
      { label: "Vacuum thrust", value: "0.3 N" },
    ],
    constraints: ["Requires long burn times", "Needs a large power supply for the discharge"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight Hall thrusters",
  }),
  make({
    id: "prop-xps",
    category: "propulsion",
    name: "Solar Electric Thruster",
    shortName: "XPS",
    massKg: 38,
    costMillionUSD: 145,
    ispSeconds: 3000,
    thrustN: 0.25,
    description:
      "A high-power gridded ion thruster designed to run on solar arrays directly. The highest specific impulse available here, at the cost of a very long burn.",
    specs: [
      { label: "Propellant", value: "Xenon" },
      { label: "Specific impulse", value: "3,000 s" },
      { label: "Vacuum thrust", value: "0.25 N" },
    ],
    constraints: ["Requires a high-power array to operate", "Burn duration measured in months"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA XPS-class thrusters",
  }),
];

/* ---------------------------------------------------------------- fuel tanks */

export const FUEL_COMPONENTS: ComponentSpec[] = [
  make({
    id: "fuel-hyd40",
    category: "fuel",
    name: "Hydrazine Tank 40 kg",
    shortName: "Hydrazine 40 kg",
    massKg: 18,
    costMillionUSD: 20,
    propellantCapacityKg: 40,
    description:
      "A small storable monopropellant tank. Enough for attitude control and a modest trim burn, nothing more.",
    specs: [
      { label: "Propellant", value: "Hydrazine / NTO" },
      { label: "Capacity", value: "40 kg usable" },
      { label: "Dry mass", value: "18 kg" },
    ],
    constraints: ["Not enough propellant for an interplanetary injection"],
    compatibility: ["Monopropellant thruster"],
    source: "Educational value scaled from flight propellant tanks",
  }),
  make({
    id: "fuel-mmh120",
    category: "fuel",
    name: "MMH / MON-3 Tank 120 kg",
    shortName: "MMH 120 kg",
    massKg: 26,
    costMillionUSD: 36,
    propellantCapacityKg: 120,
    description:
      "A pressurised bipropellant tank sized for a Mars-class transfer with margin for a mid-course correction.",
    specs: [
      { label: "Propellant", value: "MMH / MON-3" },
      { label: "Capacity", value: "120 kg usable" },
      { label: "Dry mass", value: "26 kg" },
    ],
    constraints: ["Limited margin for an impulsive injection plus arrival capture"],
    compatibility: ["Bipropellant thruster", "Monopropellant thruster"],
    source: "Educational value scaled from flight propellant tanks",
  }),
  make({
    id: "fuel-mmh400",
    category: "fuel",
    name: "MMH / MON-3 Tank 400 kg",
    shortName: "MMH 400 kg",
    massKg: 48,
    costMillionUSD: 60,
    propellantCapacityKg: 400,
    description:
      "A large bipropellant tank. Carries a heavy injection burn and an arrival capture, at the price of launch mass.",
    specs: [
      { label: "Propellant", value: "MMH / MON-3" },
      { label: "Capacity", value: "400 kg usable" },
      { label: "Dry mass", value: "48 kg" },
    ],
    constraints: ["Heavy — check the launch vehicle payload margin carefully"],
    compatibility: ["Bipropellant thruster"],
    source: "Educational value scaled from flight propellant tanks",
  }),
  make({
    id: "fuel-mmh600",
    category: "fuel",
    name: "MMH / MON-3 Tank 600 kg",
    shortName: "MMH 600 kg",
    massKg: 62,
    costMillionUSD: 75,
    propellantCapacityKg: 600,
    description:
      "The largest chemical tank in the catalogue. It is the only chemical option that carries a lander to Mars or Venus.",
    specs: [
      { label: "Propellant", value: "MMH / MON-3" },
      { label: "Capacity", value: "600 kg usable" },
      { label: "Dry mass", value: "62 kg" },
    ],
    constraints: ["Heavy — a heavy-lift vehicle is usually required"],
    compatibility: ["Bipropellant thruster"],
    source: "Educational value scaled from flight propellant tanks",
  }),
  make({
    id: "fuel-xenon40",
    category: "fuel",
    name: "Xenon Tank 40 kg",
    shortName: "Xenon 40 kg",
    massKg: 12,
    costMillionUSD: 18,
    propellantCapacityKg: 40,
    description:
      "A small xenon tank for a low-thrust cruise. Enough for a modest correction budget on an inner-planet orbiter.",
    specs: [
      { label: "Propellant", value: "Xenon" },
      { label: "Capacity", value: "40 kg usable" },
      { label: "Dry mass", value: "12 kg" },
    ],
    constraints: ["Useless with chemical thrusters"],
    compatibility: ["Hall thruster", "Solar electric thruster"],
    source: "Educational value scaled from flight xenon tanks",
  }),
  make({
    id: "fuel-xenon120",
    category: "fuel",
    name: "Xenon Tank 120 kg",
    shortName: "Xenon 120 kg",
    massKg: 22,
    costMillionUSD: 48,
    propellantCapacityKg: 120,
    description:
      "A high-pressure xenon tank for electric propulsion. Xenon is dense enough to be efficient in a thruster and inert to store.",
    specs: [
      { label: "Propellant", value: "Xenon" },
      { label: "Capacity", value: "120 kg usable" },
      { label: "Dry mass", value: "22 kg" },
    ],
    constraints: ["Useless with chemical thrusters"],
    compatibility: ["Hall thruster", "Solar electric thruster"],
    source: "Educational value scaled from flight xenon tanks",
  }),
  make({
    id: "fuel-xenon400",
    category: "fuel",
    name: "Xenon Tank 400 kg",
    shortName: "Xenon 400 kg",
    massKg: 48,
    costMillionUSD: 95,
    propellantCapacityKg: 400,
    description:
      "A large xenon tank for a deep-space electric propulsion mission. Four hundred kilograms of propellant buys a very different trajectory than a hundred.",
    specs: [
      { label: "Propellant", value: "Xenon" },
      { label: "Capacity", value: "400 kg usable" },
      { label: "Dry mass", value: "48 kg" },
    ],
    constraints: ["Useless with chemical thrusters", "Heavy — a heavy-lift vehicle is usually required"],
    compatibility: ["Hall thruster", "Solar electric thruster"],
    source: "Educational value scaled from flight xenon tanks",
  }),
];

/* ------------------------------------------------------------------ comms */

export const COMMS_COMPONENTS: ComponentSpec[] = [
  make({
    id: "comms-omni",
    category: "comms",
    name: "Omnidirectional Low-Gain Antenna",
    shortName: "Omni 5 kbps",
    massKg: 2,
    costMillionUSD: 8,
    powerLoadW: 8,
    dataRateMbps: 0.005,
    referenceDistanceAU: 1.0,
    description:
      "A quadrifilar helix giving 5 kbps in every direction. Cheap, robust, and far too slow for a modern instrument suite.",
    specs: [
      { label: "Downlink", value: "5 kbps" },
      { label: "Band", value: "S-band / X-band" },
      { label: "Recorder", value: "4 Gbit solid-state" },
    ],
    constraints: ["Science return will outrun the downlink", "Weak against a distant ground station"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight low-gain antennas",
  }),
  make({
    id: "comms-uhf",
    category: "comms",
    name: "UHF Relay Transponder",
    shortName: "UHF 20 kbps",
    massKg: 6,
    costMillionUSD: 20,
    powerLoadW: 22,
    dataRateMbps: 0.02,
    referenceDistanceAU: 1.0,
    description:
      "A relay-grade UHF transponder with an integrated recorder. Useful for a lander talking to an orbiter rather than to Earth.",
    specs: [
      { label: "Downlink", value: "20 kbps" },
      { label: "Band", value: "UHF / S-band" },
      { label: "Recorder", value: "8 Gbit flash" },
    ],
    constraints: ["Bandwidth limited", "Not a deep-space link"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight UHF transponders",
  }),
  make({
    id: "comms-xband",
    category: "comms",
    name: "X-Band Medium-Gain Dish",
    shortName: "X-Band 45 kbps",
    massKg: 14,
    costMillionUSD: 60,
    powerLoadW: 45,
    dataRateMbps: 0.045,
    referenceDistanceAU: 5.2,
    description:
      "A 0.7 m steerable X-band dish. The reliable Deep Space Network workhorse, and enough for most planetary payloads.",
    specs: [
      { label: "Downlink", value: "45 kbps" },
      { label: "Dish diameter", value: "0.7 m" },
      { label: "Recorder", value: "16 Gbit" },
    ],
    constraints: ["Power draw is significant on a small array", "Gimbal adds pointing complexity"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA Deep Space Network X-band systems",
  }),
  make({
    id: "comms-dual",
    category: "comms",
    name: "Dual-Band X/Ka Terminal",
    shortName: "Dual 120 kbps",
    massKg: 27,
    costMillionUSD: 96,
    powerLoadW: 62,
    dataRateMbps: 0.12,
    referenceDistanceAU: 5.2,
    description:
      "A combined X-band and Ka-band terminal that falls back to the lower band when the deep-space link is degraded by weather.",
    specs: [
      { label: "Downlink", value: "120 kbps (Ka), 45 kbps (X)" },
      { label: "Dish diameter", value: "1.1 m" },
      { label: "Recorder", value: "24 Gbit" },
    ],
    constraints: ["High power draw", "Large gimbal mass"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA deep-space communication terminals",
  }),
  make({
    id: "comms-kaband",
    category: "comms",
    name: "Ka-Band High-Gain Dish",
    shortName: "Ka-Band 250 kbps",
    massKg: 38,
    costMillionUSD: 125,
    powerLoadW: 88,
    dataRateMbps: 0.25,
    referenceDistanceAU: 5.2,
    description:
      "A wide-band high-gain dish for data-hungry payloads. Excellent science return, and the 88 W draw can destroy a small power budget.",
    specs: [
      { label: "Downlink", value: "250 kbps" },
      { label: "Dish diameter", value: "1.6 m" },
      { label: "Recorder", value: "32 Gbit" },
    ],
    constraints: ["Power draw is severe", "Mass penalty on small buses"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA deep-space communication terminals",
  }),
  make({
    id: "comms-laser",
    category: "comms",
    name: "Optical Laser Communications Terminal",
    shortName: "Laser 1000 kbps",
    massKg: 120,
    costMillionUSD: 335,
    powerLoadW: 152,
    dataRateMbps: 1.0,
    referenceDistanceAU: 1.0,
    description:
      "An experimental optical downlink with an order of magnitude more bandwidth than Ka-band. It needs a clear line of sight and a lot of power.",
    specs: [
      { label: "Downlink", value: "1000 kbps at 1 AU" },
      { label: "Wavelength", value: "1064 nm" },
      { label: "Recorder", value: "64 Gbit" },
    ],
    constraints: ["Experimental", "Very high power draw", "Heavy"],
    compatibility: ["Flagship Ring Bus"],
    source: "NASA / JPL optical communications demonstration (illustrative gameplay values)",
  }),
];

/* ---------------------------------------------------------------- batteries */

export const BATTERY_COMPONENTS: ComponentSpec[] = [
  make({
    id: "battery-small",
    category: "battery",
    name: "Small Lithium-Ion Pack",
    shortName: "Li-ion 1.2 kWh",
    massKg: 9,
    costMillionUSD: 20,
    capacityWh: 1200,
    description:
      "Minimum energy storage. Covers short eclipses and a brief safe mode, nothing more.",
    specs: [
      { label: "Capacity", value: "1.2 kWh" },
      { label: "Specific energy", value: "133 Wh/kg" },
      { label: "Cycle life", value: "≈ 300 full equivalent cycles" },
    ],
    constraints: ["Cannot bridge a long eclipse or an anomaly power transient"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight battery packs",
  }),
  make({
    id: "battery-standard",
    category: "battery",
    name: "Standard Lithium-Ion Pack",
    shortName: "Li-ion 3.6 kWh",
    massKg: 22,
    costMillionUSD: 44,
    capacityWh: 3600,
    description:
      "A balanced battery with good cycle life. Covers a communication pass and short safe-mode periods.",
    specs: [
      { label: "Capacity", value: "3.6 kWh" },
      { label: "Specific energy", value: "164 Wh/kg" },
      { label: "Cycle life", value: "≈ 500 full equivalent cycles" },
    ],
    constraints: ["Only bridges brief load excursions"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight battery packs",
  }),
  make({
    id: "battery-nimh",
    category: "battery",
    name: "Long-Life Nickel-Hydrogen Pack",
    shortName: "NiMH 4.2 kWh",
    massKg: 44,
    costMillionUSD: 68,
    capacityWh: 4200,
    description:
      "A classic deep-space battery chemistry with exceptional cycle life and shallow-discharge tolerance. Heavy, but it survives a multi-year mission.",
    specs: [
      { label: "Capacity", value: "4.2 kWh" },
      { label: "Specific energy", value: "95 Wh/kg" },
      { label: "Cycle life", value: "≈ 1,500 full equivalent cycles" },
    ],
    constraints: ["Heavy for its capacity"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from flight battery packs",
  }),
  make({
    id: "battery-radhard",
    category: "battery",
    name: "Radiation-Hardened Lithium-Ion Pack",
    shortName: "Rad-hard 6 kWh",
    massKg: 38,
    costMillionUSD: 96,
    capacityWh: 6000,
    description:
      "Radiation-tolerant cells with a long life in high-radiation environments. The only sensible choice for Jupiter and beyond.",
    specs: [
      { label: "Capacity", value: "6.0 kWh" },
      { label: "Specific energy", value: "158 Wh/kg" },
      { label: "Cycle life", value: "≈ 700 full equivalent cycles" },
    ],
    constraints: ["Expensive", "Heavy"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA radiation-hardened energy storage",
  }),
];

/* -------------------------------------------------------------- instruments */

function affinity(values: Partial<Record<DestinationId, number>>): Partial<Record<DestinationId, number>> {
  return values;
}

export const INSTRUMENT_COMPONENTS: ComponentSpec[] = [
  make({
    id: "inst-imager",
    category: "instrument",
    name: "Multispectral Imaging Camera",
    shortName: "MSI Camera",
    massKg: 24,
    costMillionUSD: 92,
    powerLoadW: 18,
    dataRateMbps: 0.009,
    scienceWeight: 1.5,
    scienceCategory: "Remote Sensing",
    affinity: affinity({ venus: 1.2, mars: 1.2, jupiter: 1.1, saturn: 1.1, uranus: 1.1, neptune: 1.1 }),
    description:
      "Visible and near-infrared framing across twelve bands. Broadly useful everywhere, and a large data producer for what it delivers.",
    specs: [
      { label: "Bands", value: "12 (visible to near-IR)" },
      { label: "Data rate", value: "9 Mbps average" },
      { label: "Field of view", value: "5.7° × 4.4°" },
    ],
    constraints: ["Moderate data volume", "Best on solid surfaces and cloud tops"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA planetary cameras",
  }),
  make({
    id: "inst-radar",
    category: "instrument",
    name: "Ground-Penetrating Radar Sounder",
    shortName: "GPR Sounder",
    massKg: 38,
    costMillionUSD: 140,
    powerLoadW: 32,
    dataRateMbps: 0.016,
    scienceWeight: 2.2,
    scienceCategory: "Subsurface",
    affinity: affinity({ mars: 1.5, jupiter: 1.8, saturn: 1.7, mercury: 1.6, uranus: 1.4, neptune: 1.4 }),
    description:
      "Ice-penetrating radar. The single most valuable instrument for any world with a subsurface to look at — and the second largest data producer.",
    specs: [
      { label: "Frequencies", value: "2–60 MHz" },
      { label: "Data rate", value: "16 Mbps average" },
      { label: "Depth of penetration", value: "1–3 km in ice" },
    ],
    constraints: ["Needs close orbital or surface proximity", "High data volume"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA radar sounders",
  }),
  make({
    id: "inst-spectrometer",
    category: "instrument",
    name: "Mass Spectrometer",
    shortName: "Mass Spec",
    massKg: 14,
    costMillionUSD: 110,
    powerLoadW: 14,
    dataRateMbps: 0.003,
    scienceWeight: 4.0,
    scienceCategory: "Composition",
    affinity: affinity({ venus: 1.9, mars: 1.7, jupiter: 1.9, saturn: 1.8, uranus: 1.8, neptune: 1.8 }),
    description:
      "Identifies molecules and isotopes from a tiny sample. Low data rate, very high science value per bit — the efficient choice for atmospheric work.",
    specs: [
      { label: "Mass range", value: "1–300 Da" },
      { label: "Data rate", value: "3 Mbps average" },
      { label: "Sensitivity", value: "10⁻⁶ relative abundance" },
    ],
    constraints: ["Requires a sample delivery or atmosphere-ingress system"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA mass spectrometers",
  }),
  make({
    id: "inst-magnetometer",
    category: "instrument",
    name: "Dual-Sensor Magnetometer",
    shortName: "Magnetometer",
    massKg: 5,
    costMillionUSD: 52,
    powerLoadW: 6,
    dataRateMbps: 0.001,
    scienceWeight: 6.0,
    scienceCategory: "Fields",
    affinity: affinity({ venus: 1.4, mars: 0.9, jupiter: 2.0, saturn: 1.9, uranus: 2.0, neptune: 1.9 }),
    description:
      "Measures magnetic fields. Tiny, almost free, and uniquely valuable anywhere with an active magnetosphere.",
    specs: [
      { label: "Sensitivity", value: "0.1 nT" },
      { label: "Data rate", value: "1 Mbps average" },
      { label: "Sensors", value: "Fluxgate + search coil" },
    ],
    constraints: ["Requires a boom to escape spacecraft magnetic interference"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA magnetometers",
  }),
  make({
    id: "inst-lidar",
    category: "instrument",
    name: "Laser Altimeter (LiDAR)",
    shortName: "LiDAR Altimeter",
    massKg: 12,
    costMillionUSD: 76,
    powerLoadW: 22,
    dataRateMbps: 0.007,
    scienceWeight: 2.0,
    scienceCategory: "Topography",
    affinity: affinity({ mercury: 1.6, mars: 1.1, venus: 1.5, jupiter: 1.2, saturn: 1.1 }),
    description:
      "Precise surface topography and hazard mapping. Excellent for landing-site selection and for any world with a solid surface.",
    specs: [
      { label: "Range", value: "0.5–50 km" },
      { label: "Vertical accuracy", value: "± 1 m" },
      { label: "Pulse rate", value: "20 Hz" },
    ],
    constraints: ["Needs a clear line of sight to a surface"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA laser altimeters",
  }),
  make({
    id: "inst-drill",
    category: "instrument",
    name: "Sample Coring Drill",
    shortName: "Coring Drill",
    massKg: 45,
    costMillionUSD: 155,
    powerLoadW: 28,
    dataRateMbps: 0.002,
    scienceWeight: 8.0,
    scienceCategory: "In-situ",
    affinity: affinity({ mars: 1.8, mercury: 1.5, venus: 1.2, saturn: 0.8 }),
    description:
      "Acquires and caches subsurface cores. Enormous science value where you can land and drill, and almost useless on a fast flyby.",
    specs: [
      { label: "Depth", value: "2 m" },
      { label: "Core length", value: "1 m, 42 mm diameter" },
      { label: "Data rate", value: "2 Mbps average" },
    ],
    constraints: ["Requires a stable landing site", "Very low data rate — not a bandwidth user"],
    compatibility: ["Monoblock Avionics Bus", "Heritage Three-Axis Bus"],
    source: "Educational value scaled from NASA sampling drills",
  }),
  make({
    id: "inst-plasma",
    category: "instrument",
    name: "Plasma Spectrometer",
    shortName: "Plasma Spec",
    massKg: 16,
    costMillionUSD: 88,
    powerLoadW: 12,
    dataRateMbps: 0.006,
    scienceWeight: 3.4,
    scienceCategory: "Particles",
    affinity: affinity({ mercury: 1.7, venus: 1.8, jupiter: 2.0, saturn: 2.0, uranus: 1.9, neptune: 1.9 }),
    description:
      "Measures the energy and composition of charged particles. The primary instrument for magnetospheric science, and valuable in any ionosphere.",
    specs: [
      { label: "Energy range", value: "1 eV – 50 keV" },
      { label: "Data rate", value: "6 Mbps average" },
      { label: "Azimuth coverage", value: "180°" },
    ],
    constraints: ["Detects charged particles only — neutral material needs another instrument"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA plasma instruments",
  }),
  make({
    id: "inst-submillimeter",
    category: "instrument",
    name: "Submillimeter Spectrometer",
    shortName: "Sub-mm Spectrometer",
    massKg: 30,
    costMillionUSD: 185,
    powerLoadW: 40,
    dataRateMbps: 0.004,
    scienceWeight: 5.2,
    scienceCategory: "Atmosphere",
    affinity: affinity({ venus: 1.8, jupiter: 1.9, saturn: 1.9, uranus: 2.0, neptune: 2.0 }),
    description:
      "Probes molecular and isotopic lines in the upper atmosphere. The most sensitive composition instrument in the catalogue, and the most power hungry.",
    specs: [
      { label: "Band", value: "0.3–3 THz" },
      { label: "Data rate", value: "4 Mbps average" },
      { label: "Sensitivity", value: "10⁻⁸ line strength" },
    ],
    constraints: ["Requires a cold detector", "High power draw"],
    compatibility: ["Heritage Three-Axis Bus", "Flagship Ring Bus"],
    source: "Educational value scaled from NASA submillimeter instruments",
  }),
  make({
    id: "inst-thermal",
    category: "instrument",
    name: "Thermal Infrared Mapper",
    shortName: "TIR Mapper",
    massKg: 20,
    costMillionUSD: 100,
    powerLoadW: 16,
    dataRateMbps: 0.008,
    scienceWeight: 3.0,
    scienceCategory: "Thermal",
    affinity: affinity({ mercury: 1.8, venus: 1.7, mars: 1.4, jupiter: 1.6, uranus: 1.5 }),
    description:
      "Maps surface and atmospheric temperature. A reliable generalist for any world where thermal structure carries science.",
    specs: [
      { label: "Spectral band", value: "8–14 µm thermal infrared" },
      { label: "Data rate", value: "8 Mbps average" },
      { label: "NEdT", value: "0.15 K at 300 K" },
    ],
    constraints: ["Thermal infrared does not see through thick clouds"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA thermal imagers",
  }),
  make({
    id: "inst-widefield",
    category: "instrument",
    name: "Wide-Field Context Camera",
    shortName: "Wide-Field Camera",
    massKg: 9,
    costMillionUSD: 48,
    powerLoadW: 11,
    dataRateMbps: 0.012,
    scienceWeight: 1.8,
    scienceCategory: "Remote Sensing",
    affinity: affinity({ jupiter: 1.6, saturn: 1.6, uranus: 1.5, neptune: 1.5, mercury: 1.3 }),
    description:
      "A cheap, wide context camera for close flybys of gas giants. Gives you the shot, not the data.",
    specs: [
      { label: "Field of view", value: "42° × 32°" },
      { label: "Data rate", value: "12 Mbps average" },
      { label: "Detector", value: "2 MP CMOS" },
    ],
    constraints: ["Low spectral resolution", "High data rate for its science value"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA context cameras",
  }),
  make({
    id: "inst-dust",
    category: "instrument",
    name: "Dust and Particle Analyser",
    shortName: "Dust Analyser",
    massKg: 13,
    costMillionUSD: 68,
    powerLoadW: 10,
    dataRateMbps: 0.005,
    scienceWeight: 2.6,
    scienceCategory: "Particles",
    affinity: affinity({ mercury: 1.7, venus: 1.6, mars: 1.7, saturn: 1.8 }),
    description:
      "Analyses the size and composition of dust grains. Essential in a dusty atmosphere and around the rings.",
    specs: [
      { label: "Size range", value: "0.1–100 µm" },
      { label: "Data rate", value: "5 Mbps average" },
      { label: "Detector", value: "Impact and electrostatic analyser" },
    ],
    constraints: ["Contaminates in a dusty environment"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA dust analysers",
  }),
  make({
    id: "inst-gravimeter",
    category: "instrument",
    name: "Precision Gravimeter",
    shortName: "Gravimeter",
    massKg: 11,
    costMillionUSD: 80,
    powerLoadW: 9,
    dataRateMbps: 0.002,
    scienceWeight: 3.6,
    scienceCategory: "Geodesy",
    affinity: affinity({ mercury: 1.6, venus: 1.7, mars: 1.6, jupiter: 1.5, saturn: 1.5 }),
    description:
      "Tracks the local gravity field. The cleanest way to measure an interior, and to find an ocean under an ice shell.",
    specs: [
      { label: "Resolution", value: "10 nm/s²" },
      { label: "Data rate", value: "2 Mbps average" },
      { label: "Sensor", value: "Superconducting accelerometer" },
    ],
    constraints: ["Needs a very stable attitude reference", "Cold, not heat, is the problem"],
    compatibility: ["Any bus"],
    source: "Educational value scaled from NASA gravimetry instruments",
  }),
];

export const ALL_COMPONENTS: ComponentSpec[] = [
  ...BUS_COMPONENTS,
  ...POWER_COMPONENTS,
  ...THERMAL_COMPONENTS,
  ...PROPULSION_COMPONENTS,
  ...FUEL_COMPONENTS,
  ...COMMS_COMPONENTS,
  ...BATTERY_COMPONENTS,
  ...INSTRUMENT_COMPONENTS,
];

export const COMPONENT_BY_ID: Record<string, ComponentSpec> = ALL_COMPONENTS.reduce(
  (acc, component) => {
    acc[component.id] = component;
    return acc;
  },
  {} as Record<string, ComponentSpec>,
);

export const COMPONENTS_BY_CATEGORY: Record<ComponentCategory, ComponentSpec[]> = {
  bus: BUS_COMPONENTS,
  power: POWER_COMPONENTS,
  thermal: THERMAL_COMPONENTS,
  propulsion: PROPULSION_COMPONENTS,
  fuel: FUEL_COMPONENTS,
  comms: COMMS_COMPONENTS,
  battery: BATTERY_COMPONENTS,
  instrument: INSTRUMENT_COMPONENTS,
};

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  bus: "Spacecraft Bus",
  power: "Power Generation",
  thermal: "Thermal Control",
  propulsion: "Propulsion System",
  fuel: "Propellant Tanks",
  comms: "Communication System",
  battery: "Energy Storage",
  instrument: "Scientific Instruments",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "bus",
  "power",
  "thermal",
  "propulsion",
  "fuel",
  "comms",
  "battery",
  "instrument",
];

export function getComponent(id: string): ComponentSpec | undefined {
  return COMPONENT_BY_ID[id];
}
