"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * The hero's two glass rings (docs/design/spec.md §5).
 *
 * Where the rainbow comes from. Chromatic aberration only splits what the
 * glass refracts, and on a black page that is nothing, so it needs help:
 *  - the environment is built from coloured Lightformers only (warm red/orange
 *    on the left, blue/violet on the right, white strips top and bottom), so
 *    the rims REFLECT colour and the hot white highlights;
 *  - thin-film iridescence breaks those reflections into spectral fringes;
 *  - the transmission buffer's background is a mostly-black texture with the
 *    same coloured lights in it, so the tube REFRACTS streaks of colour that
 *    the aberration can then disperse.
 * The environment renders once (frames={1}) and fetches no HDR.
 */

export interface RingSceneProps {
  /** Render loop on/off. Off-screen, the scene costs nothing. */
  active: boolean;
  /** Pixels of canvas below the viewport (the card overlap), not part of vh. */
  extraBottom: number;
  /** Called after the first frame has actually been drawn. */
  onReady?: () => void;
}

export default function RingScene({ active, extraBottom, onReady }: RingSceneProps) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0, 14], near: 0.1, far: 100 }}
      style={{ pointerEvents: "none" }}
    >
      <Rings extraBottom={extraBottom} />
      <Environment resolution={256} frames={1}>
        {/* Warm side: broad strips, so the left rim carries red/orange along its length */}
        <Lightformer form="rect" intensity={9} color="#ff4b2b" position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[10, 2.4, 1]} />
        <Lightformer form="rect" intensity={7} color="#ff9a3c" position={[-6, -1.5, 1]} rotation-y={Math.PI / 2} scale={[10, 1.8, 1]} />
        {/* Cool side */}
        <Lightformer form="rect" intensity={9} color="#3d5afe" position={[6, 2, 1]} rotation-y={-Math.PI / 2} scale={[10, 2.4, 1]} />
        <Lightformer form="rect" intensity={8} color="#8b5cf6" position={[6, -1.5, 1]} rotation-y={-Math.PI / 2} scale={[10, 1.8, 1]} />
        {/* Hot white: a wide panel above the camera lights the upward-facing
            lower arc of the top ring - the reference's thick white highlight */}
        <Lightformer form="rect" intensity={6} color="#ffffff" position={[0, 4, 7]} scale={[14, 2.5, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={10} color="#ffffff" position={[0, -6, 3]} rotation-x={-Math.PI / 2} scale={[12, 1, 1]} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 0.8, 1]} />
        {/* Faint indigo fill from the camera side so the tube's face reads as smoked glass */}
        <Lightformer form="ring" intensity={1.2} color="#6b6bff" position={[0, 0, 10]} scale={8} />
      </Environment>
      {onReady && <ReadySignal onReady={onReady} />}
    </Canvas>
  );
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(0);
  useFrame(() => {
    // Two frames: the first draws before the transmission buffers are filled.
    fired.current += 1;
    if (fired.current === 2) onReady();
  });
  return null;
}

/** Dark backdrop with the environment's coloured lights, for the glass to refract. */
function useTransmissionBackdrop() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#16161c";
    ctx.fillRect(0, 0, size, size);
    const blob = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    };
    ctx.globalCompositeOperation = "lighter";
    blob(size * 0.12, size * 0.35, size * 0.32, "rgba(255,75,43,0.85)");
    blob(size * 0.2, size * 0.7, size * 0.26, "rgba(255,154,60,0.6)");
    blob(size * 0.88, size * 0.35, size * 0.32, "rgba(61,90,254,0.85)");
    blob(size * 0.8, size * 0.7, size * 0.26, "rgba(139,92,246,0.7)");
    blob(size * 0.5, size * 0.95, size * 0.22, "rgba(255,255,255,0.55)");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/** Shared pointer, in -1..1, fed by one window listener. */
function usePointer() {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return pointer;
}

const TUBE = 0.12; // tube radius as a fraction of the major radius
const TILT = 0.16; // resting tilt, so a highlight rides the rim
const SPIN = 0.1; // rad/s: the tilt axis precesses, so highlights travel round the ring
const PARALLAX = 0.12;

function Rings({ extraBottom }: { extraBottom: number }) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const backdrop = useTransmissionBackdrop();
  const pointer = usePointer();
  const top = useRef<THREE.Group>(null);
  const bottom = useRef<THREE.Group>(null);
  const eased = useRef({ x: 0, y: 0 });

  // Layout in CSS pixels, converted to world units at z = 0.
  const k = viewport.width / size.width;
  const vh = Math.max(size.height - extraBottom, 1);
  const d1 = Math.min(0.6 * size.width, 0.95 * vh);
  const d2 = d1 * (0.41 / 0.58);
  const y1 = 0.02 * vh;
  const y2 = y1 + d1 / 2 + d2 / 2 - 0.02 * d2;
  const toY = (px: number) => (size.height / 2 - px) * k;
  const r1 = (d1 / 2 / (1 + TUBE)) * k;
  const r2 = (d2 / 2 / (1 + TUBE)) * k;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const ease = 1 - Math.pow(0.001, delta); // frame-rate independent smoothing
    eased.current.x += (pointer.current.x - eased.current.x) * ease;
    eased.current.y += (pointer.current.y - eased.current.y) * ease;
    const phase = t * SPIN;
    if (top.current) {
      top.current.rotation.x = TILT * Math.cos(phase) + eased.current.y * PARALLAX;
      top.current.rotation.y = TILT * Math.sin(phase) + eased.current.x * PARALLAX;
    }
    if (bottom.current) {
      bottom.current.rotation.x = -TILT * Math.cos(phase + 1.2) + eased.current.y * PARALLAX;
      bottom.current.rotation.y = TILT * Math.sin(phase + 1.2) + eased.current.x * PARALLAX;
    }
  });

  const material = (
    <MeshTransmissionMaterial
      background={backdrop}
      transmission={1}
      thickness={1.6}
      roughness={0.04}
      ior={1.45}
      chromaticAberration={0.12}
      anisotropicBlur={0}
      distortion={0.04}
      distortionScale={0.3}
      temporalDistortion={0}
      iridescence={1}
      iridescenceIOR={1.3}
      iridescenceThicknessRange={[120, 900]}
      clearcoat={1}
      clearcoatRoughness={0.05}
      envMapIntensity={2}
      backside
      backsideThickness={0.6}
      samples={16}
      resolution={768}
      color="#f1efff"
    />
  );

  return (
    <>
      <group ref={top} position={[0, toY(y1), 0]}>
        <mesh>
          <torusGeometry args={[r1, r1 * TUBE, 64, 220]} />
          {material}
        </mesh>
      </group>
      <group ref={bottom} position={[0.005 * size.width * k, toY(y2), -0.5]}>
        <mesh>
          <torusGeometry args={[r2, r2 * TUBE, 64, 200]} />
          {material}
        </mesh>
      </group>
    </>
  );
}
