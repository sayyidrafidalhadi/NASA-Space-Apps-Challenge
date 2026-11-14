import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { transferPoint } from "./scale";
import { PLANET_BY_ID } from "@/data/planets";
import type { BodyId } from "@/types";

/**
 * The planned transfer trajectory.
 *
 * Drawn as the half of the transfer ellipse that the spacecraft actually
 * flies, from Earth's position to the destination's orbit. The radius uses
 * the same compressed visualisation scale as the orbits.
 */

export interface MissionTrajectoryProps {
  destinationId: BodyId;
  /** Fraction of the transfer completed, 0–1. */
  progress?: number;
  color?: string;
  opacity?: number;
  showCraft?: boolean;
  craftColor?: string;
  showArrival?: boolean;
}

export function MissionTrajectory({
  destinationId,
  progress = 0,
  color = "#83c9f2",
  opacity = 0.95,
  showCraft = true,
  craftColor = "#e8eef6",
  showArrival = true,
}: MissionTrajectoryProps) {
  const destination = PLANET_BY_ID[destinationId];

  const points = useMemo(() => {
    const segments = 96;
    return Array.from({ length: segments + 1 }, (_, index) => {
      const fraction = index / segments;
      return transferPoint(1, destination.semiMajorAxisAU, fraction, 0);
    });
  }, [destination.semiMajorAxisAU]);

  const craftPosition = useMemo(
    () => transferPoint(1, destination.semiMajorAxisAU, Math.min(1, Math.max(0, progress)), 0),
    [destination.semiMajorAxisAU, progress],
  );

  const arrivalPosition = useMemo(
    () => transferPoint(1, destination.semiMajorAxisAU, 1, 0),
    [destination.semiMajorAxisAU],
  );

  return (
    <group>
      <Line points={points} color={color} lineWidth={1.4} transparent opacity={opacity} depthWrite={false} />

      {showArrival ? (
        <mesh position={arrivalPosition}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} toneMapped={false} />
        </mesh>
      ) : null}

      {showCraft ? (
        <group position={craftPosition}>
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial color={craftColor} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshBasicMaterial color={craftColor} transparent opacity={0.22} toneMapped={false} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
