---
mode: plan
task: "Epic 4: 3D scene architecture + performance"
created_at: "2025-12-21T18:22:08-05:00"
complexity: complex
---

# Plan: Epic 4 — 3D Scene Architecture + Performance

## Goal
- Split 3D scenes into maintainable modules (no "enchilada" scene files).
- Standardize throttling so multiple small 3D cards don’t overheat devices.
- Extract shared scene logic into reusable hooks/utilities (Next.js + React best practices).
- Preserve current visuals/behavior for hero + existing free/premium scenes.

## Scope
- In:
  - Refactor `apps/web/src/components/scenes/pass-scene.tsx` into a thin orchestrator and per-scene modules.
  - Extract shared utilities used by both `hero-scene.tsx` and pass scenes:
    - `useSceneActivity` (in-view + pause on scroll + tab visibility)
    - `FrameLimiter`
    - deterministic RNG helper
    - shared Canvas defaults (DPR/FPS/GL flags + tone mapping patterns)
  - Add a typed “scene registry” pattern to make adding new cards predictable.
  - Add unit tests for extracted *pure* generators/config (determinism + counts).
  - Document: why we keep React Three Fiber (R3F) and how to add new scenes.
- Out:
  - Full switch back to raw Three.js across the app.
  - Heavy postprocessing (bloom/composer); keep things lightweight.
  - Major visual redesign of existing scenes (only refactor/perf).

## Assumptions / Dependencies
- R3F remains the default renderer for maintainability and consistent integration with React/Next.
- Each card keeps `frameloop="demand"` with explicit invalidation for low-power rendering.
- Visual QA will be done manually in a local browser (no Playwright-driven inspection).
- Existing CI/local scripts are the source of truth for correctness:
  - `npm -C apps/web run check`
  - `npm -C apps/web run build`

## Phases
1. **Scene modularization**
   - Create `apps/web/src/components/scenes/lib/` with shared helpers.
   - Split `pass-scene.tsx` into:
     - `apps/web/src/components/scenes/pass/` (free/premium scene implementations)
     - keep `pass-scene.tsx` as the orchestration/Canvas wrapper.
2. **Shared performance profile**
   - Introduce a reusable “quality preset” (DPR, target FPS, renderer flags) for:
     - hero canvas
     - card canvases
   - Add optional lazy-mount for offscreen scenes (placeholder until in view).
3. **Scene registry + docs**
   - Add a typed registry that maps card IDs → scene component + tier + perf preset.
   - Document: how to add a new scene/card + where shared hooks live.

## Tests & Verification
- Refactor safety:
  - `npm -C apps/web run check`
  - `npm -C apps/web run build`
- Unit tests (new):
  - Deterministic output checks for extracted voxel/matrix generators (seeded RNG).
- Manual QA:
  - Run `npm -C apps/web run dev` and confirm:
    - hero + free + premium cards render
    - animation pauses during scroll/offscreen/tab hidden
    - no console errors

## Issue CSV
- Path: `issues/2025-12-21_18-20-18-epic-4-3d-scene-architecture-performance.csv`
- Must share the same timestamp/slug as this plan.

## Tools / MCP
- Local tooling: `npm`, `eslint`, `tsc`, `jest`, `next build`.
- Optional research: `context7:resolve-library-id` + `context7:get-library-docs` for R3F/three best practices.
- Visual QA: `manual` (per your preference).

## Acceptance Checklist
- [ ] `apps/web/src/components/scenes/pass-scene.tsx` is a thin orchestrator only.
- [ ] Free and premium card scenes each live in their own modules.
- [ ] Shared utilities are extracted and used by both hero + pass scenes.
- [ ] Consistent throttling defaults exist for hero vs cards.
- [ ] Adding a new card scene requires minimal boilerplate (registry + new module).
- [ ] New unit tests cover deterministic generators/config.
- [ ] `npm -C apps/web run check` passes.
- [ ] `npm -C apps/web run build` passes.

## Risks / Blockers
- Refactor could subtly change Canvas lifecycle (camera/frameloop invalidation).
- Lazy-mounting canvases can introduce a one-frame pop-in if not tuned.
- Some scene logic is inherently visual and not fully unit-testable.

## Rollback / Recovery
- Keep commits small and phase-scoped.
- Roll back with `git revert <commit>` per phase if behavior changes unexpectedly.

## Checkpoints
- Commit after: Phase 1 (modularization)
- Commit after: Phase 2 (performance preset + lazy mount)
- Commit after: Phase 3 (registry + docs + tests)

## References
- `apps/web/src/components/scenes/pass-scene.tsx`
- `apps/web/src/components/scenes/hero-scene.tsx`
- `docs/testing-policy.md`
- `docs/mcp-tools.md`
