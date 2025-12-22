"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import {
  applyAcesToneMapping,
  applyReinhardToneMapping,
  CARD_CANVAS_PRESET,
} from "./lib/canvas-presets";
import { FrameLimiter } from "./lib/frame-limiter";
import { useSceneActivity } from "./lib/use-scene-activity";
import { getPassSceneDefinition, type PassSceneId } from "./registry";

type PassSceneProps = {
  id: PassSceneId;
  reducedMotion?: boolean;
};

export default function PassScene({ id, reducedMotion }: PassSceneProps) {
  const definition = getPassSceneDefinition(id);
  const { containerRef, inView, active } = useSceneActivity({ initialInView: false });
  const pauseMotion = reducedMotion || !active;
  const SceneComponent = definition.scene;

  return (
    <div ref={containerRef} className="h-full w-full">
      {inView ? (
        <Canvas
          orthographic={definition.orthographic}
          camera={definition.camera}
          dpr={CARD_CANVAS_PRESET.dpr}
          gl={CARD_CANVAS_PRESET.gl}
          frameloop={CARD_CANVAS_PRESET.frameloop}
          onCreated={({ gl }) => {
            if (definition.toneMapping.kind === "reinhard") {
              applyReinhardToneMapping(gl, definition.toneMapping.exposure);
            } else {
              applyAcesToneMapping(gl, definition.toneMapping.exposure);
            }
          }}
        >
          <color attach="background" args={[definition.palette.sky]} />
          {definition.fog && (
            <fog
              attach="fog"
              args={[definition.palette.sky, definition.fog.near, definition.fog.far]}
            />
          )}
          <FrameLimiter
            fps={reducedMotion ? CARD_CANVAS_PRESET.fps.reduced : CARD_CANVAS_PRESET.fps.normal}
            active={active}
          />
          <Suspense fallback={null}>
            <SceneComponent
              neon={definition.palette.neon}
              reducedMotion={reducedMotion}
              pauseMotion={pauseMotion}
            />
          </Suspense>
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
