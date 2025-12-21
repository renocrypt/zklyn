"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

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

function Bloom({
  active,
  bloomEnabled,
  strength,
  radius,
  threshold,
}: {
  active: boolean;
  bloomEnabled: boolean;
  strength: number;
  radius: number;
  threshold: number;
}) {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  const bloomPass = useRef<UnrealBloomPass | null>(null);

  useEffect(() => {
    if (!bloomEnabled) {
      bloomPass.current = null;
      composer.current?.dispose();
      composer.current = null;
      return undefined;
    }

    const nextComposer = new EffectComposer(gl);
    nextComposer.setPixelRatio(1);
    nextComposer.addPass(new RenderPass(scene, camera));

    const pass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      strength,
      radius,
      threshold
    );
    nextComposer.addPass(pass);

    composer.current = nextComposer;
    bloomPass.current = pass;

    return () => {
      bloomPass.current = null;
      composer.current?.dispose();
      composer.current = null;
    };
  }, [bloomEnabled, camera, gl, radius, scene, strength, threshold, size.height, size.width]);

  useEffect(() => {
    if (!bloomEnabled) return;
    composer.current?.setSize(size.width, size.height);
  }, [bloomEnabled, size.height, size.width]);

  useFrame(() => {
    if (!active) return;
    if (bloomEnabled) composer.current?.render();
    else gl.render(scene, camera);
  }, 1);

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

type VoxelCassetteProps = {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
};

