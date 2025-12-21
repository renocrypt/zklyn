"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type HeroSceneProps = {
  reducedMotion?: boolean;
};

const palette = {
  sky: "#0b0f16",
};

const ramenPalette = {
  BOWL_DARK: 0x1a1a1a,
  BOWL_LIGHT: 0x2d2d2d,
  RIM_ORANGE: 0xe07438,
  BROTH_DEEP: 0x9e5b26,
  BROTH_SURFACE: 0xcc7a36,
  BROTH_LIGHT: 0xe89a4f,
  NOODLE: 0xf2e8c4,
  NOODLE_SHADOW: 0xd9cca1,
  EGG_WHITE: 0xfdfdfd,
  EGG_YOLK_CORE: 0xeaa223,
  EGG_YOLK_OUTER: 0xfccf5e,
  NORI: 0x1d1821,
  ONION_LIGHT: 0x76c442,
  ONION_DARK: 0x4da033,
  CHOPSTICK_RED: 0xbf3030,
  CHOPSTICK_DETAIL: 0xdddddd,
  STEAM: 0xffffff,
} as const;

type RamenKey = keyof typeof ramenPalette;

function createSeededRng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

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

function InstancedVoxels({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}) {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    for (let i = 0; i < matrices.length; i += 1) {
      mesh.current.setMatrixAt(i, matrices[i]);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [matrices]);

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, matrices.length]}
      frustumCulled={false}
    />
  );
}

type SteamParticle = {
  baseX: number;
  baseZ: number;
  riseSpeed: number;
  phase: number;
};

