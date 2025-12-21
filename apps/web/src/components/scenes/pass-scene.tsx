"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type PassSceneProps = {
  variant: "free" | "premium";
  reducedMotion?: boolean;
};

const palettes = {
  free: {
    sky: "#0b0f16",
    frame: "#2a3448",
    neon: "#60d8ff",
    accent: "#9dd9ff",
    warm: "#f3b36b",
    magenta: "#c084fc",
    dreamyA: "#7ce6ff",
    dreamyB: "#9b7cff",
  },
  premium: {
    sky: "#0b0f16",
    frame: "#2a3448",
    neon: "#f59e0b",
    accent: "#fcd34d",
    warm: "#c084fc",
    magenta: "#e879f9",
    dreamyA: "#fbd38d",
    dreamyB: "#ff9edb",
  },
};

function FrameLimiter({ fps, active }: { fps: number; active: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!active || fps <= 0) return undefined;
    invalidate();
    const interval = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(interval);
  }, [active, fps, invalidate]);

  return null;
}

function useSceneActivity() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let timeoutId: number | undefined;
    const handleScroll = () => {
      setIsScrolling(true);
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setIsScrolling(false), 160);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () =>
      setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return { containerRef, active: inView && isVisible && !isScrolling };
}

type FrameSegmentProps = {
  z: number;
  scale: number;
  color: string;
};

