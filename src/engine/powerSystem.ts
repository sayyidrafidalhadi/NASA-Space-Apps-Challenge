import { BATTERY_DEPTH_OF_DISCHARGE, COMMS_DUTY_CYCLE, INSTRUMENT_DUTY_CYCLE } from "./constants";
import type { ComponentSpec, DestinationId } from "@/types";

/**
 * Electrical power system.
 *
 * Solar arrays follow the inverse-square law: power falls with the square of
 * the heliocentric distance, so a 480 W array at 1 AU delivers 480/5.2² =
 * 17.8 W at Jupiter. Radioisotope sources are modelled as constant-output
 * and independent of distance.
 *
 * Loads use duty cycles rather than peak draw: instruments average 55% of
 * their rated power and the transmitter keys for 35% of the time.
 */

export interface PowerBreakdown {
  /** Generation at the current heliocentric distance, watts. */
  generatedW: number;
  /** Generation at 1 AU, watts. */
  generatedAt1AUW: number;
  /** True when the source output does not depend on solar distance. */
  constantPower: boolean;
  /** Fraction of the 1 AU output remaining at the current distance. */
  solarFraction: number;
  /** Average instrument load, watts. */
  instrumentLoadW: number;
  /** Average communication load, watts. */
  commsLoadW: number;
  /** Thermal control load, watts. */
  thermalLoadW: number;
  /** Battery and power-harness housekeeping, watts. */
  systemLoadW: number;
  /** Total average demand, watts. */
  averageLoadW: number;
  /** Peak demand with every instrument and the transmitter at full power. */
  peakLoadW: number;
  /** Generation minus average demand, watts. */
  netPowerW: number;
  /** Generation minus peak demand, watts. */
  peakNetPowerW: number;
  /** Net power as a percentage of generation. */
  marginPct: number;
  /** Energy needed to hold peak load for one 8-hour ground pass, kWh. */
  passEnergyKWh: number;
  /** Usable battery energy, kWh. */
  usableBatteryKWh: number;
  /** True when the spacecraft cannot even cover its average demand. */
  deficit: boolean;
  /** True when peak demand cannot be sustained without the battery. */
  peakDeficit: boolean;
}

/** Solar flux factor at a heliocentric distance: 1 / d². */
export function solarFluxFactor(distanceAU: number): number {
  if (distanceAU <= 0) return 0;
  return 1 / (distanceAU * distanceAU);
}

/** Generation of a power source at a given heliocentric distance, watts. */
export function generatedPower(power: ComponentSpec, distanceAU: number): number {
  if (power.constantPower) return power.powerGenerationW;
  return power.powerGenerationW * solarFluxFactor(distanceAU);
}

/**
 * Full power budget for a spacecraft at a given distance from the Sun.
 */
export function evaluatePower(
  power: ComponentSpec,
  battery: ComponentSpec,
  thermal: ComponentSpec,
  comms: ComponentSpec,
  instruments: ComponentSpec[],
  distanceAU: number,
): PowerBreakdown {
  const generatedAt1AUW = power.powerGenerationW;
  const generatedW = generatedPower(power, distanceAU);
  const solarFraction = power.constantPower ? 1 : solarFluxFactor(distanceAU);

  const instrumentLoadW = instruments.reduce((sum, item) => sum + item.powerLoadW, 0) * INSTRUMENT_DUTY_CYCLE;
  const commsLoadW = comms.powerLoadW * COMMS_DUTY_CYCLE;
  const thermalLoadW = thermal.powerLoadW;
  const systemLoadW =
    battery.powerLoadW +
    power.powerLoadW +
    instruments.reduce((sum, item) => sum + item.powerLoadW, 0) * 0.05;

  const averageLoadW = instrumentLoadW + commsLoadW + thermalLoadW + systemLoadW;
  const peakLoadW =
    instruments.reduce((sum, item) => sum + item.powerLoadW, 0) +
    comms.powerLoadW +
    thermalLoadW +
    systemLoadW;

  const netPowerW = generatedW - averageLoadW;
  const peakNetPowerW = generatedW - peakLoadW;
  const marginPct = generatedW > 0 ? (netPowerW / generatedW) * 100 : -100;
  const passEnergyKWh = (Math.max(0, peakLoadW - generatedW) * 8) / 1000;
  const usableBatteryKWh = ((battery.capacityWh ?? 0) / 1000) * BATTERY_DEPTH_OF_DISCHARGE;

  return {
    generatedW,
    generatedAt1AUW,
    constantPower: power.constantPower,
    solarFraction,
    instrumentLoadW,
    commsLoadW,
    thermalLoadW,
    systemLoadW,
    averageLoadW,
    peakLoadW,
    netPowerW,
    peakNetPowerW,
    marginPct,
    passEnergyKWh,
    usableBatteryKWh,
    deficit: netPowerW < 0,
    peakDeficit: peakNetPowerW < 0 && passEnergyKWh > usableBatteryKWh,
  };
}

