import { useMemo } from "react";
import * as THREE from "three";
import { hashString, nextRandom } from "@/utils/rng";

/**
 * Procedural starfield.
 *
 * The stars are generated deterministically from a fixed seed so the sky is
 * identical on every load and the application never depends on an external
 * texture or network request.
 */

export interface StarfieldProps {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
}

export function Starfield({ count = 2600, radius = 320, color = "#dce8f5", size = 0.55 }: StarfieldProps) {
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rng = { state: hashString("missionforge-starfield") || 11 };
    const rand = () => {
      const result = nextRandom(rng.state);
      rng.state = result.state;
      return result.value;
    };
    const tint = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      // Uniform distribution on a sphere shell.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = radius * (0.85 + rand() * 0.15);
      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(theta);

      // Slight colour variation: most stars white-blue, a few warm.
      const warmth = rand();
      tint.setHSL(warmth < 0.75 ? 0.58 : 0.08, 0.25 + rand() * 0.35, 0.72 + rand() * 0.25);
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    return { positions, colors };
  }, [count, radius]);

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        vertexColors
        color={color}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}
