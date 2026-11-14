import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import type { GraphicsQuality } from "@/types";

/**
 * WebGL capability detection.
 *
 * A complex 3D scene must never make the whole interface unusable, so the
 * canvas is only mounted when the browser reports WebGL support and the
 * caller receives a graceful fallback otherwise.
 */

function detectWebGL(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") return { supported: false, reason: "No window object available." };
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!context) {
      return {
        supported: false,
        reason: "This browser reports no WebGL context. Enable hardware acceleration to view the 3D scene.",
      };
    }
    return { supported: true };
  } catch (error) {
    return {
      supported: false,
      reason: `WebGL initialisation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export interface SceneCanvasProps {
  children: ReactNode;
  quality?: GraphicsQuality;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  onCreated?: () => void;
}

/** Quality presets for the renderer. */
function rendererFor(quality: GraphicsQuality) {
  switch (quality) {
    case "low":
      return { dpr: [0.6, 1] as [number, number], antialias: false, segments: 16 };
    case "medium":
      return { dpr: [0.8, 1.4] as [number, number], antialias: true, segments: 24 };
    default:
      return { dpr: [1, 2] as [number, number], antialias: true, segments: 32 };
  }
}

export function SceneCanvas({
  children,
  quality = "high",
  cameraPosition = [0, 22, 52],
  cameraFov = 45,
  className,
  onCreated,
}: SceneCanvasProps) {
  const [support] = useState(() => detectWebGL());
  const settings = rendererFor(quality);

  useEffect(() => {
    onCreated?.();
  }, [onCreated]);

  if (!support.supported) {
    return (
      <div
        className={`flex h-full min-h-[320px] items-center justify-center border border-line bg-panel p-8 text-center ${className ?? ""}`}
      >
        <div className="max-w-md">
          <div className="label-tech mb-2">3D View Unavailable</div>
          <p className="text-sm text-ink-muted">{support.reason}</p>
          <p className="mt-3 text-xs text-ink-muted">
            The mission planner, engineering tables and simulation remain fully usable without the 3D scene.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      className={className}
      dpr={settings.dpr}
      gl={{
        antialias: settings.antialias,
        powerPreference: "high-performance",
        alpha: false,
        preserveDrawingBuffer: false,
      }}
      camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 2000 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color("#070a10");
      }}
      frameloop="always"
    >
      <Suspense fallback={null}>{children}</Suspense>
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}