function VoxelCassette({ reducedMotion, pauseMotion }: VoxelCassetteProps) {
  const tape = useRef<THREE.Group>(null!);
  const plasticRef = useRef<THREE.InstancedMesh>(null!);
  const labelRef = useRef<THREE.InstancedMesh>(null!);
  const darkRef = useRef<THREE.InstancedMesh>(null!);
  const cyanRef = useRef<THREE.InstancedMesh>(null!);
  const pinkRef = useRef<THREE.InstancedMesh>(null!);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.14, 0.14, 0.14), []);

  const materials = useMemo(() => {
    return {
      plastic: new THREE.MeshPhysicalMaterial({
        color: 0x8a2be2,
        roughness: 0.2,
        metalness: 0.1,
        transmission: 0.6,
        thickness: 1.0,
        transparent: true,
        opacity: 0.9,
      }),
      label: new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.8,
        metalness: 0.0,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.5,
      }),
      cyan: new THREE.MeshBasicMaterial({ color: 0x00ffff }),
      pink: new THREE.MeshBasicMaterial({ color: 0xff00cc }),
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      Object.values(materials).forEach((material) => material.dispose());
    };
  }, [geometry, materials]);

  const matrices = useMemo(() => {
    const VOXEL_SIZE = 0.15;
    const TAPE_WIDTH = 64;
    const TAPE_HEIGHT = 40;
    const TAPE_DEPTH = 8;

    const instances: Record<"plastic" | "label" | "dark" | "cyan" | "pink", THREE.Matrix4[]> = {
      plastic: [],
      label: [],
      dark: [],
      cyan: [],
      pink: [],
    };

    const dummy = new THREE.Object3D();

    const addVoxel = (type: keyof typeof instances, x: number, y: number, z: number) => {
      dummy.position.set(
        (x - TAPE_WIDTH / 2) * VOXEL_SIZE,
        (y - TAPE_HEIGHT / 2) * VOXEL_SIZE,
        (z - TAPE_DEPTH / 2) * VOXEL_SIZE
      );
      dummy.updateMatrix();
      instances[type].push(dummy.matrix.clone());
    };

    const leftReelX = TAPE_WIDTH * 0.3;
    const rightReelX = TAPE_WIDTH * 0.7;
    const centerY = TAPE_HEIGHT / 2;
    const holeRadius = 6;
    const gearRadius = 4;

    for (let x = 0; x < TAPE_WIDTH; x += 1) {
      for (let y = 0; y < TAPE_HEIGHT; y += 1) {
        for (let z = 0; z < TAPE_DEPTH; z += 1) {
          const distLeft = Math.hypot(x - leftReelX, y - centerY);
          const distRight = Math.hypot(x - rightReelX, y - centerY);

          if (distLeft < holeRadius || distRight < holeRadius) {
            if ((distLeft > gearRadius || distRight > gearRadius) && z > 1 && z < TAPE_DEPTH - 2) {
              if (x % 2 === 0 || y % 2 === 0) addVoxel("dark", x, y, z);
            }
            continue;
          }

          const isLabelArea =
            x > 5 &&
            x < TAPE_WIDTH - 5 &&
            y > 8 &&
            y < TAPE_HEIGHT - 8 &&
            (z === 0 || z === TAPE_DEPTH - 1);

          let isWaveform = false;
          let waveColor: "cyan" | "pink" = "cyan";

          if (isLabelArea) {
            const wx = (x - TAPE_WIDTH / 2) * 0.2;
            const wave1 = Math.sin(wx * 2.5) * 4;
            const wave2 = Math.cos(wx * 3.0) * 3;
            const combined = (wave1 + wave2) * Math.sin(x * 132.1);
            const distY = Math.abs(y - centerY);

            if (distY < Math.abs(combined)) {
              isWaveform = true;
              waveColor = x % 2 === 0 ? "cyan" : "pink";
            }
          }

          if (isWaveform) {
            addVoxel(waveColor, x, y, z);
          } else if (isLabelArea) {
            addVoxel("label", x, y, z);
          } else {
            const isBorder = x === 0 || x === TAPE_WIDTH - 1 || y === 0 || y === TAPE_HEIGHT - 1;
            const isFace = z === 0 || z === TAPE_DEPTH - 1;
            const isStructure =
              (y < 4 && z > 1 && z < TAPE_DEPTH - 2) ||
              ((x === 2 || x === TAPE_WIDTH - 3) && (y === 2 || y === TAPE_HEIGHT - 3));

            if (isBorder || isFace) addVoxel("plastic", x, y, z);
            else if (isStructure) addVoxel("dark", x, y, z);
          }
        }
      }
    }

    return instances;
  }, []);

  useEffect(() => {
    const targets = [
      { ref: plasticRef, matrices: matrices.plastic },
      { ref: labelRef, matrices: matrices.label },
      { ref: darkRef, matrices: matrices.dark },
      { ref: cyanRef, matrices: matrices.cyan },
      { ref: pinkRef, matrices: matrices.pink },
    ] as const;

    targets.forEach(({ ref, matrices }) => {
      const mesh = ref.current;
      for (let i = 0; i < matrices.length; i += 1) mesh.setMatrixAt(i, matrices[i]);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [matrices]);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    tape.current.position.y = Math.sin(t) * 0.22;
    tape.current.rotation.y = Math.sin(t * 0.5) * 0.2;
  });

  return (
    <group ref={tape} position={[0.0, -0.1, -0.2]} rotation={[Math.PI / 12, 0, Math.PI / 24]} scale={0.35}>
      <instancedMesh ref={plasticRef} args={[geometry, materials.plastic, matrices.plastic.length]} frustumCulled={false} />
      <instancedMesh ref={labelRef} args={[geometry, materials.label, matrices.label.length]} frustumCulled={false} />
      <instancedMesh ref={darkRef} args={[geometry, materials.dark, matrices.dark.length]} frustumCulled={false} />
      <instancedMesh ref={cyanRef} args={[geometry, materials.cyan, matrices.cyan.length]} frustumCulled={false} />
      <instancedMesh ref={pinkRef} args={[geometry, materials.pink, matrices.pink.length]} frustumCulled={false} />
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
      {variant === "free" ? (
        <group>
          <VoxelCassette reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
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
  const camera =
    variant === "free"
      ? { position: [0, 0.2, 6.2] as [number, number, number], fov: 42 }
      : { position: [0, 0.35, 4.2] as [number, number, number], fov: 38 };

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        camera={camera}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.sky, 4.5, 9]} />
        <FrameLimiter fps={reducedMotion ? 12 : 24} active={active} />
        {variant === "free" && (
          <Bloom
            active={active}
            bloomEnabled={!reducedMotion}
            strength={1.1}
            radius={0.45}
            threshold={0.22}
          />
        )}
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
