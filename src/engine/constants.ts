/**
 * Physical constants and shared model parameters.
 *
 * SI units throughout the engine: metres, kilograms, seconds, watts, joules,
 * kelvin. The 3D scene uses an unrelated visual scale (see `three/scale.ts`)
 * and never feeds numbers back into the simulation.
 */

/* ------------------------------------------------------------ physical constants */

/** Newtonian constant of gravitation, m³ kg⁻¹ s⁻² (CODATA 2018). */
export const G = 6.6743e-11;

/** Standard gravitational parameter of the Sun, m³ s⁻² (IAU 2012). */
export const MU_SUN = 1.32712440018e20;

/** One astronomical unit, m (IAU 2012 definition). */
export const AU = 1.495978707e11;

/** Mean Earth orbital speed used for circular-orbit approximations, m/s. */
export const EARTH_ORBITAL_SPEED = 29785;

/** Standard gravity at the surface, m s⁻². */
export const G0 = 9.80665;

/** Speed of light in vacuum, m s⁻¹. */
export const C_LIGHT = 299792458;

/** Solar constant at 1 AU, W m⁻² (NASA TSIS). */
export const SOLAR_CONSTANT_WM2 = 1361;

/** Earth's heliocentric distance used as the 1 AU reference, m. */
export const EARTH_SEMI_MAJOR_AXIS_M = AU;

/** Seconds in a day. */
export const SECONDS_PER_DAY = 86400;

/** Days in a Julian month (365.25 / 12). */
export const DAYS_PER_MONTH = 30.4375;

/* ------------------------------------------------------------- model parameters */

/**
 * Dry structural margin applied to the summed component mass: tanks, cabling,
 * harnesses, thermal blankets and the separation system.
 */
export const STRUCTURE_FACTOR = 0.12;

/** Multiplier converting a payload mass budget into total launch mass. */
export const LAUNCH_MASS_FACTOR = 1.18;

/** Fraction of the battery capacity that may be used before a brown-out. */
export const BATTERY_DEPTH_OF_DISCHARGE = 0.8;

/** Instrument duty cycle: instruments are not at full power continuously. */
export const INSTRUMENT_DUTY_CYCLE = 0.55;

/** Communication duty cycle: the transmitter is not keyed continuously. */
export const COMMS_DUTY_CYCLE = 0.35;

/** Deep Space Network contact per day, hours. */
export const DSN_CONTACT_HOURS_PER_DAY = 8;

/** Minimum power reserve kept for survival, as a fraction of peak load. */
export const SURVIVAL_POWER_RESERVE = 0.15;

/** Baseline housekeeping load for any spacecraft, watts. */
export const BUS_HOUSEKEEPING_W = 12;

/** Thermal margin below which the spacecraft is at risk of overheating, °C. */
export const THERMAL_LIMIT_C = 45;

/** Heat rejected per watt of electrical dissipation by the thermal system. */
export const RADIATOR_REJECTION_RATIO = 1.35;

/** Spacecraft health lost per unit of power deficit, per mission fraction. */
export const HEALTH_LOSS_PER_POWER_DEFICIT = 1.4;

/** Science points converted from raw instrument output, per Gbit. */
export const SCIENCE_SCALE = 0.11;

/** Gravity assists assumed available on a transfer, as a fraction of Δv. */
export const GRAVITY_ASSIST_FRACTION = 0.08;

/** Gameplay: how much of a science objective is earned by a full objective. */
export const OBJECTIVE_COMPLETION_THRESHOLD = 0.85;
