import { RADIATOR_REJECTION_RATIO, SOLAR_CONSTANT_WM2, THERMAL_LIMIT_C } from "./constants";
import type { ComponentSpec } from "@/types";

/**
 * Thermal control model.
 *
 * The spacecraft is treated as a steady-state balance: everything that enters
 * as sunlight or is dissipated electrically must leave through the radiator.
 *
 *     q_rejected = A · ε · σ · (T_rad⁴ − T_space⁴)
 *
 * with the Stefan–Boltzmann constant σ = 5.670×10⁻⁸ W m⁻² K⁻⁴ and a deep
 * space sink at 3 K. The radiator temperature is solved from the heat load
 * and the radiator area. The model ignores conduction paths into the
 * electronics in detail, transient soak times, propellant tank boiling and
 * heater duty cycles.
 */

/** Stefan–Boltzmann constant, W m⁻² K⁻⁴. */
export const STEFAN_BOLTZMANN = 5.670374e-8;

/** Deep space sink temperature, K. */
export const DEEP_SPACE_TEMPERATURE_K = 3;

/** Emissivity of a deployed radiator surface. */
export const RADIATOR_EMISSIVITY = 0.85;

export type ThermalStatus = "nominal" | "warm" | "hot" | "critical";

export interface ThermalState {
  /** Solar power absorbed by the spacecraft, watts. */
  solarAbsorbedW: number;
  /** Heat from electrical dissipation, watts. */
  electricalWasteHeatW: number;
  /** Heat rejected by the propulsion system, watts. */
  propulsionWasteHeatW: number;
  /** Total heat that must be rejected, watts. */
  totalHeatW: number;
  radiatorAreaM2: number;
  radiatorEmissivity: number;
  /** Radiator surface temperature, K and °C. */
  radiatorTemperatureK: number;
  radiatorTemperatureC: number;
  /** Electronics temperature, °C. */
  electronicsTemperatureC: number;
  /** Heat the radiator can reject at its rated temperature, watts. */
  rejectionCapacityW: number;
  /** Heat with nowhere to go, watts. */
  excessHeatW: number;
  /** Maximum radiator temperature the thermal system is rated for, °C. */
  limitC: number;
  status: ThermalStatus;
  notes: string[];
}

/** Radiator temperature required to reject a given heat load. */
export function radiatorTemperature(totalHeatW: number, areaM2: number, emissivity: number): number {
  if (areaM2 <= 0 || totalHeatW <= 0) return DEEP_SPACE_TEMPERATURE_K;
  const fourth = totalHeatW / (areaM2 * emissivity * STEFAN_BOLTZMANN) + DEEP_SPACE_TEMPERATURE_K ** 4;
  return fourth ** 0.25;
}

/** Heat the radiator can reject at a given temperature. */
export function rejectionCapacity(temperatureK: number, areaM2: number, emissivity: number): number {
  return (
    areaM2 *
    emissivity *
    STEFAN_BOLTZMANN *
    (temperatureK ** 4 - DEEP_SPACE_TEMPERATURE_K ** 4)
  );
}

/** Rated maximum radiator temperature for a thermal control component, °C. */
export function thermalLimitC(thermal: ComponentSpec): number {
  const rating = thermal.thermalControl ?? 40;
  return 280 + rating * 1.4;
}

/**
 * Evaluate the thermal state of a spacecraft.
 */
export function evaluateThermal(
  thermal: ComponentSpec,
  power: ComponentSpec,
  propulsion: ComponentSpec,
  distanceAU: number,
  averageLoadW: number,
  thrustN: number,
): ThermalState {
  const notes: string[] = [];

  // Sunlit cross-section and absorptivity are simplified constants.
  const solarAbsorbedW = distanceAU > 0 ? (SOLAR_CONSTANT_WM2 / distanceAU ** 2) * 2.0 * 0.3 : 0;
  const electricalWasteHeatW = averageLoadW * RADIATOR_REJECTION_RATIO;

  // Electric propulsion dumps its entire input power as waste heat.
  const isElectric = (propulsion.ispSeconds ?? 0) > 1000;
  const propulsionWasteHeatW = isElectric ? thrustN * (propulsion.ispSeconds ?? 0) * 9.80665 : 0;

  const totalHeatW = solarAbsorbedW + electricalWasteHeatW + propulsionWasteHeatW;
  const radiatorAreaM2 = thermal.radiatorAreaM2 ?? 0;
  const radiatorEmissivity = RADIATOR_EMISSIVITY;
  const radiatorTemperatureK = radiatorTemperature(totalHeatW, radiatorAreaM2, radiatorEmissivity);
  const radiatorTemperatureC = radiatorTemperatureK - 273.15;
  const limitC = thermalLimitC(thermal);
  const capacity = rejectionCapacity(limitC + 273.15, radiatorAreaM2, radiatorEmissivity);
  const excessHeatW = Math.max(0, totalHeatW - capacity);

  let status: ThermalStatus = "nominal";
  if (excessHeatW > 0) {
    status = "critical";
    notes.push(
      `The radiator can only reject ${capacity.toFixed(0)} W of the ${totalHeatW.toFixed(0)} W heat load. ` +
        `${excessHeatW.toFixed(0)} W has nowhere to go.`,
    );
  } else if (radiatorTemperatureC > limitC * 0.92) {
    status = "hot";
    notes.push(`Radiator would run at ${radiatorTemperatureC.toFixed(0)} °C, close to the ${limitC.toFixed(0)} °C rating.`);
  } else if (radiatorTemperatureC > limitC * 0.75) {
    status = "warm";
    notes.push(`Radiator would run at ${radiatorTemperatureC.toFixed(0)} °C — warm, but inside the rating.`);
  }

  if (propulsionWasteHeatW > 500) {
    notes.push(
      `Electric propulsion dumps ${propulsionWasteHeatW.toFixed(0)} W of waste heat into the radiator. ` +
        "A larger radiator area is required.",
    );
  }
  if (power.constantPower && radiatorAreaM2 < 5) {
    notes.push(
      "A radioisotope source rejects around 2 kW of thermal power. The radiator area here is too small for it.",
    );
  }

  const electronicsTemperatureC = radiatorTemperatureC + 12;

  return {
    solarAbsorbedW,
    electricalWasteHeatW,
    propulsionWasteHeatW,
    totalHeatW,
    radiatorAreaM2,
    radiatorEmissivity,
    radiatorTemperatureK,
    radiatorTemperatureC,
    electronicsTemperatureC,
    rejectionCapacityW: capacity,
    excessHeatW,
    limitC,
    status,
    notes,
  };
}

/** Electronics temperature above which the spacecraft starts losing health. */
export const ELECTRONICS_CRITICAL_C = THERMAL_LIMIT_C + 20;
