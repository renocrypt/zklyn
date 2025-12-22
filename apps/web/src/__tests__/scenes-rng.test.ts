import { createSeededRng } from "@/components/scenes/lib/rng";

describe("scene rng", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRng(20251221);
    const b = createSeededRng(20251221);

    const seqA = Array.from({ length: 12 }, () => a());
    const seqB = Array.from({ length: 12 }, () => b());

    expect(seqA).toEqual(seqB);
  });

  it("matches known outputs for a seed (regression guard)", () => {
    const rng = createSeededRng(20251221);
    const values = Array.from({ length: 5 }, () => rng());

    expect(values[0]).toBeCloseTo(0.4431699754, 10);
    expect(values[1]).toBeCloseTo(0.513412487, 10);
    expect(values[2]).toBeCloseTo(0.17309166, 10);
    expect(values[3]).toBeCloseTo(0.6797286433, 10);
    expect(values[4]).toBeCloseTo(0.0581459682, 10);
  });
});

