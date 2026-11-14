// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
// No external state management needed for this page

import Spacecraft3D from '@/three/Spacecraft3D';
import { Canvas } from '@react-three/fiber';
import { sound } from '@/utils/sound';
import { OrbitControls } from '@react-three/drei';
import { DEFAULT_SPACECRAFT_CONFIG as ENGINE_DEFAULT } from '@/engine/spacecraft';




// Default spacecraft config to satisfy required prop
const DEFAULT_SPACECRAFT_CONFIG = ENGINE_DEFAULT;

/**
 * Simple full‑screen rocket game.
 * - Keyboard (WASD / Arrow) controls thrust and orientation.
 * - Mouse move controls pitch/yaw; click for boost.
 * - Touch gestures (drag) provide same controls for mobile.
 * - Multiplier is now a static constant (Supabase removed).
 */
export function RocketGamePage() {
  const containerRef = useRef(null);
  const [isFullscreen, setFullscreen] = useState(false);
  const multiplier = 1; // static multiplier
  const [status, setStatus] = useState('prelaunch'); // prelaunch | launch | flight | landing | success | failure
  const [fuel, setFuel] = useState(100);
  const [throttle, setThrottle] = useState(0);
  const controlsRef = useRef({ pitch: 0, yaw: 0, roll: 0 });

  // ---------- Fullscreen handling ----------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const goFullscreen = async () => {
      if (el.requestFullscreen) await el.requestFullscreen();
      setFullscreen(true);
    };
    goFullscreen();
    const exitHandler = () => setFullscreen(document.fullscreenElement === null);
    document.addEventListener('fullscreenchange', exitHandler);
    return () => document.removeEventListener('fullscreenchange', exitHandler);
  }, []);

  // ---------- Input handling (device detection) ----------
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const onKey = (e) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setThrottle((t) => Math.min(t + 0.1, 1));
          break;
        case 'ArrowDown':
        case 's':
          setThrottle((t) => Math.max(t - 0.1, 0));
          break;
        case 'ArrowLeft':
        case 'a':
          controlsRef.current.yaw -= 5;
          break;
        case 'ArrowRight':
        case 'd':
          controlsRef.current.yaw += 5;
          break;
        case ' ': // space for boost
          setThrottle(1);
          break;
        default:
          break;
      }
    };
    const onMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1..1
      const y = (e.clientY / innerHeight - 0.5) * -2; // -1..1 (invert Y)
      controlsRef.current.pitch = y * 10;
      controlsRef.current.yaw = x * 10;
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      const touch = e.touches[0];
      const { innerWidth, innerHeight } = window;
      const x = (touch.clientX / innerWidth - 0.5) * 2;
      const y = (touch.clientY / innerHeight - 0.5) * -2;
      controlsRef.current.pitch = y * 10;
      controlsRef.current.yaw = x * 10;
    };
    if (isTouch) {
      window.addEventListener('touchmove', onTouchMove);
    } else {
      window.addEventListener('keydown', onKey);
      window.addEventListener('mousemove', onMouseMove);
    }
    return () => {
      if (isTouch) window.removeEventListener('touchmove', onTouchMove);
      else {
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('mousemove', onMouseMove);
      }
    };
  }, []);

  // ---------- Game loop ----------
  useEffect(() => {
    let raf;
    const tick = () => {
      if (status === 'launch' || status === 'flight') {
        const consumption = throttle * 0.5 * multiplier;
        setFuel((f) => Math.max(f - consumption, 0));
        if (fuel <= 0) setStatus('failure');
      }
      // Transition logic (demo)
      if (status === 'prelaunch') {
        setStatus('launch');
        sound.launch && sound.launch();
      } else if (status === 'launch') {
        setTimeout(() => setStatus('flight'), 5000);
      } else if (status === 'flight') {
        setTimeout(() => setStatus('landing'), 10000);
      } else if (status === 'landing') {
        setTimeout(() => {
          if (fuel > 20) setStatus('success');
          else setStatus('failure');
        }, 3000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, fuel, multiplier]);

  // ---------- HUD ----------
  const hud = (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-4 text-white" style={{ fontFamily: 'monospace' }}>
      <div className="flex justify-between">
        <span>Status: {status}</span>
        <span>Fuel: {fuel.toFixed(1)}%</span>
        <span>Throttle: {(throttle * 100).toFixed(0)}%</span>
        <span>Mult: x{multiplier}</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black text-white overflow-hidden">
      {hud}
      {/* 3D scene – occupies full area */}
      <Canvas className="absolute inset-0" style={{ width: '100%', height: '100%', background: '#000' }} shadows camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
        <OrbitControls enableZoom={false} enablePan={false} />
        <Spacecraft3D config={DEFAULT_SPACECRAFT_CONFIG} controls={controlsRef.current} throttle={throttle} />
        {/* Test box to verify Canvas rendering */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </Canvas>
      {/* Exit button */}
      <button
        className="absolute top-2 left-2 rounded bg-white/10 px-3 py-1 text-sm text-white"
        onClick={() => document.exitFullscreen()}
      >
        Exit Fullscreen
      </button>
    </div>
  );
}

export default RocketGamePage;
