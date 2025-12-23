# AGENTS

> Purpose: Build a Base-based ERC-1155 access-pass system and a static Next.js dApp that gates 3D content by NFT ownership.

## Role & objective
- Role: Build ERC-1155 contract + static Next.js dApp for NFT pass gating.
- Objective: Deliver a freemium access-pass mint flow (free and premium) and UI gating for 3D assets with no backend.

## Constraints (non-negotiable)
- Chain: Base (Ethereum L2). No gas sponsorship; users pay Base fees.
- Smart contract: single ERC-1155 with token IDs 0 (Free Pass) and 1 (Premium Pass).
- Free claim rule: one free claim per wallet via mapping (freeClaimed[address]).
- Premium mint requires USDC transferFrom to treasury, then mint.
- Premium price adjustable via owner-only setPremiumPrice without redeploy.
- Owner controls: setTreasury and setURI.
- Transferable/resellable tokens (default ERC-1155 behavior).
- Web app is static-only (Next.js SSG/export), no backend.
- Content gating is UI-only; optional client-side decryption allowed but not required.

## Tech & data
- Contracts: Solidity, Foundry, OpenZeppelin.
- Frontend: TypeScript, Next.js (static export), shadcn/ui, wagmi/viem, three.js.
- Wallet connectivity: injected + optional WalletConnect; Base mainnet transactions.
- Hosting: GitHub Pages (static assets).
- Data sources: Base RPC via wallet provider; USDC contract on Base.

## Project testing strategy
- Unit/integration (contracts): `forge test`.
- Unit/integration (frontend): `npm test` (Jest).
- E2E/UI: `npx playwright test`.
- Build/run: `npm run dev`, `npm run build`.
- MCP tools: playwright, chrome-devtools, context7, shadcn.

## E2E loop
E2E loop = plan → issues → implement → test → review → commit → regression.

## Plan & issue generation
- Use the `plan` skill for plan and Issue CSV generation.
- Plans must include: steps, tests, risks, and rollback/safety notes.

## Issue CSV guidelines
- Required columns: ID, Title, Description, Acceptance, Test_Method, Tools, Dev_Status, Review1_Status, Regression_Status, Files, Dependencies, Notes.
- Status values: TODO | DOING | DONE.
- Follow `issues/README.md`.

## Tool usage
- When a matching MCP tool exists, use it; do not guess or simulate results.
- Prefer the tool specified in the Issue CSV `Tools` column.
- If a tool is unavailable or fails, note it and proceed with the safest alternative.

## Testing policy
- Follow `docs/testing-policy.md` for verification requirements and defaults.

## Safety
- Avoid destructive commands unless explicitly requested.
- Preserve backward compatibility unless asked to break it.
- Never expose secrets; redact if encountered.

## Output style
- Keep responses concise and structured.
- Provide file references with line numbers when editing.
- Always include risks and suggested next steps for non-trivial changes.

## MCP tools catalog
- See `docs/mcp-tools.md` for the current MCP server/tool list.
