import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { bodyRadius } from "./scale";
import { getPlanetTexture, getRingTexture, styleForType } from "./textures";
import type { BodyId, GraphicsQuality, Planet } from "@/types";

/**
 * A planet in the scene.
 *
 * The body is a sphere with a deterministic procedural texture, an optional
 * ring system, a slowly rotating axial tilt and an optional HTML label.
 */

export interface PlanetProps {
  planet: Planet;
  quality: GraphicsQuality;
  selected?: boolean;
  highlighted?: boolean;
  showLabel?: boolean;
  onSelect?: (id: BodyId) => void;
}

export function Planet({
  planet,
  quality,
  selected = false,
  highlighted = false,
  showLabel = true,
  onSelect,
}: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const segments = quality === "low" ? 24 : quality === "medium" ? 40 : 64;
  const radius = bodyRadius(planet.radiusKm);

  const texture = useMemo(
    () => getPlanetTexture(planet.id, styleForType(planet.type, planet.name), planet.surfaceColor, quality),
    [planet.id, planet.type, planet.name, planet.surfaceColor, quality],
  );

  const ringTexture = useMemo(
    () => (planet.hasRings ? getRingTexture(planet.id, quality) : null),
    [planet.hasRings, planet.id, quality],
  );

  // Slow axial rotation.
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const rotationSeconds = planet.rotationPeriodHours * 3600;
    const speed = Math.min(0.35, (2 * Math.PI) / Math.max(1, rotationSeconds / 40));
    meshRef.current.rotation.y += speed * delta * 8;
  });

  const emissiveIntensity = selected ? 0.35 : highlighted ? 0.2 : 0.04;

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[0, 0, THREE.MathUtils.degToRad(planet.axialTiltDeg)]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(planet.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[radius, segments, segments / 2]} />
        <meshStandardMaterial
          map={texture}
          roughness={planet.type === "gas giant" || planet.type === "ice giant" ? 0.85 : 0.95}
          metalness={0.02}
          emissive={new THREE.Color(planet.accent)}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Atmospheric limb glow for bodies with an atmosphere. */}
      {planet.type !== "gas giant" && planet.type !== "ice giant" && planet.id !== "mercury" ? (
        <mesh scale={1.06}>
          <sphereGeometry args={[radius, segments / 2, segments / 4]} />
          <meshBasicMaterial
            color={planet.atmosphereColor}
            transparent
            opacity={0.11}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {/* Ring system. */}
      {planet.hasRings && ringTexture ? (
        <mesh rotation={[Math.PI / 2 + THREE.MathUtils.degToRad(planet.axialTiltDeg), 0, 0]}>
          <ringGeometry args={[radius * 1.45, radius * 2.45, 96]} />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            opacity={0.72}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {/* Selection marker. */}
      {selected ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.7, radius * 1.85, 64]} />
          <meshBasicMaterial color="#83c9f2" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ) : null}

      {showLabel ? (
        <Html
          position={[0, radius * 1.5 + 0.35, 0]}
          center
          distanceFactor={undefined}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="select-none whitespace-nowrap text-center">
            <div
              className="label-tech"
              style={{
                color: selected ? "#83c9f2" : "#8495a8",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              {planet.name.toUpperCase()}
            </div>
            {highlighted ? (
              <div
                className="value-num text-[10px]"
                style={{ color: "#53d6a0", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
              >
                DESTINATION
              </div>
            ) : null}
          </div>
        </Html>
      ) : null}

    </group>
  );
}
