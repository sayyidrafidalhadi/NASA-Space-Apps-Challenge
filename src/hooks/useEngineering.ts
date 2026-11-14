import { useMemo } from "react";
import { useCurrentMission } from "@/store/missionStore";
import { useSpacecraftStore } from "@/store/spacecraftStore";
import { DEFAULT_SPACECRAFT_CONFIG, evaluateSpacecraft } from "@/engine/spacecraft";
import type { EngineeringReport } from "@/engine/spacecraft";

/**
 * The engineering report for the active mission.
 *
 * Everything derived — mass, cost, power, Δv, thermal, communications — is
 * recomputed from the current mission and build whenever either changes, so
 * the laboratory, the launch gate and the orbital planner can never disagree.
 */
export function useEngineeringReport(): EngineeringReport | null {
  const mission = useCurrentMission();
  const builds = useSpacecraftStore((state) => state.builds);

  return useMemo(() => {
    if (!mission) return null;
    const spacecraft = builds[mission.id] ?? DEFAULT_SPACECRAFT_CONFIG;
    return evaluateSpacecraft({
      spacecraft,
      destination: mission.destinationId,
      budgetCapMillionUSD: mission.budgetMillionUSD,
      launchVehicleId: mission.launchVehicleId,
    });
  }, [mission, builds]);
}

/** The build for the active mission. */
export function useActiveBuild() {
  const mission = useCurrentMission();
  const builds = useSpacecraftStore((state) => state.builds);
  return useMemo(() => {
    if (!mission) return DEFAULT_SPACECRAFT_CONFIG;
    return builds[mission.id] ?? DEFAULT_SPACECRAFT_CONFIG;
  }, [mission, builds]);
}
