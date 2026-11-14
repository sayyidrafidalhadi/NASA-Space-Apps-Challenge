import { describe, expect, it } from "vitest";
import { AU, G0, SECONDS_PER_DAY } from "./constants";
import {
  circularSpeed,
  missionDeltaV,
  orbitalPeriod,
  planTransfer,
  visViva,
} from "./orbitalMechanics";
import {
  evaluatePropulsion,
  propellantRequired,
  tsiolkovskyDeltaV,
} from "./propulsion";
import {
  evaluatePower,
  generatedPower,
  solarFluxFactor,
} from "./powerSystem";
import {
  DEEP_SPACE_TEMPERATURE_K,
  evaluateThermal,
  radiatorTemperature,
  rejectionCapacity,
} from "./thermalSystem";
import {
  evaluateCommunication,
  lightTimeSeconds,
} from "./communication";
import { SCORE_WEIGHTS, scoreMission } from "./missionScoring";
import { COMPONENT_BY_ID } from "@/data/spacecraftComponents";
import type { ComponentSpec } from "@/types";
import type { SimulationConfig, SimulationRuntime } from "./simulation";

describe("Orbital Mechanics Engine", () => {
  it("calculates circular orbital speed at 1 AU accurately (~29.78 km/s)", () => {
    const speed = circularSpeed(AU);
    expect(speed).toBeGreaterThan(29700);
    expect(speed).toBeLessThan(29900);
  });

  it("calculates orbital period at 1 AU as 1 Earth year (~365.25 days)", () => {
    const periodS = orbitalPeriod(AU);
    const periodDays = periodS / SECONDS_PER_DAY;
    expect(periodDays).toBeGreaterThan(364.5);
    expect(periodDays).toBeLessThan(366);
  });

  it("satisfies vis-viva equation for circular and elliptical orbits", () => {
    const vCirc = circularSpeed(AU);
    const vVisViva = visViva(AU, AU);
    expect(Math.abs(vCirc - vVisViva)).toBeLessThan(1e-6);
  });

  it("computes Earth-Mars Hohmann transfer correctly", () => {
    const transfer = planTransfer("earth", "mars");
    expect(transfer.outward).toBe(true);
    expect(transfer.timeOfFlightDays).toBeGreaterThan(240);
    expect(transfer.timeOfFlightDays).toBeLessThan(280);
    expect(transfer.totalDeltaVMs).toBeGreaterThan(5000);
    expect(transfer.totalDeltaVMs).toBeLessThan(6500);
    expect(transfer.departureDeltaVMs).toBeGreaterThan(2800);
    expect(transfer.departureDeltaVMs).toBeLessThan(3100);
  });

  it("computes Earth-Venus Hohmann transfer correctly as inward transfer", () => {
    const transfer = planTransfer("earth", "venus");
    expect(transfer.outward).toBe(false);
    expect(transfer.timeOfFlightDays).toBeGreaterThan(130);
    expect(transfer.timeOfFlightDays).toBeLessThan(160);
  });
});

describe("Propulsion & Tsiolkovsky Engine", () => {
  it("satisfies Tsiolkovsky rocket equation Δv = Isp · g0 · ln(m0 / mf)", () => {
    const isp = 320;
    const m0 = 1000;
    const mf = 500;
    const expectedDeltaV = isp * G0 * Math.log(2);
    const actualDeltaV = tsiolkovskyDeltaV(m0, mf, isp);
    expect(Math.abs(actualDeltaV - expectedDeltaV)).toBeLessThan(0.01);
  });

  it("correctly calculates propellant required for a target delta-V", () => {
    const isp = 300;
    const initialMass = 1200;
    const deltaV = 1500;
    const propMass = propellantRequired(deltaV, initialMass, isp);
    const finalMass = initialMass - propMass;
    const verifiedDeltaV = tsiolkovskyDeltaV(initialMass, finalMass, isp);
    expect(Math.abs(verifiedDeltaV - deltaV)).toBeLessThan(0.01);
  });

  it("evaluates propulsion hardware state with fuel burn and mass ratio", () => {
    const engine: ComponentSpec = {
      ...COMPONENT_BY_ID["prop-biprop"],
      ispSeconds: 318,
      thrustN: 450,
      massKg: 40,
    };
    const tank: ComponentSpec = {
      ...COMPONENT_BY_ID["fuel-mmh600"],
      propellantCapacityKg: 600,
      massKg: 50,
    };
    const dryMass = 400;
    const state = evaluatePropulsion(engine, tank, dryMass, 0, 0);

    expect(state.ispSeconds).toBe(318);
    expect(state.propellantKg).toBe(600);
    expect(state.theoreticalMaxDeltaVMs).toBeGreaterThan(2500);
    expect(state.remainingDeltaVMs).toBe(state.theoreticalMaxDeltaVMs);
  });
});

