import { useMemo } from "react";
import { PLANETS } from "@/data/planets";
import { OrbitPath } from "./OrbitPath";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";
import { Sun } from "./Sun";
import { MissionTrajectory } from "./MissionTrajectory";
import { scenePosition } from "./scale";
import type { BodyId, GraphicsQuality } from "@/types";

/**
 * The interactive solar system.
 *
 * The scene is rendered in the ecliptic plane with the compressed visual
 * scale documented in `three/scale.ts`. Bodies are positioned from their
 * published orbital elements at the requested epoch.
 */

export interface SolarSystemProps {
  quality: GraphicsQuality;
  selectedId?: BodyId | null;
  destinationId?: BodyId | null;
  showOrbits?: boolean;
  showLabels?: boolean;
  epochDays?: number;
  onSelect?: (id: BodyId) => void;
  /** Show the planned transfer trajectory to the destination. */
  showTrajectory?: boolean;
  /** Fraction of the transfer completed, 0–1. */
  trajectoryProgress?: number;
}

export function SolarSystem({
  quality,
  selectedId = null,
  destinationId = null,
  showOrbits = true,
  showLabels = true,
  epochDays = 0,
  onSelect,
  showTrajectory = false,
  trajectoryProgress = 0,
}: SolarSystemProps) {
  const bodies = useMemo(() => PLANETS.filter((planet) => planet.id !== "sun"), []);

  return (
    <group>
      <Starfield count={quality === "low" ? 900 : quality === "medium" ? 1800 : 3000} />

      <Sun quality={quality} />

      {showOrbits
        ? bodies.map((planet) => (
            <OrbitPath
              key={`orbit-${planet.id}`}
              planet={planet}
              color={destinationId === planet.id ? "#83c9f2" : "#253548"}
              opacity={destinationId === planet.id ? 0.95 : 0.75}
            />
          ))
        : null}

      {bodies.map((planet) => {
        const position = scenePosition(planet.id, epochDays);
        return (
          <group key={planet.id} position={position}>
            <Planet
              planet={planet}
              quality={quality}
              selected={selectedId === planet.id}
              highlighted={destinationId === planet.id}
              showLabel={showLabels}
              onSelect={onSelect}
            />
          </group>
        );
      })}

      {showTrajectory && destinationId ? (
        <MissionTrajectory destinationId={destinationId} progress={trajectoryProgress} />
      ) : null}
    </group>
  );
}
