import { useMemo } from "react";
import * as THREE from "three";
import { getGlowTexture } from "./textures";
import { sunRadius } from "./scale";
import type { GraphicsQuality } from "@/types";

/**
 * The Sun: an emissive sphere with an additive corona sprite and the single
 * point light that illuminates the planets.
 */

export interface SunProps {
  quality: GraphicsQuality;
  position?: [number, number, number];
}

export function Sun({ quality, position = [0, 0, 0] }: SunProps) {
  const segments = quality === "low" ? 24 : quality === "medium" ? 40 : 64;
  const glowTexture = useMemo(() => getGlowTexture(quality), [quality]);
  const radius = sunRadius();

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, segments, segments / 2]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>

      <sprite scale={[radius * 7, radius * 7, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.85}
          toneMapped={false}
        />
      </sprite>

      <pointLight color="#fff1d6" intensity={2.4} distance={0} decay={0} />
      <ambientLight intensity={0.06} color="#8fb3d9" />
    </group>
  );
}
