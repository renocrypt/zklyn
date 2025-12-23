export type SceneMotionProps = {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
};

export type CardSceneProps = SceneMotionProps & {
  neon: string;
};

export type ToneMappingKind = "aces" | "reinhard";

export type SceneCameraConfig =
  | { position: [number, number, number]; fov: number; zoom?: never; near?: number; far?: number }
  | { position: [number, number, number]; zoom: number; fov?: never; near?: number; far?: number };

export type PassSceneCanvasConfig = {
  background: string;
  fog?: Readonly<{ color: string; near: number; far: number }>;
  toneMapping: Readonly<{ kind: ToneMappingKind; exposure: number }>;
  camera: SceneCameraConfig;
};
