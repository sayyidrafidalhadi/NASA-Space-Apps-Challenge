import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveSpacecraft } from "@/engine/spacecraft";
import type { GraphicsQuality, SpacecraftConfig } from "@/types";

/**
 * The modular 3D spacecraft.
 *
 * Every visible element is driven by the actual configuration: the size of
 * the solar wings follows the selected power system, the dish follows the
 * communication system, the radiator follows the thermal system, the nozzle
 * follows the propulsion system and the instrument deck follows the payload.
 * Nothing here is decorative-only — changing a component changes the model.
 */

export interface Spacecraft3DProps {
  config: SpacecraftConfig;
  quality?: GraphicsQuality;
  /** Rotate the model slowly for a presentation view. */
  spin?: boolean;
  scale?: number;
}

export function Spacecraft3D({ config, quality = "high", spin = true, scale = 1 }: Spacecraft3DProps) {
  const parts = useMemo(() => resolveSpacecraft(config), [config]);
  const segments = quality === "low" ? 12 : quality === "medium" ? 20 : 32;

  // Geometry drivers derived from the selected components.
  const wingSpan =
    parts.power.id === "power-gaas-mega" ? 3.4 : parts.power.id === "power-gaas-wing" ? 2.2 : parts.power.id === "power-gaas-small" ? 1.35 : 0;
  const wingArea = parts.power.id === "power-gaas-mega" ? 1.5 : parts.power.id === "power-gaas-wing" ? 1.05 : 0.7;

  const dishSize = parts.comms.id === "comms-laser" ? 0.62 : parts.comms.id === "comms-kaband" ? 0.5 : parts.comms.id === "comms-dual" ? 0.42 : parts.comms.id === "comms-xband" ? 0.34 : 0;
  const radiatorSpan = parts.thermal.id === "thermal-loop" ? 1.5 : parts.thermal.id === "thermal-heatpipe" ? 1.1 : parts.thermal.id === "thermal-rhu" ? 0.8 : 0.6;

  const hasEngine = parts.propulsion.id !== "prop-mono";
  const nozzleSize = parts.propulsion.id === "prop-biprop" ? 0.3 : parts.propulsion.id === "prop-hall" ? 0.16 : 0.22;
  const instrumentCount = Math.min(4, parts.instruments.length);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!spin || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.18;
  });

  const busColor = "#1e2229";
  const metalColor = "#d1d5db";
  const panelColor = "#0d1826";
  const radiatorColor = "#ffffff";

  return (
    <group ref={groupRef} scale={scale}>
      {/* Primary structure. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.05, 0.95]} />
        <meshStandardMaterial color={busColor} metalness={0.55} roughness={0.52} />
      </mesh>

      {/* Bus equipment decks. */}
      <mesh position={[0, 0.56, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.78]} />
        <meshStandardMaterial color="#27313d" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0.52, -0.2, 0.5]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.34, 0.5, 0.16]} />
        <meshStandardMaterial color="#4b5b6e" metalness={0.5} roughness={0.45} />
      </mesh>

      {/* Propellant tank, visible under the bus. */}
      <mesh position={[0, -0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 1.0, segments]} />
        <meshStandardMaterial color="#5c6875" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Propulsion: engine nozzle and thruster clusters. */}
      {hasEngine ? (
        <mesh position={[0, -0.92, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[nozzleSize, nozzleSize * 1.5, segments]} />
          <meshStandardMaterial color="#2c333c" metalness={0.7} roughness={0.35} />
        </mesh>
      ) : (
        <mesh position={[0.6, -0.62, 0.35]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.18, 12]} />
          <meshStandardMaterial color="#2c333c" metalness={0.7} roughness={0.35} />
        </mesh>
      )}

      {/* Solar array wings. */}
      {wingSpan > 0
        ? [-1, 1].map((side) => (
            <group key={side} position={[side * (0.85 + wingSpan / 2), 0.1, 0]}>
              <mesh castShadow>
                <boxGeometry args={[wingSpan, 0.035, wingArea]} />
                <meshStandardMaterial
                  color={panelColor}
                  metalness={0.35}
                  roughness={0.32}
                  emissive="#0d2a4a"
                  emissiveIntensity={0.55}
                />
              </mesh>
              {/* Array frame and cell divisions. */}
              <mesh position={[0, 0.026, 0]}>
                <boxGeometry args={[wingSpan * 0.98, 0.006, 0.012]} />
                <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
              </mesh>
              {Array.from({ length: 4 }, (_, index) => (
                <mesh key={index} position={[-wingSpan / 2 + ((index + 1) * wingSpan) / 5, 0.026, 0]}>
                  <boxGeometry args={[0.01, 0.006, wingArea * 0.98]} />
                  <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
                </mesh>
              ))}
              {/* Yoke to the bus. */}
              <mesh position={[-side * (wingSpan / 2 + 0.18), 0, 0]}>
                <boxGeometry args={[0.36, 0.05, 0.07]} />
                <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.35} />
              </mesh>
            </group>
          ))
        : null}

      {/* Radiator panels. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0.12, side * (0.52 + radiatorSpan / 2)]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.95, 0.02, radiatorSpan]} />
          <meshStandardMaterial
            color={radiatorColor}
            metalness={0.2}
            roughness={0.85}
            emissive="#31465c"
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}

      {/* Communication antenna. */}
      {dishSize > 0 ? (
        <group position={[0, 0.72, 0.42]} rotation={[-0.45, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[dishSize, dishSize * 0.18, dishSize * 0.42, segments, 1, true]} />
            <meshStandardMaterial color={metalColor} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -dishSize * 0.28, 0]}>
            <cylinderGeometry args={[0.05, 0.05, dishSize * 0.5, 12]} />
            <meshStandardMaterial color="#6d7a8b" metalness={0.6} roughness={0.45} />
          </mesh>
        </group>
      ) : (
        <group position={[0, 0.68, 0.4]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 10]} />
            <meshStandardMaterial color="#6d7a8b" metalness={0.6} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#a8b6c6" metalness={0.55} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* Payload deck and instruments. */}
      <mesh position={[0, 0, 0.52]}>
        <boxGeometry args={[1.1, 0.7, 0.06]} />
        <meshStandardMaterial color="#2b3542" metalness={0.4} roughness={0.6} />
      </mesh>
      {Array.from({ length: instrumentCount }, (_, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        return (
          <mesh
            key={index}
            position={[-0.28 + column * 0.56, 0.16 - row * 0.34, 0.62]}
            rotation={[0, 0, 0]}
          >
            <boxGeometry args={[0.34, 0.26, 0.16]} />
            <meshStandardMaterial
              color="#c6d2df"
              metalness={0.25}
              roughness={0.5}
              emissive="#0b1826"
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
      {/* Instrument boom with a field sensor. */}
      <mesh position={[-0.78, 0, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 10]} />
        <meshStandardMaterial color={metalColor} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[-1.08, 0, 0.2]}>
        <boxGeometry args={[0.1, 0.12, 0.12]} />
        <meshStandardMaterial color="#dbe5ef" metalness={0.2} roughness={0.55} />
      </mesh>
    </group>
  );
}
