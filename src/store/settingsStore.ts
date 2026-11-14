import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppSettings, GraphicsQuality } from "@/types";

/**
 * Application settings.
 *
 * Graphics quality, the education mode and the display toggles are persisted
 * so a player keeps their preferred level of detail between sessions.
 */

export const SETTINGS_STORAGE_KEY = "missionforge.settings";
export const SETTINGS_STORAGE_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  graphicsQuality: "high",
  showOrbits: true,
  showLabels: true,
  showScaleNotice: true,
  educationMode: "guided",
  soundEnabled: false,
  reduceMotion: false,
};

export interface SettingsStoreState extends AppSettings {
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleScaleNotice: () => void;
  setEducationMode: (mode: AppSettings["educationMode"]) => void;
  toggleSound: () => void;
  toggleReduceMotion: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
      toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
      toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
      toggleScaleNotice: () => set((state) => ({ showScaleNotice: !state.showScaleNotice })),
      setEducationMode: (educationMode) => set({ educationMode }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleReduceMotion: () => set((state) => ({ reduceMotion: !state.reduceMotion })),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        graphicsQuality: state.graphicsQuality,
        showOrbits: state.showOrbits,
        showLabels: state.showLabels,
        showScaleNotice: state.showScaleNotice,
        educationMode: state.educationMode,
        soundEnabled: state.soundEnabled,
        reduceMotion: state.reduceMotion,
      }),
      migrate: (persisted) => {
        const data = persisted as Partial<AppSettings> | undefined;
        if (!data) return DEFAULT_SETTINGS;
        return {
          ...DEFAULT_SETTINGS,
          ...data,
          graphicsQuality: (["low", "medium", "high"] as GraphicsQuality[]).includes(
            data.graphicsQuality as GraphicsQuality,
          )
            ? (data.graphicsQuality as GraphicsQuality)
            : DEFAULT_SETTINGS.graphicsQuality,
        };
      },
    },
  ),
);
