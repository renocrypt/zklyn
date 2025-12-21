---
mode: plan
task: Epic 2 — UI/UX High‑Art Refresh (Motion + 3D)
created_at: "2025-12-20T19:20:31-05:00"
complexity: medium
---

# Plan: Epic 2 — UI/UX High‑Art Refresh (Motion + 3D)

## Goal
- Deliver a high‑aesthetic, mobile‑first UI with a dynamic floating nav, new SVG logo/favicon, refined typography + palette, and performant 3D accents while preserving the existing mint/gating logic.

## Scope
- In:
  - New responsive layout (mobile‑first) with “modern high art” vibe.
  - Floating nav with scroll‑responsive morphing height/rounding + smooth non‑linear Motion animation.
  - New minimalist SVG logo; used as nav mark + favicon (replace default Next.js favicon).
  - Typography system: Space Grotesk (sans) + Fraunces (serif).
  - Dark palette with vibrant, refined accents (not gaudy).
  - Motion‑based interactions (scroll + layout transitions).
  - three.js + react‑three‑fiber scenes in hero + gated sections.
  - Next.js metadata update (title/description/OG + icons).
  - New/updated tests; fix any broken tests as we refactor.
- Out:
  - Full production 3D asset pipeline.
  - Backend/auth services.
  - Full premium content build‑out.

## Assumptions / Dependencies
- Use Motion’s current package (`motion` / `motion/react`).
- New SVG logo will be created and reused for favicon and nav.
- 3D scenes will be lightweight with perf safeguards (lazy‑load, reduced motion).

## Phases
1. Design system refresh
   - Define palette + shadows + radius scale.
   - Add Space Grotesk + Fraunces via Next.js fonts + global styles.
   - Update metadata + icons.
2. Navigation + Motion
   - Build floating nav with SVG logo.
   - Implement scroll morph (height + radius) with non‑linear easing.
   - Add reduced‑motion support.
3. 3D integration
   - Add `three` + `@react-three/fiber` (+ `@react-three/drei` as needed).
   - Create hero + gated section scenes with performance guards.
4. Page layout + content
   - Recompose hero + sections for high‑art aesthetic.
   - Integrate motion/3D interactions where appropriate.
5. Verification + polish
   - Run unit + E2E tests.
   - Fix any broken tests introduced by refactor.
   - Responsive + accessibility checks.

## Tests & Verification
- UI unit tests -> `npm test`
- E2E smoke -> `npm run test:e2e`
- Manual checklist: nav scroll morph, 3D load, mobile/desktop layouts.

## Issue CSV
- Path: issues/2025-12-20_19-20-31-epic-2-ui-ux-high-art-refresh-motion-3d.csv
- Must share the same timestamp/slug as this plan.

## Tools / MCP
- context7:get-library-docs — Motion + R3F docs.
- shadcn:search_items_in_registries — UI components.
- playwright:browser_* — UI smoke + responsive checks.
- chrome-devtools:performance_* — quick perf trace if needed.

## Acceptance Checklist
- [ ] Mobile‑first layout with high‑art vibe and refined palette.
- [ ] Floating nav morphs on scroll with smooth Motion animation.
- [ ] New SVG logo used for nav + favicon; default favicon removed.
- [ ] New typography (Space Grotesk + Fraunces) applied globally.
- [ ] 3D scenes integrated with graceful fallback (hero + gated sections).
- [ ] Tests pass; broken tests fixed during refactor.

## Risks / Blockers
- 3D content can impact performance on low‑end devices.
- Motion + R3F may increase bundle size; optimize/lazy‑load.
- Static export constraints with App Router + 3D/motion need validation.

## Rollback / Recovery
- Feature‑flag 3D and nav morph; fallback to current layout.
- Keep legacy hero layout as fallback component.

## Checkpoints
- Commit after: design system + nav, 3D integration, final polish + QA.

## Status Update (2025-12-20)
- Design system, nav, 3D scenes, and layout recompose completed.
- SVG logo added and reused for favicon + nav.
- Tests passing: `npm test`, `npm run test:e2e`, `npm run build` (apps/web).

## References
- docs/testing-policy.md
- docs/mcp-tools.md