function FrameSegment({ z, scale, color }: FrameSegmentProps) {
  const size = 1.8 * scale;
  const thickness = 0.05 * scale;
  const depth = 0.05 * scale;

  const bars = [
    { pos: [0, size * 0.5, z], scale: [size, thickness, depth] },
    { pos: [0, -size * 0.5, z], scale: [size, thickness, depth] },
    { pos: [-size * 0.5, 0, z], scale: [thickness, size, depth] },
    { pos: [size * 0.5, 0, z], scale: [thickness, size, depth] },
  ];

  return (
    <group>
      {bars.map((bar, index) => (
        <mesh
          key={index}
          position={bar.pos as [number, number, number]}
          scale={bar.scale as [number, number, number]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.3}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function PixelArcade({
  neon,
  accent,
  warm,
  reducedMotion,
  pauseMotion,
}: {
  neon: string;
  accent: string;
  warm: string;
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const screen = useRef<THREE.Mesh>(null!);
  const banner = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    (screen.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.5 + Math.sin(t * 1.2) * 0.1;
    (banner.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.45 + Math.cos(t * 0.8) * 0.1;
  });

  return (
    <group position={[0.15, -0.35, -0.4]} rotation={[0, -0.2, 0]}>
      <mesh scale={[1.1, 1.6, 0.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#2a3350"
          metalness={0.2}
          roughness={0.75}
          flatShading
        />
      </mesh>
      <mesh ref={banner} position={[0, 0.9, 0.35]} scale={[0.9, 0.28, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={warm}
          emissive={warm}
          emissiveIntensity={0.45}
          toneMapped={false}
          flatShading
        />
      </mesh>
      <mesh ref={screen} position={[0, 0.2, 0.36]} scale={[0.8, 0.55, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.5}
          toneMapped={false}
          flatShading
        />
      </mesh>
      <mesh position={[0, -0.35, 0.38]} scale={[0.7, 0.12, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={neon}
          emissive={neon}
          emissiveIntensity={0.4}
          toneMapped={false}
          flatShading
        />
      </mesh>
    </group>
  );
}

function VendingMachine({ neon }: { neon: string }) {
  return (
    <group position={[-0.8, -0.35, -0.2]} rotation={[0, 0.2, 0]}>
      <mesh scale={[0.5, 1.1, 0.45]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1c2538" roughness={0.8} flatShading />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          position={[-0.05 + i * 0.05, 0.15, 0.26]}
          scale={[0.08, 0.45, 0.04]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={neon}
            emissive={neon}
            emissiveIntensity={0.45}
            toneMapped={false}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function Skybridge({ neon, magenta }: { neon: string; magenta: string }) {
  const frames = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ z: -0.25 - i * 0.4, scale: 1 + i * 0.1 })),
    []
  );

  return (
    <group>
      {frames.map((frame) => (
        <FrameSegment key={frame.z} z={frame.z} scale={frame.scale} color={neon} />
      ))}
      <mesh position={[0, -0.7, 0]} scale={[2.1, 0.05, 1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={neon}
          emissive={neon}
          emissiveIntensity={0.3}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.5, -0.5, -0.2]} scale={[0.18, 0.32, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0d0f14" flatShading />
      </mesh>
      <mesh position={[0.4, -0.48, -0.1]} scale={[0.16, 0.28, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#151a24" flatShading />
      </mesh>
      <mesh position={[0.9, 0.2, -0.6]} scale={[0.5, 0.25, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={magenta}
          emissive={magenta}
          emissiveIntensity={0.4}
          toneMapped={false}
          flatShading
        />
      </mesh>
    </group>
  );
}

function NeonOrb({
  accent,
  reducedMotion,
  pauseMotion,
}: {
  accent: string;
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const orb = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    orb.current.rotation.y = t * 0.35;
  });

  return (
    <mesh ref={orb} position={[-0.6, 0.4, 0.3]}>
      <icosahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color={accent}
        emissive={accent}
        emissiveIntensity={0.45}
        metalness={0.2}
        roughness={0.3}
        flatShading
        toneMapped={false}
      />
    </mesh>
  );
}

function LightRig({
  neon,
  reducedMotion,
  pauseMotion,
}: {
  neon: string;
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const glow = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    glow.current.intensity = 0.6 + Math.sin(clock.getElapsedTime() * 0.9) * 0.15;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[1.3, 1.1, 2]} intensity={0.65} color={neon} />
      <pointLight ref={glow} position={[-1.2, 0.4, 1.2]} intensity={0.55} color={neon} />
    </>
  );
}

function DreamyBackdrop({ colorA, colorB }: { colorA: string; colorB: string }) {
  return (
    <group position={[0, 0.2, -1.4]}>
      <mesh>
        <planeGeometry args={[4.8, 3.2]} />
        <meshBasicMaterial
          color={colorA}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0.3, 0.1, 0.1]}>
        <planeGeometry args={[4.2, 2.8]} />
        <meshBasicMaterial
          color={colorB}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function SceneRoot({
  variant,
  reducedMotion,
  pauseMotion,
}: PassSceneProps & { pauseMotion?: boolean }) {
  const palette = palettes[variant];
  const scene = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    scene.current.rotation.y = t * 0.12;
    scene.current.rotation.x = Math.sin(t * 0.4) * 0.02;
  });

  return (
    <group ref={scene}>
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#151a24" metalness={0.2} roughness={0.85} flatShading />
      </mesh>

      <DreamyBackdrop colorA={palette.dreamyA} colorB={palette.dreamyB} />

      <mesh position={[0, 0.6, -1.4]} scale={[2.4, 1.3, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palette.frame} flatShading />
      </mesh>

      {variant === "free" ? (
        <group>
          <Skybridge neon={palette.neon} magenta={palette.magenta} />
          <NeonOrb
            accent={palette.accent}
            reducedMotion={reducedMotion}
            pauseMotion={pauseMotion}
          />
        </group>
      ) : (
        <group>
          <PixelArcade
            neon={palette.neon}
            accent={palette.accent}
            warm={palette.warm}
            reducedMotion={reducedMotion}
            pauseMotion={pauseMotion}
          />
          <VendingMachine neon={palette.magenta} />
          <NeonOrb
            accent={palette.accent}
            reducedMotion={reducedMotion}
            pauseMotion={pauseMotion}
          />
        </group>
      )}
    </group>
  );
}

export default function PassScene({ variant, reducedMotion }: PassSceneProps) {
  const palette = palettes[variant];
  const { containerRef, active } = useSceneActivity();
  const pauseMotion = reducedMotion || !active;

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.35, 4.2], fov: 38 }}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop="demand"
      >
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.sky, 4.5, 9]} />
        <FrameLimiter fps={reducedMotion ? 12 : 24} active={active} />
        <LightRig
          neon={palette.neon}
          reducedMotion={reducedMotion}
          pauseMotion={pauseMotion}
        />
        <SceneRoot
          variant={variant}
          reducedMotion={reducedMotion}
          pauseMotion={pauseMotion}
        />
      </Canvas>
    </div>
  );
}
