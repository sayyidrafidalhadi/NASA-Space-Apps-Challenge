import { create } from "zustand";
import {
  createSimulation,
  resolveEvent,
  stepSimulation,
  SIM_STEP_DAYS,
  type SimulationConfig,
  type SimulationRuntime,
} from "@/engine/simulation";
import { seedFromKey } from "@/utils/rng";
import { DEFAULT_SPACECRAFT_CONFIG } from "@/engine/spacecraft";
import type { DestinationId, SpacecraftConfig } from "@/types";

/**
 * Simulation store.
 *
 * The store owns the mission runtime and the clock. The clock itself lives
 * in `hooks/useSimulationClock.ts`; this store only exposes the state and
 * the transitions so that the simulation can be driven from a test as well as
 * from the interface.
 */

export type SimulationSpeed = 1 | 2 | 4 | 8;

export interface SimulationStoreState {
  runtime: SimulationRuntime | null;
  config: SimulationConfig | null;
  running: boolean;
  speed: SimulationSpeed;
  /** Days of simulated time still owed to the simulation. */
  accumulator: number;
  /** Set when an event is waiting for a decision. */
  awaitingDecision: boolean;

  launch: (input: {
    missionId: string;
    missionName: string;
    destination: DestinationId;
    durationMonths: number;
    spacecraft: SpacecraftConfig;
    launchVehicleId: string | null;
  }) => void;
  advance: (days: number) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  decide: (choiceId: string) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStoreState>()((set, get) => ({
  runtime: null,
  config: null,
  running: false,
  speed: 4,
  accumulator: 0,
  awaitingDecision: false,

  launch: (input) => {
    const key = [
      input.missionId,
      input.destination,
      input.durationMonths,
      input.spacecraft.busId,
      input.spacecraft.powerId,
      input.spacecraft.commsId,
      input.spacecraft.instrumentIds.join("|"),
    ].join("::");
    const config: SimulationConfig = {
      missionId: input.missionId,
      missionName: input.missionName,
      destination: input.destination,
      durationMonths: input.durationMonths,
      spacecraft: input.spacecraft,
      launchVehicleId: input.launchVehicleId,
      seed: seedFromKey(key),
    };
    const runtime = createSimulation(config);
    set({ runtime, config, running: true, speed: 4, accumulator: 0, awaitingDecision: false });
  },

  advance: (days) => {
    const { runtime, config, accumulator, running, awaitingDecision } = get();
    if (!runtime || !config || !running || awaitingDecision) return;

    const total = accumulator + days;
    const steps = Math.floor(total / SIM_STEP_DAYS);
    if (steps <= 0) {
      set({ accumulator: total });
      return;
    }
    const next = stepSimulation(runtime, config, steps * SIM_STEP_DAYS);
    set({
      runtime: next,
      accumulator: total - steps * SIM_STEP_DAYS,
      awaitingDecision: Boolean(next.pendingEventId),
      running: next.completed ? false : get().running,
    });
  },

  pause: () => set({ running: false }),
  resume: () => set((state) => ({ running: state.runtime && !state.runtime.completed ? true : state.running })),
  toggle: () => set((state) => ({ running: !state.running })),
  setSpeed: (speed) => set({ speed }),

  decide: (choiceId) => {
    const { runtime, config } = get();
    if (!runtime || !config || !runtime.pendingEventId) return;
    const next = resolveEvent(runtime, runtime.pendingEventId, choiceId, config);
    set({ runtime: next, awaitingDecision: false });
  },

  reset: () => set({ runtime: null, config: null, running: false, accumulator: 0, awaitingDecision: false }),
}));

/** Default build used when a mission has never been configured. */
export { DEFAULT_SPACECRAFT_CONFIG };
