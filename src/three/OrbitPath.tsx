import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { orbitRadius } from "./scale";
import type { Planet } from "@/types";

/**
 * The orbital path of a body, drawn as a closed circle in the ecliptic
 * plane. The radius follows the compressed visualisation scale, so the
 * distance between two rings is not the real distance between the planets.
 */

export interface OrbitPathProps {
  planet: Planet;
  color?: string;
  opacity?: number;
  dashed?: boolean;
}

export function OrbitPath({ planet, color = "#253548", opacity = 0.9, dashed = false }: OrbitPathProps) {
  const points = useMemo(() => {
    const radius = orbitRadius(planet.semiMajorAxisAU);
    const segments = 160;
    return Array.from({ length: segments + 1 }, (_, index) => {
      const angle = (index / segments) * Math.PI * 2;
      return [radius * Math.cos(angle), 0, radius * Math.sin(angle)] as [number, number, number];
    });
  }, [planet.semiMajorAxisAU]);

  if (planet.id === "sun") return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
      dashed={dashed}
      dashSize={0.4}
      gapSize={0.3}
      depthWrite={false}
    />
  );
}