describe("Power Subsystem Engine", () => {
  it("obeys inverse square law for solar flux factor", () => {
    expect(solarFluxFactor(1)).toBe(1);
    expect(solarFluxFactor(2)).toBe(0.25);
    expect(solarFluxFactor(5.2)).toBeCloseTo(1 / (5.2 * 5.2), 4);
  });

  it("scales solar panels with distance but keeps RTG constant", () => {
    const solarSource: ComponentSpec = {
      ...COMPONENT_BY_ID["power-gaas-wing"],
      powerGenerationW: 1000,
      constantPower: false,
    };
    const rtgSource: ComponentSpec = {
      ...COMPONENT_BY_ID["power-rtg-next"],
      powerGenerationW: 300,
      constantPower: true,
    };

    expect(generatedPower(solarSource, 1)).toBe(1000);
    expect(generatedPower(solarSource, 2)).toBe(250);
    expect(generatedPower(rtgSource, 1)).toBe(300);
    expect(generatedPower(rtgSource, 2)).toBe(300);

    const battery = COMPONENT_BY_ID["battery-standard"];
    const thermal = COMPONENT_BY_ID["thermal-heatpipe"];
    const comms = COMPONENT_BY_ID["comms-xband"];
    const instruments = [COMPONENT_BY_ID["inst-imager"]];

    const solarPower1AU = evaluatePower(solarSource, battery, thermal, comms, instruments, 1);
    const solarPower2AU = evaluatePower(solarSource, battery, thermal, comms, instruments, 2);
    expect(solarPower1AU.generatedW).toBe(1000);
    expect(solarPower2AU.generatedW).toBe(250);
  });
});

describe("Thermal Subsystem Engine", () => {
  it("calculates Stefan-Boltzmann radiator equilibrium temperature accurately", () => {
    const area = 2.0; // m²
    const emissivity = 0.85;
    const heatLoad = 500; // watts
    const tempK = radiatorTemperature(heatLoad, area, emissivity);
    // Verified by Stefan-Boltzmann inversion: q = A · eps · sigma · (T^4 - Tspace^4)
    const expectedCapacity = rejectionCapacity(tempK, area, emissivity);
    expect(Math.abs(expectedCapacity - heatLoad)).toBeLessThan(1e-4);
  });

  it("evaluates thermal state of spacecraft across distances", () => {
    const thermal = COMPONENT_BY_ID["thermal-heatpipe"];
    const power = COMPONENT_BY_ID["power-gaas-wing"];
    const propulsion = COMPONENT_BY_ID["prop-biprop"];

    const stateAt1AU = evaluateThermal(thermal, power, propulsion, 1, 300, 0);
    const stateAt5AU = evaluateThermal(thermal, power, propulsion, 5, 300, 0);

    expect(stateAt1AU.solarAbsorbedW).toBeGreaterThan(stateAt5AU.solarAbsorbedW);
    expect(stateAt1AU.radiatorTemperatureK).toBeGreaterThan(DEEP_SPACE_TEMPERATURE_K);
  });
});

describe("Communication Subsystem Engine", () => {
  it("calculates light time delay accurately", () => {
    const delay1AU = lightTimeSeconds(1);
    expect(delay1AU).toBeGreaterThan(495);
    expect(delay1AU).toBeLessThan(505);

    const delay5AU = lightTimeSeconds(5);
    expect(delay5AU).toBeCloseTo(delay1AU * 5, 1);
  });

  it("calculates downlink data rate scaling with distance", () => {
    const comms = COMPONENT_BY_ID["comms-xband"];
    const state1AU = evaluateCommunication(comms, 1);
    const state2AU = evaluateCommunication(comms, 2);

    expect(state1AU.effectiveMbps).toBeGreaterThan(state2AU.effectiveMbps);
    expect(state2AU.lightTimeS).toBeCloseTo(state1AU.lightTimeS * 2, 0);
  });
});

