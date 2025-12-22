import { getPassSceneDefinition, PASS_SCENE_DEFINITIONS } from "@/components/scenes/registry";

describe("pass scene registry", () => {
  it("has unique ids", () => {
    const ids = PASS_SCENE_DEFINITIONS.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lookups return the same definition", () => {
    for (const definition of PASS_SCENE_DEFINITIONS) {
      expect(getPassSceneDefinition(definition.id)).toBe(definition);
    }
  });

  it("has sane camera config per entry", () => {
    for (const definition of PASS_SCENE_DEFINITIONS) {
      const camera = definition.camera as Record<string, unknown>;
      const hasFov = "fov" in camera;
      const hasZoom = "zoom" in camera;

      expect(hasFov || hasZoom).toBe(true);
      expect(hasFov && hasZoom).toBe(false);

      if (definition.orthographic) {
        expect(hasZoom).toBe(true);
      } else {
        expect(hasFov).toBe(true);
      }
    }
  });

  it("produces correct marketing copy for known states", () => {
    const free = getPassSceneDefinition("free-gallery");
    const premium = getPassSceneDefinition("premium-vault");

    expect(
      free.getDescription({ freeBalance: 1n, premiumBalance: 0n, freeClaimed: true })
    ).toBe("You have access to the base spatial gallery.");

    expect(
      free.getDescription({ freeBalance: 0n, premiumBalance: 0n, freeClaimed: true })
    ).toBe("Already claimed (transferable).");

    expect(
      free.getDescription({ freeBalance: 0n, premiumBalance: 0n, freeClaimed: false })
    ).toBe("One per wallet. Instant access.");

    expect(
      premium.getDescription({ freeBalance: 0n, premiumBalance: 1n, freeClaimed: false })
    ).toBe("Premium assets unlocked.");

    expect(
      premium.getDescription({ freeBalance: 0n, premiumBalance: 0n, freeClaimed: false })
    ).toBe("Mint premium to unlock this vault.");
  });
});

