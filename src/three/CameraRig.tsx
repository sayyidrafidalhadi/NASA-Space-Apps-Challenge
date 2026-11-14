import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/**
 * Camera rig.
 *
 * Wraps the orbit controls and smoothly moves the look-at target to a
 * selected body, so selecting a planet in the navigator flies the camera
 * rather than teleporting it.
 */

export interface CameraRigProps {
  /** Target the camera should look at. */
  focus?: [number, number, number];
  /** Preferred camera distance from the focus point. */
  distance?: number;
  minDistance?: number;
  maxDistance?: number;
  enablePan?: boolean;
  autoRotate?: boolean;
}

export function CameraRig({
  focus,
  distance,
  minDistance = 1.5,
  maxDistance = 260,
  enablePan = true,
  autoRotate = false,
}: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (focus) desired.current.set(focus[0], focus[1], focus[2]);
  }, [focus]);

  useEffect(() => {
    if (!distance || !controls.current) return;
    const current = camera.position.clone();
    const offset = current.sub(controls.current.target);
    const length = offset.length();
    if (length < 0.001) return;
    offset.setLength(THREE.MathUtils.clamp(distance, minDistance, maxDistance));
    camera.position.copy(controls.current.target.clone().add(offset));
    controls.current.update();
  }, [distance, camera, minDistance, maxDistance]);

  useFrame(() => {
    if (!controls.current) return;
    const target = controls.current.target;
    if (target.distanceToSquared(desired.current) > 0.0004) {
      target.lerp(desired.current, 0.08);
      controls.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.65}
      zoomSpeed={0.9}
      panSpeed={0.7}
      enablePan={enablePan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      autoRotate={autoRotate}
      autoRotateSpeed={0.25}
    />
  );
}