function Steam({
  voxelSize,
  reducedMotion,
  pauseMotion,
}: {
  voxelSize: number;
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const steamGeo = useMemo(
    () => new THREE.BoxGeometry(voxelSize * 0.92, voxelSize * 0.92, voxelSize * 0.92),
    [voxelSize]
  );
  const materials = useMemo(
    () =>
      Array.from(
        { length: 8 },
        () =>
          new THREE.MeshBasicMaterial({
            color: ramenPalette.STEAM,
            transparent: true,
            opacity: 0.35,
          })
      ),
    []
  );
  const rng = useMemo(() => createSeededRng(20251221), []);
  const particles = useMemo<SteamParticle[]>(
    () =>
      Array.from({ length: 8 }, () => ({
        baseX: (rng() - 0.5) * 6 * voxelSize,
        baseZ: (rng() - 0.5) * 6 * voxelSize,
        riseSpeed: 0.3 + rng() * 0.35,
        phase: rng() * Math.PI * 2,
      })),
    [rng, voxelSize]
  );
  const refs = useRef<Array<THREE.Mesh | null>>([]);

  useEffect(() => {
    return () => {
      steamGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [materials, steamGeo]);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;

    const t = clock.getElapsedTime();
    const baseY = 12 * voxelSize;
    const rise = 10 * voxelSize;
    const wiggle = 1.5 * voxelSize;

    particles.forEach((particle, idx) => {
      const mesh = refs.current[idx];
      const mat = materials[idx];
      if (!mesh || !mat) return;

      const u = (t * particle.riseSpeed + particle.phase) % 1;
      const y = baseY + u * rise;
      mesh.position.y = y;
      mesh.position.x =
        particle.baseX + Math.sin(t * 2 + particle.phase) * wiggle;
      mesh.position.z =
        particle.baseZ + Math.cos(t * 1.5 + particle.phase) * wiggle;

      mat.opacity = 0.35 * (1 - u);
    });
  });

  return (
    <group>
      {particles.map((particle, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          geometry={steamGeo}
          material={materials[idx]}
          position={[particle.baseX, 12 * voxelSize, particle.baseZ]}
        />
      ))}
    </group>
  );
}

function VoxelRamen({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const ramen = useRef<THREE.Group>(null!);
  const voxelSize = 0.12;
  const cube = useMemo(
    () => new THREE.BoxGeometry(voxelSize * 0.92, voxelSize * 0.92, voxelSize * 0.92),
    [voxelSize]
  );

  const materials = useMemo(() => {
    const standard = (color: number, roughness = 0.8, metalness = 0.1) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        flatShading: true,
      });

    return {
      BOWL_DARK: standard(ramenPalette.BOWL_DARK, 0.9, 0.05),
      BOWL_LIGHT: standard(ramenPalette.BOWL_LIGHT, 0.85, 0.05),
      RIM_ORANGE: standard(ramenPalette.RIM_ORANGE, 0.75, 0.05),
      BROTH_DEEP: standard(ramenPalette.BROTH_DEEP, 0.55, 0.02),
      BROTH_SURFACE: standard(ramenPalette.BROTH_SURFACE, 0.45, 0.02),
      BROTH_LIGHT: standard(ramenPalette.BROTH_LIGHT, 0.35, 0.01),
      NOODLE: standard(ramenPalette.NOODLE, 0.85, 0.0),
      NOODLE_SHADOW: standard(ramenPalette.NOODLE_SHADOW, 0.9, 0.0),
      EGG_WHITE: standard(ramenPalette.EGG_WHITE, 0.75, 0.02),
      EGG_YOLK_CORE: standard(ramenPalette.EGG_YOLK_CORE, 0.6, 0.02),
      EGG_YOLK_OUTER: standard(ramenPalette.EGG_YOLK_OUTER, 0.65, 0.02),
      NORI: standard(ramenPalette.NORI, 0.95, 0.0),
      ONION_LIGHT: standard(ramenPalette.ONION_LIGHT, 0.8, 0.0),
      ONION_DARK: standard(ramenPalette.ONION_DARK, 0.85, 0.0),
      CHOPSTICK_RED: standard(ramenPalette.CHOPSTICK_RED, 0.75, 0.05),
      CHOPSTICK_DETAIL: standard(ramenPalette.CHOPSTICK_DETAIL, 0.75, 0.05),
    } satisfies Record<Exclude<RamenKey, "STEAM">, THREE.MeshStandardMaterial>;
  }, []);

  const instances = useMemo(() => {
    const layers = Object.keys(ramenPalette).reduce(
      (acc, key) => {
        acc[key as RamenKey] = [];
        return acc;
      },
      {} as Record<RamenKey, THREE.Matrix4[]>
    );

    const dummy = new THREE.Object3D();
    const rng = createSeededRng(424242);
    const add = (key: RamenKey, x: number, y: number, z: number) => {
      dummy.position.set(x * voxelSize, y * voxelSize, z * voxelSize);
      dummy.updateMatrix();
      layers[key].push(dummy.matrix.clone());
    };

    const bowlRadius = 14;
    const bowlHeight = 10;
    const rimHeight = 11;

    for (let y = 0; y <= rimHeight; y += 1) {
      for (let x = -bowlRadius - 2; x <= bowlRadius + 2; x += 1) {
        for (let z = -bowlRadius - 2; z <= bowlRadius + 2; z += 1) {
          const dist = Math.hypot(x, z);
          const currentRadius = bowlRadius * (0.6 + 0.4 * (y / bowlHeight));

          if (dist <= currentRadius && dist >= currentRadius - 1.5) {
            if (y === rimHeight) add("RIM_ORANGE", x, y, z);
            else add(rng() > 0.8 ? "BOWL_LIGHT" : "BOWL_DARK", x, y, z);
          } else if (y === 0 && dist < currentRadius) {
            add("BOWL_DARK", x, y, z);
          } else if (y > 0 && y < rimHeight - 1 && dist < currentRadius - 1.5) {
            if (y === rimHeight - 2) {
              let color: RamenKey = "BROTH_SURFACE";
              if (dist > currentRadius - 3) color = "BROTH_DEEP";
              if (rng() > 0.9) color = "BROTH_LIGHT";
              add(color, x, y, z);
            } else if (y >= rimHeight - 4) {
              add("BROTH_DEEP", x, y, z);
            }
          }
        }
      }
    }

    const surfaceY = rimHeight - 1;

    for (let i = 0; i < 15; i += 1) {
      const startX = (rng() - 0.5) * 16;
      const startZ = (rng() - 0.5) * 16;
      const freq = 0.5 + rng();
      const amp = 1 + rng();

      for (let t = 0; t < 10; t += 0.5) {
        const nx = Math.floor(startX + t);
        const nz = Math.floor(startZ + Math.sin(t * freq) * amp);
        if (Math.hypot(nx, nz) < bowlRadius - 2) {
          add("NOODLE", nx, surfaceY, nz);
        }
      }
    }

    const eggX = -5;
    const eggZ = -4;
    for (let x = -3; x <= 3; x += 1) {
      for (let z = -3; z <= 3; z += 1) {
        const d = Math.hypot(x, z);
        if (d < 3) {
          add("EGG_WHITE", eggX + x, surfaceY, eggZ + z);
          if (d < 1.5) {
            add(
              d < 0.8 ? "EGG_YOLK_CORE" : "EGG_YOLK_OUTER",
              eggX + x,
              surfaceY + 1,
              eggZ + z
            );
          } else {
            add("EGG_WHITE", eggX + x, surfaceY + 1, eggZ + z);
          }
        }
      }
    }

    for (let u = 0; u < 6; u += 1) {
      for (let v = 0; v < 7; v += 1) {
        const nx = 4 + u;
        const nz = 4 + v;
        const ny = surfaceY + 1 + u * 0.5;
        add("NORI", nx, Math.floor(ny), nz);
      }
    }

    for (let i = 0; i < 12; i += 1) {
      const ox = (rng() - 0.5) * 8;
      const oz = (rng() - 0.5) * 8;
      if (Math.hypot(ox, oz) < 10) {
        add("ONION_LIGHT", Math.floor(ox), surfaceY + 1, Math.floor(oz));
        add("ONION_DARK", Math.floor(ox) + 1, surfaceY + 1, Math.floor(oz));
      }
    }

    const csStart = { x: 18, y: 16, z: 8 };
    const csEnd = { x: -8, y: 12, z: -8 };

    const drawLine = (offsetZ: number) => {
      const dx = csEnd.x - csStart.x;
      const dy = csEnd.y - csStart.y;
      const dz = csEnd.z - csStart.z;
      const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) * 1.5;

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = Math.floor(csStart.x + dx * t);
        const y = Math.floor(csStart.y + dy * t);
        const z = Math.floor(csStart.z + dz * t) + offsetZ;

        let col: RamenKey = "CHOPSTICK_RED";
        if (i < 5 || (i > 7 && i < 10)) col = "CHOPSTICK_DETAIL";

        add(col, x, y, z);
      }
    };

    drawLine(0);
    drawLine(3);

    return layers;
  }, [voxelSize]);

  useEffect(() => {
    return () => {
      cube.dispose();
      Object.values(materials).forEach((material) => material.dispose());
    };
  }, [cube, materials]);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    ramen.current.rotation.y = t * 0.2;
    ramen.current.rotation.x = Math.PI / 12 + Math.sin(t * 0.3) * 0.03;
    ramen.current.rotation.z = Math.PI / 24;
    ramen.current.position.y = -0.8 + Math.sin(t * 0.8) * 0.08;
  });

  const voxelLayers = useMemo(
    () =>
      (Object.keys(materials) as Array<Exclude<RamenKey, "STEAM">>).filter(
        (key) => instances[key]?.length
      ),
    [instances, materials]
  );

  return (
    <group ref={ramen} position={[0, -0.7, 0]}>
      {voxelLayers.map((key) => (
        <InstancedVoxels
          key={key}
          geometry={cube}
          material={materials[key]}
          matrices={instances[key]}
        />
      ))}
      <Steam
        voxelSize={voxelSize}
        reducedMotion={reducedMotion}
        pauseMotion={pauseMotion}
      />
    </group>
  );
}

function LightRig() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4.5, 6.5, 4.5]} intensity={0.85} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#f5b8a1" />
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

export default function HeroScene({ reducedMotion }: HeroSceneProps) {
  const { containerRef, active } = useSceneActivity();
  const pauseMotion = reducedMotion || !active;

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        orthographic
        camera={{ position: [3.8, 3.8, 3.8], zoom: 90, near: 0.1, far: 100 }}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <color attach="background" args={[palette.sky]} />
        <FrameLimiter fps={reducedMotion ? 12 : 24} active={active} />
        <CameraRig />
        <LightRig />
        <VoxelRamen reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      </Canvas>
    </div>
  );
}
