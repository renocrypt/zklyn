"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type HeroSceneProps = {
  reducedMotion?: boolean;
};

const palette = {
  sky: "#0b0f16",
  bridge: "#1b2232",
  frame: "#2a3448",
  windowWarm: "#f2c07a",
  windowCool: "#7dd3ff",
  neonPink: "#c084fc",
  neonCyan: "#60d8ff",
  neonAmber: "#f3b36b",
  neonBlue: "#38bdf8",
  signMagenta: "#e879f9",
  dreamyCyan: "#7ce6ff",
  dreamyViolet: "#9b7cff",
  dreamyRose: "#ff9edb",
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
  const size = 2.4 * scale;
  const thickness = 0.06 * scale;
  const depth = 0.06 * scale;

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
            metalness={0.4}
            roughness={0.6}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

type BuildingProps = {
  position: [number, number, number];
  size: [number, number, number];
  seed: number;
};

function Building({ position, size, seed }: BuildingProps) {
  const [width, height, depth] = size;
  const rows = 6;
  const cols = 4;

  const windows = useMemo(() => {
    const cells: { x: number; y: number; warm: boolean }[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const gate = (row * 7 + col * 11 + seed) % 5;
        if (gate < 3) {
          cells.push({
            x: (col - (cols - 1) / 2) * 0.25,
            y: (row - (rows - 1) / 2) * 0.25,
            warm: gate % 2 === 0,
          });
        }
      }
    }
    return cells;
  }, [seed]);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={palette.bridge}
          metalness={0.2}
          roughness={0.85}
          flatShading
        />
      </mesh>
      <mesh position={[0, height / 2 + 0.05, 0]} scale={[0.1, 0.12, 0.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={palette.neonAmber}
          emissive={palette.neonAmber}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      {windows.map((cell, index) => (
        <mesh
          key={index}
          position={[cell.x, cell.y, depth / 2 + 0.01]}
          scale={[0.12, 0.18, 0.02]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={cell.warm ? palette.windowWarm : palette.windowCool}
            emissive={cell.warm ? palette.windowWarm : palette.windowCool}
            emissiveIntensity={0.75}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function NeonBillboard({
  position,
  pauseMotion,
}: {
  position: [number, number, number];
  pauseMotion?: boolean;
}) {
  const panel = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (pauseMotion) return;
    const t = clock.getElapsedTime();
    (panel.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.5 + Math.sin(t * 1.1) * 0.15;
  });

  return (
    <group position={position}>
      <mesh ref={panel} scale={[1.6, 0.5, 0.08]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={palette.signMagenta}
          emissive={palette.signMagenta}
          emissiveIntensity={0.6}
          toneMapped={false}
          flatShading
        />
      </mesh>
      {[...Array(6)].map((_, i) => (
        <mesh
          key={i}
          position={[-0.6 + i * 0.24, 0.05, 0.06]}
          scale={[0.12, 0.18, 0.04]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? palette.neonCyan : palette.neonAmber}
            emissive={i % 2 === 0 ? palette.neonCyan : palette.neonAmber}
            emissiveIntensity={0.7}
            toneMapped={false}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function NeonOrb({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const orb = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const aura = useRef<THREE.Mesh>(null!);
  const core = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    orb.current.rotation.y = t * 0.25;
    ring.current.rotation.z = t * 0.35;
    aura.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.03);

    const hue = (t * 0.12) % 1;
    const coreMaterial = core.current.material as THREE.MeshStandardMaterial;
    coreMaterial.color.setHSL(hue, 0.9, 0.6);
    coreMaterial.emissive.setHSL((hue + 0.08) % 1, 0.9, 0.55);
    coreMaterial.emissiveIntensity = 0.85 + Math.sin(t * 1.6) * 0.2;
    core.current.scale.setScalar(0.52 + Math.sin(t * 1.3) * 0.05);
  });

  return (
    <group position={[0.2, -0.1, -0.4]}>
      <mesh ref={orb}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color={palette.dreamyCyan}
          emissive={palette.dreamyCyan}
          emissiveIntensity={0.18}
          metalness={0.15}
          roughness={0.15}
          transparent
          opacity={0.38}
          depthWrite={false}
          flatShading
          toneMapped={false}
        />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color={palette.neonBlue}
          emissive={palette.neonBlue}
          emissiveIntensity={0.9}
          metalness={0.1}
          roughness={0.2}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={aura}>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshBasicMaterial
          color={palette.dreamyCyan}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring} position={[0, 0.1, 0]}>
        <torusGeometry args={[0.9, 0.05, 8, 32]} />
        <meshStandardMaterial
          color={palette.neonPink}
          emissive={palette.neonPink}
          emissiveIntensity={0.35}
          metalness={0.2}
          roughness={0.4}
          flatShading
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function StardustField({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const points = useRef<THREE.Points>(null!);
  const shimmer = useRef<THREE.Mesh>(null!);

  const { positions, colors } = useMemo(() => {
    const count = 420;
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const x = THREE.MathUtils.randFloat(-1.8, 1.8);
      const y = THREE.MathUtils.randFloat(-0.15, 0.15);
      const z = THREE.MathUtils.randFloat(-0.6, 0.6);

      positionArray.set([x, y, z], i * 3);

      const hue = (i / count) * 0.8 + 0.1;
      color.setHSL(hue, 0.75, 0.65);
      colorArray.set([color.r, color.g, color.b], i * 3);
    }

    return { positions: positionArray, colors: colorArray };
  }, []);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    points.current.rotation.y = Math.sin(t * 0.15) * 0.08;
    points.current.rotation.x = Math.cos(t * 0.2) * 0.04;
    shimmer.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.02);
    (shimmer.current.material as THREE.MeshBasicMaterial).opacity =
      0.14 + Math.sin(t * 0.8) * 0.03;
  });

  return (
    <group position={[0, -0.55, -0.35]}>
      <mesh ref={shimmer} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 48]} />
        <meshBasicMaterial
          color={palette.dreamyViolet}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function PixelPeople() {
  return (
    <group position={[0, -0.85, 0.4]}>
      <mesh position={[-0.3, 0, 0]} scale={[0.18, 0.42, 0.18]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0c0f15" flatShading />
      </mesh>
      <mesh position={[0.2, 0.02, 0]} scale={[0.16, 0.38, 0.16]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#151a24" flatShading />
      </mesh>
    </group>
  );
}

function LightRig({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const key = useRef<THREE.PointLight>(null!);
  const rim = useRef<THREE.PointLight>(null!);
  const glow = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    key.current.position.set(2.2 * Math.sin(t * 0.25), 1.4, 2.4);
    rim.current.position.set(-2.1, -0.3 + Math.cos(t * 0.35) * 0.25, 2.2);
    glow.current.intensity = 0.5 + Math.sin(t * 0.7) * 0.12;
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight ref={key} intensity={0.8} color="#f6d7c0" />
      <pointLight ref={rim} intensity={0.55} color="#7dd3ff" />
      <pointLight
        ref={glow}
        position={[0, 1.4, -1.4]}
        intensity={0.5}
        color={palette.dreamyRose}
      />
    </>
  );
}

function DreamyBackdrop() {
  return (
    <group position={[0, 0.2, -1.8]}>
      <mesh>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial
          color={palette.dreamyCyan}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0.4, 0.2, 0.1]}>
        <planeGeometry args={[5.5, 3.6]} />
        <meshBasicMaterial
          color={palette.dreamyViolet}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[-0.2, -0.2, 0.15]}>
        <planeGeometry args={[5.2, 3.2]} />
        <meshBasicMaterial
          color={palette.dreamyRose}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function SceneRoot({
  reducedMotion,
  pauseMotion,
}: HeroSceneProps & { pauseMotion?: boolean }) {
  const frames = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        z: -0.4 - i * 0.65,
        scale: 1 + i * 0.14,
      })),
    []
  );
  const scene = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    scene.current.rotation.y = t * 0.08;
    scene.current.rotation.x = Math.sin(t * 0.2) * 0.02;
  });

  return (
    <group ref={scene}>
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial
          color="#151a24"
          metalness={0.3}
          roughness={0.75}
          flatShading
        />
      </mesh>

      <DreamyBackdrop />

      {frames.map((frame) => (
        <FrameSegment
          key={frame.z}
          z={frame.z}
          scale={frame.scale}
          color={palette.frame}
        />
      ))}

      <StardustField reducedMotion={reducedMotion} pauseMotion={pauseMotion} />

      <Building position={[-1.9, 0.25, -2.7]} size={[1, 2.6, 0.9]} seed={4} />
      <Building position={[1.8, 0.3, -2.5]} size={[1, 2.3, 0.9]} seed={9} />
      <Building position={[0, 0.1, -3.2]} size={[0.8, 1.8, 0.7]} seed={13} />

      <NeonBillboard position={[-1.3, 1.1, -1.8]} pauseMotion={pauseMotion} />
      <NeonBillboard position={[1.4, 0.9, -1.4]} pauseMotion={pauseMotion} />

      <NeonOrb reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      <PixelPeople />
    </group>
  );
}

export default function HeroScene({ reducedMotion }: HeroSceneProps) {
  const { containerRef, active } = useSceneActivity();
  const pauseMotion = reducedMotion || !active;

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.35, 5.6], fov: 36 }}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop="demand"
      >
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.sky, 5.5, 10.5]} />
        <FrameLimiter fps={reducedMotion ? 12 : 24} active={active} />
        <LightRig reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
        <SceneRoot reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      </Canvas>
    </div>
  );
}
