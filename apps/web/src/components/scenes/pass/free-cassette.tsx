"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { SceneMotionProps } from "./types";

type VoxelCassetteProps = SceneMotionProps;

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
} & SceneMotionProps) {
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
      <VoxelCassette reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
    </group>
  );
}

export function FreeCassetteScene({
  neon,
  reducedMotion,
  pauseMotion,
}: { neon: string } & SceneMotionProps) {
  return (
    <>
      <LightRig neon={neon} reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      <ContentRoot reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
    </>
  );
}

