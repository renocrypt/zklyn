"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { FrameLimiter } from "./lib/frame-limiter";
import { useSceneActivity } from "./lib/use-scene-activity";
import { FreeCassetteScene } from "./pass/free-cassette";
import { PremiumBonsaiScene } from "./pass/premium-bonsai";

type PassSceneProps = {
  variant: "free" | "premium";
  reducedMotion?: boolean;
};

const palettes = {
  free: {
    sky: "#0b0f16",
    neon: "#60d8ff",
  },
  premium: {
    sky: "#000000",
    neon: "#f59e0b",
  },
};

export default function PassScene({ variant, reducedMotion }: PassSceneProps) {
  const palette = palettes[variant];
  const { containerRef, active } = useSceneActivity();
  const pauseMotion = reducedMotion || !active;
  const camera =
    variant === "free"
      ? { position: [0, 0.2, 6.2] as [number, number, number], fov: 42 }
      : { position: [3.2, 2.4, 3.2] as [number, number, number], zoom: 70 };

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
        {variant === "premium"
          ? <PremiumBonsaiScene reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
          : <FreeCassetteScene neon={palette.neon} reducedMotion={reducedMotion} pauseMotion={pauseMotion} />}
      </Canvas>
    </div>
  );
}
