import type { ComponentType } from "react";

import type { CardSceneProps, PassSceneCanvasConfig } from "./pass/types";

export type PassSceneId = "free-gallery" | "premium-vault";
export type PassTier = "free" | "premium";

export type PassSceneCardContext = {
  freeBalance: bigint;
  premiumBalance: bigint;
  freeClaimed: boolean;
};

export type PassSceneModule = {
  default: ComponentType<CardSceneProps>;
  passSceneCanvas: PassSceneCanvasConfig;
};

export type PassSceneDefinition = {
  id: PassSceneId;
  tier: PassTier;
  anchorId?: string;
  title: string;
  chips: readonly string[];
  getDescription: (ctx: PassSceneCardContext) => string;
  palette: Readonly<{ neon: string }>;
  load: () => Promise<PassSceneModule>;
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
    palette: { neon: "#60d8ff" },
    load: () => import("./pass/free-cassette"),
  },
  {
    id: "premium-vault",
    tier: "premium",
    anchorId: "premium",
    title: "Premium Vault",
    chips: ["Ultra assets", "Alternate lighting", "Hidden gallery"],
    getDescription: ({ premiumBalance }) =>
      premiumBalance > 0n ? "Premium assets unlocked." : "Mint premium to unlock this vault.",
    palette: { neon: "#f59e0b" },
    load: () => import("./pass/premium-bonsai"),
  },
] as const;

const PASS_SCENE_BY_ID = Object.fromEntries(
  PASS_SCENE_DEFINITIONS.map((definition) => [definition.id, definition])
) as Record<PassSceneId, PassSceneDefinition>;

export function getPassSceneDefinition(id: PassSceneId): PassSceneDefinition {
  return PASS_SCENE_BY_ID[id];
}
