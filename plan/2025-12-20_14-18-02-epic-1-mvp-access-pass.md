---
mode: plan
task: Epic 1 — MVP Access Pass
created_at: "2025-12-20T14:18:02-05:00"
complexity: medium
---

# Plan: Epic 1 — MVP Access Pass (Contract + Static DApp)

## Goal
- Ship an MVP with an ERC-1155 access-pass contract (free + premium) and a static Next.js dApp that can connect wallets, mint passes, and gate 3D content.

## Scope
- In:
  - ERC-1155 contract with free/premium pass, one-time free claim, adjustable premium price, USDC payment.
  - Foundry tests for mint rules and payments.
  - Static Next.js app with wallet connect, mint UI, ownership checks, and gated content stub.
  - Basic UI styling with shadcn/ui.
  - Minimal E2E/UI flow for “connect → mint → gate check”.
- Out:
  - Onchain metadata hosting strategy.
  - Advanced asset encryption/decryption.
  - Marketplace/resale features beyond standard transferability.
  - Backend services.

## Assumptions / Dependencies
- Initial network: Base mainnet.
- No content encryption in Epic 1 (UI-only gating).
- USDC contract address provided/configured via env.
- Treasury address configured via env.
- Package manager: npm.
- Wallet stack: wagmi/viem (UI kit TBD, default to minimal wagmi UI).

## Phases
1. Contract MVP
   - ERC-1155 with token IDs 0/1, freeClaimed mapping, premium price setter, USDC transferFrom.
   - Foundry tests for free-claim rule, premium payment, owner-only price changes.
2. Static dApp MVP
   - Next.js static export setup.
   - Wallet connect, mint buttons, ownership checks, gated content placeholder.
   - shadcn/ui layout components.
3. Verification + polish
   - Basic E2E/ UI path test (connect → mint → gated state).
   - Build/static export validation for GitHub Pages.

## Tests & Verification
- Contract mint/price rules -> `forge test`
- Frontend unit/integration (basic rendering, gating logic) -> `npm test`
- E2E wallet flow smoke -> `npx playwright test` (or manual checklist if wallet automation blocks)

## Issue CSV
- Path: issues/2025-12-20_14-18-02-epic-1-mvp-access-pass.csv
- Must share the same timestamp/slug as this plan.

## Tools / MCP
- playwright:browser_* — E2E UI flow and smoke checks.
- chrome-devtools:* — supplemental UI inspection/debugging if needed.
- shadcn:* — component scaffolding and examples.
- context7:* — official docs lookups (wagmi/viem/Next.js).

## Acceptance Checklist
- [ ] ERC-1155 contract passes Foundry tests for free and premium minting rules.
- [ ] Static Next.js app connects wallet, mints free/premium, and gates content based on ownership.
- [ ] Build/export completes and is deployable to GitHub Pages.
- [ ] Issue CSV created with tests/tools filled and validated.

## Status Update (2025-12-20)
- Contract + tests complete; free claim verified on Base mainnet.
- WalletConnect QR flow verified; connect/disconnect working.
- UI polish added: friendly wallet errors + network badge.
- Added frontend unit tests for gating states (free/premium); `npm test` passing.
- Premium mint not manually verified (covered by unit tests only).
- Regression checks complete: `forge test`, `npm run build` (apps/web), `npm run test:e2e` (apps/web).

## Risks / Blockers
- Wallet automation in E2E may require manual steps; document if automation is blocked.
- Incorrect USDC address/network config could block premium minting.
- Static export constraints might affect wallet UI libs; require validation early.
- Mainnet-only development increases cost/risk; ensure dry-run via tests before any deploy.

## Rollback / Recovery
- Avoid mainnet deploy until tests pass; use dry-run/simulation where possible.
- If static export issues appear, fall back to minimal UI and remove blocking features.

## Checkpoints
- Commit after: Phase 1 (contract + tests), Phase 2 (frontend + gating), Phase 3 (E2E/build validation).

## Wrap-up
- Ready to wrap. Regression checks completed.

## References
- AGENTS.md
- docs/testing-policy.md
- docs/mcp-tools.md
