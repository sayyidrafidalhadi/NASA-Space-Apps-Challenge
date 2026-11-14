import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_SPACECRAFT_CONFIG } from "@/engine/spacecraft";
import type { ComponentCategory, SpacecraftConfig } from "@/types";

/**
 * Spacecraft configuration store.
 *
 * One build is kept per mission, so switching between missions restores the
 * spacecraft exactly as it was configured.
 */

export const SPACECRAFT_STORAGE_KEY = "missionforge.spacecraft";
export const SPACECRAFT_STORAGE_VERSION = 1;

export interface SpacecraftStoreState {
  builds: Record<string, SpacecraftConfig>;
  setComponent: (missionId: string, category: ComponentCategory, componentId: string) => void;
  toggleInstrument: (missionId: string, componentId: string) => void;
  setBuild: (missionId: string, config: SpacecraftConfig) => void;
  resetBuild: (missionId: string) => void;
  removeMission: (missionId: string) => void;
}

const SINGLE_SELECT: ComponentCategory[] = [
  "bus",
  "power",
  "thermal",
  "propulsion",
  "fuel",
  "comms",
  "battery",
];

export const useSpacecraftStore = create<SpacecraftStoreState>()(
  persist(
    (set) => ({
      builds: {},

      setComponent: (missionId, category, componentId) =>
        set((state) => {
          const current = state.builds[missionId] ?? DEFAULT_SPACECRAFT_CONFIG;
          if (!SINGLE_SELECT.includes(category)) return state;
          return {
            builds: { ...state.builds, [missionId]: { ...current, [`${category}Id`]: componentId } },
          };
        }),

      toggleInstrument: (missionId, componentId) =>
        set((state) => {
          const current = state.builds[missionId] ?? DEFAULT_SPACECRAFT_CONFIG;
          const has = current.instrumentIds.includes(componentId);
          const instrumentIds = has
            ? current.instrumentIds.filter((id) => id !== componentId)
            : [...current.instrumentIds, componentId];
          return { builds: { ...state.builds, [missionId]: { ...current, instrumentIds } } };
        }),

      setBuild: (missionId, config) =>
        set((state) => ({ builds: { ...state.builds, [missionId]: config } })),

      resetBuild: (missionId) =>
        set((state) => ({
          builds: { ...state.builds, [missionId]: { ...DEFAULT_SPACECRAFT_CONFIG } },
        })),

      removeMission: (missionId) =>
        set((state) => {
          const builds = { ...state.builds };
          delete builds[missionId];
          return { builds };
        }),
    }),
    {
      name: SPACECRAFT_STORAGE_KEY,
      version: SPACECRAFT_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ builds: state.builds }),
      migrate: (persisted) => {
        const data = persisted as Partial<SpacecraftStoreState> | undefined;
        if (!data || typeof data.builds !== "object" || data.builds === null) return { builds: {} };
        const builds: Record<string, SpacecraftConfig> = {};
        for (const [key, value] of Object.entries(data.builds)) {
          if (value && typeof value === "object") {
            builds[key] = { ...DEFAULT_SPACECRAFT_CONFIG, ...(value as Partial<SpacecraftConfig>) };
          }
        }
        return { builds };
      },
    },
  ),
);

/** The build for a mission, falling back to the default configuration. */
export function buildForMission(state: SpacecraftStoreState, missionId: string): SpacecraftConfig {
  return state.builds[missionId] ?? DEFAULT_SPACECRAFT_CONFIG;
}
