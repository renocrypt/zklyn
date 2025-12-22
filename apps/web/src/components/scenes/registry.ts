import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

import type { CardSceneProps } from "./pass/types";

export type PassSceneId = "free-gallery" | "premium-vault";
export type PassTier = "free" | "premium";

export type ToneMappingKind = "aces" | "reinhard";

export type SceneCameraConfig =
  | { position: [number, number, number]; fov: number; zoom?: never }
  | { position: [number, number, number]; zoom: number; fov?: never };

export type PassSceneCardContext = {
  freeBalance: bigint;
  premiumBalance: bigint;
  freeClaimed: boolean;
};

export type PassSceneDefinition = {
  id: PassSceneId;
  tier: PassTier;
  anchorId?: string;
  title: string;
  chips: readonly string[];
  getDescription: (ctx: PassSceneCardContext) => string;
  palette: Readonly<{ sky: string; neon: string }>;
  orthographic: boolean;
  camera: SceneCameraConfig;
  fog?: Readonly<{ near: number; far: number }>;
  toneMapping: Readonly<{ kind: ToneMappingKind; exposure: number }>;
  scene: LazyExoticComponent<ComponentType<CardSceneProps>>;
};

export const PASS_SCENE_DEFINITIONS: readonly PassSceneDefinition[] = [
  {
    id: "free-gallery",
    tier: "free",
    title: "Free Gallery",
    chips: ["Ambient scene", "Spatial audio", "Gallery loop"],
    getDescription: ({ freeBalance, freeClaimed }) =>
      freeBalance > 0n
        ? "You have access to the base spatial gallery."
        : freeClaimed
          ? "Already claimed (transferable)."
          : "One per wallet. Instant access.",
    palette: { sky: "#0b0f16", neon: "#60d8ff" },
    orthographic: false,
    camera: { position: [0, 0.2, 6.2], fov: 42 },
    fog: { near: 4.5, far: 9 },
    toneMapping: { kind: "aces", exposure: 1.15 },
    scene: lazy(() =>
      import("./pass/free-cassette").then((m) => ({ default: m.FreeCassetteScene }))
    ),
  },
  {
    id: "premium-vault",
    tier: "premium",
    anchorId: "premium",
    title: "Premium Vault",
    chips: ["Ultra assets", "Alternate lighting", "Hidden gallery"],
    getDescription: ({ premiumBalance }) =>
      premiumBalance > 0n ? "Premium assets unlocked." : "Mint premium to unlock this vault.",
    palette: { sky: "#000000", neon: "#f59e0b" },
    orthographic: true,
    camera: { position: [3.2, 2.4, 3.2], zoom: 70 },
    toneMapping: { kind: "reinhard", exposure: 1.0 },
    scene: lazy(() =>
      import("./pass/premium-bonsai").then((m) => ({ default: m.PremiumBonsaiScene }))
    ),
  },
] as const;

const PASS_SCENE_BY_ID = Object.fromEntries(
  PASS_SCENE_DEFINITIONS.map((definition) => [definition.id, definition])
) as Record<PassSceneId, PassSceneDefinition>;

export function getPassSceneDefinition(id: PassSceneId): PassSceneDefinition {
  return PASS_SCENE_BY_ID[id];
}