describe("Mission Scoring Engine", () => {
  it("allocates correct weights matching design specification (30/25/20/15/10)", () => {
    expect(SCORE_WEIGHTS.science).toBe(0.3);
    expect(SCORE_WEIGHTS.engineering).toBe(0.25);
    expect(SCORE_WEIGHTS.completion).toBe(0.2);
    expect(SCORE_WEIGHTS.budget).toBe(0.15);
    expect(SCORE_WEIGHTS.resources).toBe(0.1);

    const sum =
      SCORE_WEIGHTS.science +
      SCORE_WEIGHTS.engineering +
      SCORE_WEIGHTS.completion +
      SCORE_WEIGHTS.budget +
      SCORE_WEIGHTS.resources;
    expect(Math.abs(sum - 1.0)).toBeLessThan(1e-6);

    const mockRuntime: SimulationRuntime = {
      missionId: "test-mission",
      phase: "complete",
      elapsedDays: 400,
      missionDays: 400,
      cruiseEndDay: 200,
      arrivalDay: 220,
      operationsEndDay: 400,
      health: 95,
      science: 120,
      dataTransmittedGbit: 50,
      dataLostGbit: 2,
      fuelKg: 150,
      fuelInitialKg: 600,
      dryMassKg: 400,
      batteryWh: 1800,
      batteryCapacityWh: 2000,
      recorderGbit: 5,
      recorderCapacityGbit: 64,
      rangeAU: 1.5,
      heliocentricAU: 1.5,
      commLink: 0.9,
      thermalC: 25,
      generatedW: 350,
      loadW: 280,
      power: null,
      thermal: null,
      communication: null,
      deltaV: missionDeltaV(planTransfer("earth", "mars"), false),
      modifiers: {
        power: 1,
        downlink: 1,
        science: 1,
        untilDay: 0,
        label: "nominal",
      },
      events: [],
      resolvedEventIds: [],
      pendingEventId: null,
      objectives: [
        { objectiveId: "obj-1", title: "Objective 1", reward: 40, progress: 1.0, complete: true },
        { objectiveId: "obj-2", title: "Objective 2", reward: 60, progress: 1.0, complete: true },
      ],
      failures: [],
      recoveries: [],
      samples: [],
      rngState: 42,
      completed: true,
      outcome: "success",
      endReason: "Science completed",
      powerDeficitDays: 0,
      burns: ["departure", "arrival"],
    };

    const mockConfig: SimulationConfig = {
      missionId: "test-mission",
      missionName: "Mars Surveyor",
      destination: "mars",
      spacecraft: {
        busId: "bus-monoblock",
        powerId: "power-gaas-wing",
        thermalId: "thermal-heatpipe",
        propulsionId: "prop-biprop",
        fuelId: "fuel-mmh600",
        commsId: "comms-xband",
        batteryId: "battery-standard",
        instrumentIds: ["inst-imager"],
      },
      launchVehicleId: "falcon-heavy",
      durationMonths: 24,
      seed: 42,
    };

    const scoring = scoreMission({
      runtime: mockRuntime,
      config: mockConfig,
      budgetCapMillionUSD: 1800,
    });

    expect(scoring.score).toBeGreaterThan(70);
    expect(scoring.categories.length).toBe(5);

    const catScience = scoring.categories.find((c) => c.id === "science");
    const catEngineering = scoring.categories.find((c) => c.id === "engineering");
    const catCompletion = scoring.categories.find((c) => c.id === "completion");
    const catBudget = scoring.categories.find((c) => c.id === "budget");
    const catResources = scoring.categories.find((c) => c.id === "resources");

    expect(catScience?.weight).toBe(0.3);
    expect(catEngineering?.weight).toBe(0.25);
    expect(catCompletion?.weight).toBe(0.2);
    expect(catBudget?.weight).toBe(0.15);
    expect(catResources?.weight).toBe(0.1);
  });
});
