"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { IridescentBackdrop } from "./hero/iridescent-backdrop";
import { HeroLightRig } from "./hero/light-rig";
import { VoxelRamen } from "./hero/voxel-ramen";
import { applyAcesToneMapping, HERO_CANVAS_PRESET } from "./lib/canvas-presets";
import { FrameLimiter } from "./lib/frame-limiter";
import { useSceneActivity } from "./lib/use-scene-activity";

type HeroSceneProps = {
  reducedMotion?: boolean;
};

const palette = {
  sky: "#050505",
};

const HERO_CAMERA = {
  position: [30, 18, 30] as [number, number, number],
  fov: 30,
  near: 0.1,
  far: 1000,
};

const HERO_CAMERA_TARGET = [0, 3.5, 0] as [number, number, number];

export default function HeroScene({ reducedMotion }: HeroSceneProps) {
  const { containerRef, active } = useSceneActivity();
  const pauseMotion = reducedMotion || !active;
  const canvasKey = `${HERO_CAMERA.position.join(",")}-${HERO_CAMERA.fov}-${HERO_CAMERA.near}-${HERO_CAMERA.far}-${HERO_CAMERA_TARGET.join(",")}`;

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        key={canvasKey}
        camera={HERO_CAMERA}
        dpr={HERO_CANVAS_PRESET.dpr}
        gl={HERO_CANVAS_PRESET.gl}
        frameloop={HERO_CANVAS_PRESET.frameloop}
        onCreated={({ gl, camera }) => {
          applyAcesToneMapping(gl, 1.3);

          camera.position.set(
            HERO_CAMERA.position[0],
            HERO_CAMERA.position[1],
            HERO_CAMERA.position[2]
          );

          if ("isPerspectiveCamera" in camera && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
            const perspective = camera as THREE.PerspectiveCamera;
            perspective.fov = HERO_CAMERA.fov;
            perspective.near = HERO_CAMERA.near;
            perspective.far = HERO_CAMERA.far;
            perspective.updateProjectionMatrix();
          }

          camera.lookAt(
            HERO_CAMERA_TARGET[0],
            HERO_CAMERA_TARGET[1],
            HERO_CAMERA_TARGET[2]
          );
        }}
      >
        <color attach="background" args={[palette.sky]} />
        <FrameLimiter
          fps={reducedMotion ? HERO_CANVAS_PRESET.fps.reduced : HERO_CANVAS_PRESET.fps.normal}
          active={active}
        />
        <IridescentBackdrop reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
        <HeroLightRig reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
        <VoxelRamen reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
      </Canvas>
    </div>
  );
}
