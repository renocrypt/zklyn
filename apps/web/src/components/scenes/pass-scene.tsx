"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

type PassSceneProps = {
  variant: "free" | "premium";
  reducedMotion?: boolean;
};

function createSeededRng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

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
    sky: "#000000",
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

type PulseType = "red" | "green" | null;

type Voxel = {
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  pulse: PulseType;
};

function NeonVoxelBonsai({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const bonsai = useRef<THREE.Group>(null!);
  const instanced = useRef<THREE.InstancedMesh>(null!);

  const { voxels, center, pulseRed, pulseGreen } = useMemo(() => {
    const rng = createSeededRng(20251221);
    const voxelMap = new Map<string, { color: THREE.Color; pulse: PulseType }>();

    const setVoxel = (x: number, y: number, z: number, color: THREE.Color, pulse: PulseType = null) => {
      const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
      if (voxelMap.has(key)) return;
      voxelMap.set(key, { color, pulse });
    };

    const palette = {
      potDark: new THREE.Color("#101010"),
      potRim: new THREE.Color("#ffd700"),
      potNeon: new THREE.Color("#ff0033"),
      potGreen: new THREE.Color("#00ff00"),
      woodDark: new THREE.Color("#2d1b18"),
      woodMid: new THREE.Color("#4e342e"),
      woodLight: new THREE.Color("#6d4c41"),
      leafPink: new THREE.Color("#ff4081").multiplyScalar(1.5),
      leafHighlight: new THREE.Color("#ff80ab").multiplyScalar(2.0),
      leafNeonGreen: new THREE.Color("#39ff14"),
      leafPurple: new THREE.Color("#aa00ff").multiplyScalar(3.0),
      leafLime: new THREE.Color("#ccff00").multiplyScalar(2.5),
      reflectionA: new THREE.Color("#442233").multiplyScalar(0.5),
      reflectionB: new THREE.Color("#113344").multiplyScalar(0.5),
    };

    const generatePot = () => {
      const width = 14;
      const height = 6;
      const yOffset = -5;

      for (let y = 0; y < height; y += 1) {
        for (let x = -width / 2; x <= width / 2; x += 1) {
          for (let z = -width / 2; z <= width / 2; z += 1) {
            const dist = Math.max(Math.abs(x), Math.abs(z));
            const cornerDist = Math.abs(x) + Math.abs(z);
            if (dist > 7 || cornerDist > 9) continue;

            let color = palette.potDark;
            let pulse: PulseType = null;

            if (y === 0) {
              if (dist === 7 || cornerDist >= 9 || Math.abs(x) === 7 || Math.abs(z) === 7) {
                color = palette.potGreen;
                pulse = "green";
              }
            } else if (y === Math.floor(height / 2)) {
              if (dist === 7 || cornerDist >= 9 || Math.abs(x) === 7 || Math.abs(z) === 7) {
                color = palette.potNeon;
                pulse = "red";
              }
            } else if (y === height - 1) {
              if (dist === 7 || cornerDist >= 9 || Math.abs(x) === 7 || Math.abs(z) === 7) {
                color = palette.potRim;
              }
            }

            setVoxel(x, y + yOffset, z, color, pulse);
          }
        }
      }
    };

    const generateLeafCluster = (
      cx: number,
      cy: number,
      cz: number,
      radius: number,
      primaryColor: THREE.Color,
      pulseType: PulseType = null
    ) => {
      for (let x = -radius; x <= radius; x += 1) {
        for (let y = -radius / 2; y <= radius / 2; y += 1) {
          for (let z = -radius; z <= radius; z += 1) {
            const nx = (x * x) / (radius * radius);
            const ny = (y * y) / ((radius / 2) * (radius / 2));
            const nz = (z * z) / (radius * radius);
            if (nx + ny + nz > 1) continue;

            if (rng() <= 0.3) continue;

            const r = rng();
            let color = palette.leafPink;
            let pulse: PulseType = null;

            if (r > 0.85) {
              color = primaryColor;
              pulse = pulseType;
            } else if (r > 0.6) {
              color = palette.leafHighlight;
            }

            setVoxel(cx + x, cy + y, cz + z, color, pulse);
          }
        }
      }
    };

    const generateBranch = (
      startX: number,
      startY: number,
      startZ: number,
      dirX: number,
      dirZ: number,
      length: number,
      leafColor: THREE.Color,
      pulseType: PulseType = null
    ) => {
      let bx = startX;
      let by = startY;
      let bz = startZ;

      for (let i = 0; i < length; i += 1) {
        bx += dirX + (rng() - 0.5);
        by += 0.8 + rng() * 0.4;
        bz += dirZ + (rng() - 0.5);

        setVoxel(bx, by, bz, palette.woodMid);
        setVoxel(bx + 1, by, bz, palette.woodDark);

        if (i > length - 3) generateLeafCluster(bx, by, bz, 5, leafColor, pulseType);
      }
    };

    const generateTrunk = () => {
      let thickness = 2.5;

      for (let y = 0; y < 22; y += 1) {
        const x = Math.sin(y * 0.2) * 4;
        const z = Math.cos(y * 0.15) * 2;

        thickness = Math.max(0.8, 2.5 - y * 0.08);
        const r = Math.ceil(thickness);

        for (let tx = -r; tx <= r; tx += 1) {
          for (let tz = -r; tz <= r; tz += 1) {
            if (tx * tx + tz * tz > thickness * thickness + 0.5) continue;

            const noise = rng();
            const color =
              noise > 0.7
                ? palette.woodLight
                : noise > 0.4
                  ? palette.woodMid
                  : palette.woodDark;
            setVoxel(x + tx, y, z + tz, color);
          }
        }

        if (y === 6) generateBranch(x, y, z, -1, 0.5, 7, palette.leafPurple);
        if (y === 9) generateBranch(x, y, z, 1, -0.5, 6, palette.leafPink);
        if (y === 12) generateBranch(x, y, z, -0.5, 1, 5, palette.leafLime);
        if (y === 15) generateBranch(x, y, z, 0.8, 0.2, 5, palette.leafNeonGreen, "green");
        if (y === 21) generateBranch(x, y, z, 0, 0, 4, palette.leafPink);
      }
    };

    const generateReflection = () => {
      const yLevel = -8;
      for (let i = 0; i < 60; i += 1) {
        const x = (rng() - 0.5) * 20;
        const z = (rng() - 0.5) * 20;
        if (x * x + z * z >= 100) continue;

        const length = Math.floor(rng() * 4) + 2;
        const color = rng() > 0.7 ? palette.reflectionB : palette.reflectionA;
        for (let l = 0; l < length; l += 1) setVoxel(x + l, yLevel, z, color);
      }
    };

    generatePot();
    generateTrunk();
    generateReflection();

    const voxels: Voxel[] = [];
    const redPulse: number[] = [];
    const greenPulse: number[] = [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    let index = 0;
    for (const [key, payload] of voxelMap) {
      const [x, y, z] = key.split(",").map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);

      voxels.push({ x, y, z, color: payload.color, pulse: payload.pulse });
      if (payload.pulse === "red") redPulse.push(index);
      if (payload.pulse === "green") greenPulse.push(index);
      index += 1;
    }

    const voxelSize = 0.12;
    const center = {
      x: ((minX + maxX) / 2) * voxelSize,
      y: ((minY + maxY) / 2) * voxelSize,
      z: ((minZ + maxZ) / 2) * voxelSize,
    };

    return {
      voxels,
      center,
      pulseRed: redPulse,
      pulseGreen: greenPulse,
    };
  }, []);

  const voxelSize = 0.12;
  const geometry = useMemo(
    () => new THREE.BoxGeometry(voxelSize * 0.92, voxelSize * 0.92, voxelSize * 0.92),
    []
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
        flatShading: true,
      }),
    []
  );
  const instanceColor = useMemo(() => {
    const colors = new Float32Array(voxels.length * 3);
    colors.fill(1);
    return new THREE.InstancedBufferAttribute(colors, 3);
  }, [voxels.length]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useLayoutEffect(() => {
    const mesh = instanced.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < voxels.length; i += 1) {
      const voxel = voxels[i];
      dummy.position.set(voxel.x * voxelSize, voxel.y * voxelSize, voxel.z * voxelSize);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, voxel.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [voxels]);

  useFrame(({ clock }) => {
    if (pauseMotion) return;
    const t = clock.getElapsedTime();

    if (!reducedMotion) {
      bonsai.current.position.y = Math.sin(t) * 0.08;
    }

    if (reducedMotion) return;

    const mesh = instanced.current;
    if (!mesh.instanceColor) return;

    const pulseRedStrength = 4.0 + Math.sin(t * 3.0) * 2.0;
    const pulseGreenStrength = 4.0 + Math.sin(t * 3.0 + 2.0) * 2.0;

    const temp = new THREE.Color();

    temp.set("#ff0033").multiplyScalar(pulseRedStrength);
    for (let i = 0; i < pulseRed.length; i += 1) mesh.setColorAt(pulseRed[i], temp);

    temp.set("#39ff14").multiplyScalar(pulseGreenStrength);
    for (let i = 0; i < pulseGreen.length; i += 1) mesh.setColorAt(pulseGreen[i], temp);

    if (pulseRed.length > 0 || pulseGreen.length > 0) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={bonsai} position={[-center.x, -center.y, -center.z]} scale={0.95}>
      <instancedMesh
        ref={instanced}
        args={[geometry, material, voxels.length]}
        instanceColor={instanceColor}
        frustumCulled={false}
      />
    </group>
  );
}

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
    <group ref={tape} position={[0.0, -0.1, -0.2]} rotation={[Math.PI / 12, 0, Math.PI / 24]} scale={0.5}>
      <instancedMesh ref={plasticRef} args={[geometry, materials.plastic, matrices.plastic.length]} frustumCulled={false} />
      <instancedMesh ref={labelRef} args={[geometry, materials.label, matrices.label.length]} frustumCulled={false} />
      <instancedMesh ref={darkRef} args={[geometry, materials.dark, matrices.dark.length]} frustumCulled={false} />
      <instancedMesh ref={cyanRef} args={[geometry, materials.cyan, matrices.cyan.length]} frustumCulled={false} />
      <instancedMesh ref={pinkRef} args={[geometry, materials.pink, matrices.pink.length]} frustumCulled={false} />
    </group>
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

function BonsaiLightRig({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const rim = useRef<THREE.DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    rim.current.intensity = 1.0 + Math.sin(clock.getElapsedTime() * 0.6) * 0.15;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.35} color="#ffffff" />
      <directionalLight ref={rim} position={[-20, 10, -20]} intensity={1.0} color="#4466ff" />
      <pointLight position={[0, 12, 0]} intensity={0.55} color="#ff80ab" />
    </>
  );
}

function SceneRoot({
  variant,
  reducedMotion,
  pauseMotion,
}: PassSceneProps & { pauseMotion?: boolean }) {
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
          <NeonVoxelBonsai reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
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
      : { position: [3.2, 2.4, 3.2] as [number, number, number], zoom: 70 };

  const bloomConfig =
    variant === "premium"
      ? { strength: 0.55, radius: 0.6, threshold: 0.0 }
      : { strength: 1.1, radius: 0.45, threshold: 0.22 };

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        orthographic={variant === "premium"}
        camera={camera}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop="demand"
        onCreated={({ gl }) => {
          if (variant === "premium") {
            gl.toneMapping = THREE.ReinhardToneMapping;
            gl.toneMappingExposure = 1.0;
          } else {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }
        }}
      >
        <color attach="background" args={[palette.sky]} />
        {variant === "free" && <fog attach="fog" args={[palette.sky, 4.5, 9]} />}
        <FrameLimiter fps={reducedMotion ? 12 : 24} active={active} />
        <Bloom
          active={active}
          bloomEnabled={!reducedMotion}
          strength={bloomConfig.strength}
          radius={bloomConfig.radius}
          threshold={bloomConfig.threshold}
        />
        {variant === "premium" ? (
          <BonsaiLightRig reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
        ) : (
          <LightRig neon={palette.neon} reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
        )}
        <SceneRoot
          variant={variant}
          reducedMotion={reducedMotion}
          pauseMotion={pauseMotion}
        />
      </Canvas>
    </div>
  );
}