/**
 * Simple battery state machine used by the simulation loop.
 * Energy is stored in watt-hours.
 */
export interface BatteryState {
  energyWh: number;
  capacityWh: number;
  fraction: number;
  charging: boolean;
  /** Charge lost to loads the array cannot cover, watt-hours. */
  deficitWh: number;
}

export function createBattery(capacityWh: number): BatteryState {
  return {
    energyWh: capacityWh,
    capacityWh,
    fraction: 1,
    charging: false,
    deficitWh: 0,
  };
}

/**
 * Advance the battery by `hours` given the power balance.
 * `generationW` above `loadW` charges the battery, otherwise it discharges.
 */
export function stepBattery(
  battery: BatteryState,
  generationW: number,
  loadW: number,
  hours: number,
): BatteryState {
  const deltaWh = (generationW - loadW) * hours;
  const energyWh = Math.min(battery.capacityWh, Math.max(0, battery.energyWh + deltaWh));
  const fraction = battery.capacityWh > 0 ? energyWh / battery.capacityWh : 0;
  return {
    ...battery,
    energyWh,
    fraction,
    charging: deltaWh > 0,
    deficitWh: battery.deficitWh + Math.max(0, -deltaWh),
  };
}

/**
 * Expected science return for a payload, accounting for the downlink rate
 * and the recorder buffer.
 */
export interface DataBudget {
  generatedGbitPerMonth: number;
  downlinkGbitPerMonth: number;
  recorderGbit: number;
  monthsToRecorderFull: number | null;
  transmittedGbit: number;
  lostGbit: number;
  downlinkLimited: boolean;
}

/** Megabits per second → gigabits per month, using the DSN contact model. */
export function downlinkCapacityGbitPerMonth(mbps: number, contactHoursPerDay: number): number {
  const secondsPerMonth = 30.4375 * 86400;
  const contactSeconds = contactHoursPerDay * 3600;
  return (mbps * contactSeconds * secondsPerMonth) / 1000;
}

export function evaluateDataBudget(
  instruments: ComponentSpec[],
  downlinkMbps: number,
  recorderGbit: number,
  missionMonths: number,
  contactHoursPerDay = 8,
): DataBudget {
  const generatedGbitPerMonth = instruments.reduce((sum, item) => sum + (item.dataRateMbps ?? 0), 0) * 30.4375 * 86400 / 1000;
  const downlinkGbitPerMonth = downlinkCapacityGbitPerMonth(downlinkMbps, contactHoursPerDay);
  const surplus = generatedGbitPerMonth - downlinkGbitPerMonth;
  const monthsToRecorderFull = surplus > 0 ? recorderGbit / surplus : null;

  const totalGenerated = generatedGbitPerMonth * missionMonths;
  const transmitted = Math.min(totalGenerated, downlinkGbitPerMonth * missionMonths + recorderGbit);

  return {
    generatedGbitPerMonth,
    downlinkGbitPerMonth,
    recorderGbit,
    monthsToRecorderFull,
    transmittedGbit: transmitted,
    lostGbit: Math.max(0, totalGenerated - transmitted),
    downlinkLimited: surplus > 0,
  };
}

/**
 * Science value produced per gigabit for a payload at a given destination.
 * Affinity matters more than raw bandwidth.
 */
export function sciencePerGbit(instruments: ComponentSpec[], destination: DestinationId): number {
  const totalRate = instruments.reduce((sum, item) => sum + (item.dataRateMbps ?? 0), 0);
  if (totalRate <= 0) return 0;
  const weighted = instruments.reduce(
    (sum, item) => sum + (item.dataRateMbps ?? 0) * (item.scienceWeight ?? 1) * (item.affinity?.[destination] ?? 1),
    0,
  );
  return (weighted / totalRate) * 0.13;
}
