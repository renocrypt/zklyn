export type SceneMotionProps = {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
};

export type CardSceneProps = SceneMotionProps & {
  neon: string;
};
