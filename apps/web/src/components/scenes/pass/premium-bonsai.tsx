"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createSeededRng } from "../lib/rng";
import type { SceneMotionProps } from "./types";

type PulseType = "red" | "green" | null;

type Voxel = {
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
};

function NeonVoxelBonsai({ reducedMotion, pauseMotion }: SceneMotionProps) {
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

      voxels.push({ x, y, z, color: payload.color });
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

function BonsaiLightRig({ reducedMotion, pauseMotion }: SceneMotionProps) {
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

function ContentRoot({ reducedMotion, pauseMotion }: SceneMotionProps) {
  const scene = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();
    scene.current.rotation.y = t * 0.12;
    scene.current.rotation.x = Math.sin(t * 0.4) * 0.02;
  });

  return (
    <group ref={scene}>
      <NeonVoxelBonsai reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
    </group>
  );
}

export function PremiumBonsaiScene({ reducedMotion, pauseMotion }: SceneMotionProps) {
  return (
    <>
      <BonsaiLightRig reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      <ContentRoot reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
    </>
  );
}

