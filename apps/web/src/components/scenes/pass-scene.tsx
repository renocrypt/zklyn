"use client";

import { Canvas } from "@react-three/fiber";

import {
  applyAcesToneMapping,
  applyReinhardToneMapping,
  CARD_CANVAS_PRESET,
} from "./lib/canvas-presets";
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
  const { containerRef, inView, active } = useSceneActivity({ initialInView: false });
  const pauseMotion = reducedMotion || !active;
  const camera =
    variant === "free"
      ? { position: [0, 0.2, 6.2] as [number, number, number], fov: 42 }
      : { position: [3.2, 2.4, 3.2] as [number, number, number], zoom: 70 };

  return (
    <div ref={containerRef} className="h-full w-full">
      {inView ? (
        <Canvas
          orthographic={variant === "premium"}
          camera={camera}
          dpr={CARD_CANVAS_PRESET.dpr}
          gl={CARD_CANVAS_PRESET.gl}
          frameloop={CARD_CANVAS_PRESET.frameloop}
          onCreated={({ gl }) => {
            if (variant === "premium") {
              applyReinhardToneMapping(gl, 1.0);
            } else {
              applyAcesToneMapping(gl, 1.15);
            }
          }}
        >
          <color attach="background" args={[palette.sky]} />
          {variant === "free" && <fog attach="fog" args={[palette.sky, 4.5, 9]} />}
          <FrameLimiter
            fps={reducedMotion ? CARD_CANVAS_PRESET.fps.reduced : CARD_CANVAS_PRESET.fps.normal}
            active={active}
          />
          {variant === "premium" ? (
            <PremiumBonsaiScene reducedMotion={reducedMotion} pauseMotion={pauseMotion} />
          ) : (
            <FreeCassetteScene
              neon={palette.neon}
              reducedMotion={reducedMotion}
              pauseMotion={pauseMotion}
            />
          )}
        </Canvas>
      ) : (
        <div
          aria-hidden
          className="h-full w-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(96,216,255,0.10),transparent_60%)]"
        />
      )}
    </div>
  );
}
