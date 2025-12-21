"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type HeroSceneProps = {
  reducedMotion?: boolean;
};

const palette = {
  sky: "#050505",
};

const ramenPalette = {
  bowlDark: 0x1a1a1a,
  bowlHighlight: 0x2d2d2d,
  bowlRim: 0xff6600,
  brothDeep: 0xcc5500,
  brothMid: 0xe68a00,
  brothLight: 0xffaa00,
  noodle: 0xffeecc,
  noodleShadow: 0xddccaa,
  eggWhite: 0xfcfcfc,
  eggYolk: 0xffaa00,
  eggYolkCenter: 0xffcc00,
  nori: 0x2e1a36,
  onion: 0x44cc44,
  onionLight: 0x66ee66,
  chopstick: 0xc41e3a,
  chopstickHighlight: 0xe62e4c,
  steam: 0xffffff,
};

const VOXEL_SIZE = 0.5;
const VOXEL_GAP_SCALE = 0.95;

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

type Voxel = {
  x: number;
  y: number;
  z: number;
  color: number;
};

function IridescentDust({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const points = useRef<THREE.Points>(null!);

  const { geometry, material } = useMemo(() => {
    const rng = createSeededRng(13371337);
    const count = 220;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const theta = rng() * Math.PI * 2;
      const radius = 6 + rng() * 7;
      const y = -2.2 + rng() * 6.2;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * radius;

      const hue = (0.55 + rng() * 0.35) % 1;
      color.setHSL(hue, 0.85, 0.7);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.14,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry, material };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    points.current.rotation.y = t * 0.06;
    points.current.rotation.x = Math.sin(t * 0.2) * 0.04;
    points.current.rotation.z = Math.cos(t * 0.18) * 0.03;
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
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
  const instanced = useRef<THREE.InstancedMesh>(null!);

  const { voxels, center } = useMemo(() => {
    const rng = createSeededRng(20251221);
    const data: Voxel[] = [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    const addVoxel = (x: number, y: number, z: number, color: number) => {
      data.push({ x, y, z, color });
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    };

    const radius = 20;
    const height = 14;
    const liquidLevel = 8;

    for (let y = 0; y <= height; y += 1) {
      for (let x = -radius - 2; x <= radius + 2; x += 1) {
        for (let z = -radius - 2; z <= radius + 2; z += 1) {
          const dist = Math.hypot(x, z);
          const currentRadius = 8 + (y / height) * 12;
          const thickness = 1.5;

          if (dist <= currentRadius && dist > currentRadius - thickness) {
            let col = ramenPalette.bowlDark;
            if ((x + y + z) % 7 === 0) col = ramenPalette.bowlHighlight;
            if (y === height) col = ramenPalette.bowlRim;
            if (y === height - 1 && dist > currentRadius - 0.5) col = ramenPalette.bowlRim;
            addVoxel(x, y, z, col);
          } else if (y === 0 && dist <= 8) {
            addVoxel(x, y, z, ramenPalette.bowlDark);
          }

          if (y < liquidLevel && y > 1 && dist < currentRadius - thickness) {
            if (y === liquidLevel - 1) {
              let col = ramenPalette.brothMid;
              if (dist < 5) col = ramenPalette.brothLight;
              else if (dist > 12) col = ramenPalette.brothDeep;
              addVoxel(x, y, z, col);
            }
          }
        }
      }
    }

    const numNoodles = 500;
    const noodleCenterY = liquidLevel;
    for (let i = 0; i < numNoodles; i += 1) {
      const t = i * 0.1;
      const r = 3 + t * 0.2;
      if (r > 16) break;

      const nx = Math.cos(t) * r;
      const nz = Math.sin(t) * r;
      const x = Math.round(nx);
      const z = Math.round(nz);

      if (x * x + z * z < 18 * 18) {
        const ny = noodleCenterY + Math.sin(t * 3) * 0.5;
        const col = rng() > 0.8 ? ramenPalette.noodleShadow : ramenPalette.noodle;
        addVoxel(Math.round(x), Math.round(ny), Math.round(z), col);
      }
    }

    const noriBaseX = -8;
    const noriBaseZ = -8;
    for (let i = 0; i < 10; i += 1) {
      for (let j = 0; j < 8; j += 1) {
        const nx = noriBaseX + i;
        const nz = noriBaseZ - j * 0.5;
        const ny = liquidLevel + j + rng() * 0.2;
        addVoxel(Math.round(nx), Math.round(ny), Math.round(nz), ramenPalette.nori);
      }
    }

    const eggX = 6;
    const eggZ = 4;
    const eggY = liquidLevel;
    for (let x = -4; x <= 4; x += 1) {
      for (let z = -4; z <= 4; z += 1) {
        for (let y = 0; y <= 2; y += 1) {
          const dist = Math.sqrt(x * x + z * z + (y * 2) * (y * 2));
          if (dist < 3.5) {
            let col = ramenPalette.eggWhite;
            const yolkDist = Math.hypot(x, z);
            if (yolkDist < 1.8 && y >= 0) {
              col = yolkDist < 1.0 ? ramenPalette.eggYolkCenter : ramenPalette.eggYolk;
            }
            addVoxel(eggX + x, eggY + y, eggZ + z, col);
          }
        }
      }
    }

    const numOnions = 40;
    for (let i = 0; i < numOnions; i += 1) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * 10;
      const ox = Math.cos(angle) * r;
      const oz = Math.sin(angle) * r;

      if (rng() > 0.3) {
        const col = rng() > 0.5 ? ramenPalette.onion : ramenPalette.onionLight;
        addVoxel(Math.round(ox), liquidLevel + 1, Math.round(oz), col);
      }
    }

    const stickLen = 44;
    for (let i = 0; i < stickLen; i += 1) {
      const col = i > 35 ? ramenPalette.chopstickHighlight : ramenPalette.chopstick;
      const s1x = -22 + i;
      const s1z = 8;
      const s1y = 15;
      addVoxel(s1x, s1y, s1z, col);

      const s2x = -22 + i;
      const s2z = 10 + i * 0.05;
      addVoxel(s2x, s1y, Math.round(s2z), col);
    }

    for (let s = 0; s < 3; s += 1) {
      const steamBaseX = (rng() - 0.5) * 10;
      const steamBaseZ = (rng() - 0.5) * 10;
      const steamHeight = 15 + rng() * 10;

      for (let y = 0; y < steamHeight; y += 1) {
        if (rng() > 0.6) continue;
        const wave = Math.sin(y * 0.5 + s);
        const sx = steamBaseX + wave * 2;
        const sz = steamBaseZ;
        const sy = 20 + y;
        addVoxel(Math.round(sx), Math.round(sy), Math.round(sz), ramenPalette.steam);
      }
    }

    const center = {
      x: ((minX + maxX) / 2) * VOXEL_SIZE,
      y: ((minY + maxY) / 2) * VOXEL_SIZE,
      z: ((minZ + maxZ) / 2) * VOXEL_SIZE,
    };

    return { voxels: data, center };
  }, []);

  const geometry = useMemo(
    () => new THREE.BoxGeometry(VOXEL_SIZE * VOXEL_GAP_SCALE, VOXEL_SIZE * VOXEL_GAP_SCALE, VOXEL_SIZE * VOXEL_GAP_SCALE),
    []
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.8,
        metalness: 0.1,
        flatShading: true,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    const mesh = instanced.current;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < voxels.length; i += 1) {
      const voxel = voxels[i];
      dummy.position.set(voxel.x * VOXEL_SIZE, voxel.y * VOXEL_SIZE, voxel.z * VOXEL_SIZE);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.setHex(voxel.color);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [voxels]);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    ramen.current.rotation.x = 0;
    ramen.current.rotation.y = t * 0.16;
    ramen.current.rotation.z = 0;
    ramen.current.position.y = Math.sin(t * 0.7) * 0.32;
  });

  return (
    <group ref={ramen} position={[-center.x, -center.y, -center.z]}>
      <instancedMesh
        ref={instanced}
        args={[geometry, material, voxels.length]}
        frustumCulled={false}
      />
      <IridescentDust reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
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
  const iridescent = useRef<THREE.PointLight>(null!);
  const rim = useRef<THREE.PointLight>(null!);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();

    const orbit = 18;
    iridescent.current.position.set(
      Math.cos(t * 0.45) * orbit,
      18 + Math.sin(t * 0.25) * 3,
      Math.sin(t * 0.45) * orbit
    );

    rim.current.position.set(
      Math.cos(t * 0.22 + 1.2) * 22,
      6 + Math.sin(t * 0.33) * 2,
      Math.sin(t * 0.22 + 1.2) * 22
    );

    const hue = (t * 0.06) % 1;
    iridescent.current.intensity = 0.95 + Math.sin(t * 0.8) * 0.15;
    color.setHSL(hue, 0.9, 0.62);
    iridescent.current.color.copy(color);

    color.setHSL((hue + 0.5) % 1, 0.85, 0.62);
    rim.current.color.copy(color);
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[20, 40, 20]} intensity={1.05} color="#fff2e8" />
      <directionalLight position={[-18, 16, -12]} intensity={0.3} color="#9ad5ff" />
      <pointLight ref={iridescent} distance={120} intensity={0.95} />
      <pointLight ref={rim} distance={140} intensity={0.55} />
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
        camera={{ position: [24, 28, 24], fov: 45, near: 0.1, far: 1000 }}
        dpr={[1, 1.2]}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <color attach="background" args={[palette.sky]} />
        <fog attach="fog" args={[palette.sky, 40, 90]} />
        <FrameLimiter fps={reducedMotion ? 12 : 24} active={active} />
        <CameraRig />
        <LightRig reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
        <VoxelRamen reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      </Canvas>
    </div>
  );
}
