import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MissionConfig, MissionReport } from "@/types";
import { DESTINATION_PROFILES } from "@/data/missionObjectives";

/**
 * Mission configuration store.
 *
 * Missions, the active mission pointer and the archive of completed mission
 * reports are persisted to localStorage under a versioned key. Corrupted or
 * outdated payloads are discarded rather than crashing the application.
 */

export const MISSIONS_STORAGE_KEY = "missionforge.missions";
export const MISSIONS_STORAGE_VERSION = 1;

export interface MissionStoreState {
  missions: MissionConfig[];
  currentMissionId: string | null;
  reports: MissionReport[];
  createMission: (input: Partial<MissionConfig>) => MissionConfig;
  updateMission: (id: string, patch: Partial<MissionConfig>) => void;
  deleteMission: (id: string) => void;
  selectMission: (id: string | null) => void;
  saveReport: (report: MissionReport) => void;
  clearReports: () => void;
}

function newId(): string {
  return `mission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isMissionConfig(value: unknown): value is MissionConfig {
  if (!value || typeof value !== "object") return false;
  const mission = value as Partial<MissionConfig>;
  return (
    typeof mission.id === "string" &&
    typeof mission.name === "string" &&
    typeof mission.destinationId === "string" &&
    Array.isArray(mission.objectiveIds) &&
    typeof mission.durationMonths === "number" &&
    typeof mission.budgetMillionUSD === "number"
  );
}

export const useMissionStore = create<MissionStoreState>()(
  persist(
    (set) => ({
      missions: [],
      currentMissionId: null,
      reports: [],

      createMission: (input) => {
        const destinationId = input.destinationId ?? "mars";
        const profile = DESTINATION_PROFILES[destinationId];
        const now = Date.now();
        const mission: MissionConfig = {
          id: input.id ?? newId(),
          name: input.name ?? `Untitled ${profile?.bodyId ?? destinationId} mission`,
          destinationId,
          objectiveIds: input.objectiveIds ?? [],
          durationMonths: input.durationMonths ?? profile?.recommendedDurationMonths ?? 24,
          budgetMillionUSD: input.budgetMillionUSD ?? profile?.budgetMillionUSD ?? 1200,
          launchVehicleId: input.launchVehicleId ?? null,
          status: input.status ?? "draft",
          createdAt: input.createdAt ?? now,
          updatedAt: now,
        };
        set((state) => ({
          missions: [mission, ...state.missions.filter((item) => item.id !== mission.id)],
          currentMissionId: mission.id,
        }));
        return mission;
      },

      updateMission: (id, patch) =>
        set((state) => ({
          missions: state.missions.map((mission) =>
            mission.id === id ? { ...mission, ...patch, updatedAt: Date.now() } : mission,
          ),
        })),

      deleteMission: (id) =>
        set((state) => ({
          missions: state.missions.filter((mission) => mission.id !== id),
          currentMissionId: state.currentMissionId === id ? null : state.currentMissionId,
        })),

      selectMission: (id) => set({ currentMissionId: id }),

      saveReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports.filter((item) => item.missionId !== report.missionId)].slice(0, 24),
        })),

      clearReports: () => set({ reports: [] }),
    }),
    {
      name: MISSIONS_STORAGE_KEY,
      version: MISSIONS_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        missions: state.missions,
        currentMissionId: state.currentMissionId,
        reports: state.reports,
      }),
      migrate: (persisted) => {
        const data = persisted as Partial<MissionStoreState> | undefined;
        if (!data) return { missions: [], currentMissionId: null, reports: [] };
        return {
          missions: Array.isArray(data.missions) ? data.missions.filter(isMissionConfig) : [],
          currentMissionId:
            typeof data.currentMissionId === "string" &&
            (data.missions ?? []).some((m) => m.id === data.currentMissionId)
              ? data.currentMissionId
              : null,
          reports: Array.isArray(data.reports) ? (data.reports as MissionReport[]) : [],
        };
      },
    },
  ),
);

/** The mission currently being worked on, or null. */
export function useCurrentMission(): MissionConfig | null {
  return useMissionStore((state) => state.missions.find((mission) => mission.id === state.currentMissionId) ?? null);
}
