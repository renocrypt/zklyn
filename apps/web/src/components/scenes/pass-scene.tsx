"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState, type ComponentType } from "react";

import {
  applyAcesToneMapping,
  applyReinhardToneMapping,
  CARD_CANVAS_PRESET,
} from "./lib/canvas-presets";
import { FrameLimiter } from "./lib/frame-limiter";
import { useSceneActivity } from "./lib/use-scene-activity";
import type { CardSceneProps, PassSceneCanvasConfig } from "./pass/types";
import { getPassSceneDefinition, type PassSceneId } from "./registry";

type PassSceneProps = {
  id: PassSceneId;
  reducedMotion?: boolean;
};

type LoadedPassScene = {
  id: PassSceneId;
  canvas: PassSceneCanvasConfig;
  SceneComponent: ComponentType<CardSceneProps>;
};

export default function PassScene({ id, reducedMotion }: PassSceneProps) {
  const definition = getPassSceneDefinition(id);
  const { containerRef, inView, active } = useSceneActivity({ initialInView: false });
  const pauseMotion = reducedMotion || !active;
  const [loaded, setLoaded] = useState<LoadedPassScene | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!inView) {
      return () => {
        cancelled = true;
      };
    }

    if (loaded?.id === id) {
      return () => {
        cancelled = true;
      };
    }

    definition
      .load()
      .then((module) => {
        if (cancelled) return;
        setLoaded({ id, canvas: module.passSceneCanvas, SceneComponent: module.default });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [definition, id, inView, loaded?.id]);

  const resolved = loaded?.id === id ? loaded : null;

  return (
    <div ref={containerRef} className="h-full w-full">
      {inView && resolved ? (
        <Canvas
          orthographic={"zoom" in resolved.canvas.camera}
          camera={resolved.canvas.camera}
          dpr={CARD_CANVAS_PRESET.dpr}
          gl={CARD_CANVAS_PRESET.gl}
          frameloop={CARD_CANVAS_PRESET.frameloop}
          onCreated={({ gl }) => {
            if (resolved.canvas.toneMapping.kind === "reinhard") {
              applyReinhardToneMapping(gl, resolved.canvas.toneMapping.exposure);
            } else {
              applyAcesToneMapping(gl, resolved.canvas.toneMapping.exposure);
            }
          }}
        >
          <color attach="background" args={[resolved.canvas.background]} />
          {resolved.canvas.fog && (
            <fog
              attach="fog"
              args={[
                resolved.canvas.fog.color,
                resolved.canvas.fog.near,
                resolved.canvas.fog.far,
              ]}
            />
          )}
          <FrameLimiter
            fps={reducedMotion ? CARD_CANVAS_PRESET.fps.reduced : CARD_CANVAS_PRESET.fps.normal}
            active={active}
          />
          <resolved.SceneComponent
            neon={definition.palette.neon}
            reducedMotion={reducedMotion}
            pauseMotion={pauseMotion}
          />
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
