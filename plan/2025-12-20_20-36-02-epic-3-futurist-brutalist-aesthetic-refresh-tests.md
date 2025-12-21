---
mode: plan
task: Epic 3 — Futurist/Brutalist Aesthetic Refresh + Tests
created_at: "2025-12-20T20:36:02-05:00"
complexity: medium
---

# Plan: Epic 3 — Futurist/Brutalist Aesthetic Refresh + Tests

## Goal
- Elevate visual language to a futurist/brutalist blend with refined abstraction, fix layout overflow, and add dynamic hero lighting while keeping consistent unit test coverage.

## Scope
- In:
  - Redesign hero and gated sections to match futurist/brutalist cues (structure, rhythm, contrast).
  - Fix right-side overflow/margins for Premium Vault + Free Gallery.
  - Add dynamic light motion/pulsing in hero scene.
  - Add/adjust unit tests for new components and layout behavior.
- Out:
  - New backend services or contract changes.
  - Full re-architecture of app routing or wallet flows.

## Assumptions / Dependencies
- Use existing fonts: Space Grotesk + Fraunces.
- Keep dark base palette; refine with accent gradients and metallic/cement tones.
- Inspiration sources include futurist and brutalist references (no direct copying).

## Phases
1. Visual direction + layout corrections
2. Hero motion & scene upgrades
3. Testing + polish pass

## Tests & Verification
- Layout + components -> npm test
- UI smoke/regression -> npm run test:e2e
- Visual QA via MCP Playwright snapshots at 375px + 1440px; confirm no horizontal scroll, margins align, and hero lights animate.

## Issue CSV
- Path: issues/2025-12-20_20-36-02-epic-3-futurist-brutalist-aesthetic-refresh-tests.csv
- Must share the same timestamp/slug as this plan.

## Tools / MCP
- shadcn:search_items_in_registries — check for layout utilities or hero/section patterns.
- shadcn:get_item_examples_from_registries — pull example composition patterns if needed.
- playwright:browser_snapshot — visual regression snapshots for key sections.

## Acceptance Checklist
- [ ] Premium Vault + Free Gallery no longer overflow horizontally on any breakpoint.
- [ ] Hero lighting is visibly animated (smooth pulsing/motion).
- [ ] Visual language reads futurist/brutalist (structure + contrast + rhythm).
- [ ] Unit tests updated/added and passing.
- [ ] E2E smoke tests updated and passing.

## Risks / Blockers
- Over-stylization could reduce readability; mitigate with contrast checks.
- 3D animation changes might introduce performance regressions; keep geometry light and motion subtle.

## Rollback / Recovery
- Revert to previous UI and scene components if motion/perf regressions occur.

## Checkpoints
- Commit after: Phase 1 layout fixes
- Commit after: Phase 2 hero motion
- Commit after: Phase 3 tests/polish

## References
- apps/web/src/app/page.tsx
- apps/web/src/components/scenes/hero-scene.tsx
- apps/web/src/components/sections/*
- apps/web/src/__tests__/*
- apps/web/tests/e2e/smoke.spec.ts
