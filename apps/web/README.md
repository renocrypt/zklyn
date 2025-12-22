# zklyn web

Static Next.js dApp for wallet connect, minting, and access gating on Base.

## Setup

```bash
npm install
cp .env.example .env.local
```

Update `.env.local` with the deployed AccessPass address.

## Environment variables

- `NEXT_PUBLIC_ACCESS_PASS_ADDRESS` — deployed ERC-1155 AccessPass contract.
- `NEXT_PUBLIC_USDC_ADDRESS` — Base mainnet native USDC address.
- `NEXT_PUBLIC_TREASURY_ADDRESS` — wallet receiving USDC payments.
- `NEXT_PUBLIC_PREMIUM_PRICE` — premium price in 6-decimal USDC (e.g. 100000000).
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect Project ID for QR/deep-link connections.
- `NEXT_PUBLIC_APP_URL` — public app URL used in WalletConnect metadata.
- `NEXT_PUBLIC_BASE_PATH` — set if deploying to GitHub Pages subpath.

## Commands

```bash
npm run dev
npm run build
npm run check
```

## 3D scenes (R3F)

3D visuals are implemented with React Three Fiber (R3F) and split into small modules:

- `src/components/scenes/hero-scene.tsx` → hero canvas orchestrator
  - `src/components/scenes/hero/*` → hero scene modules (backdrop, lights, ramen)
- `src/components/scenes/pass-scene.tsx` → card canvas orchestrator (Free/Premium)
  - `src/components/scenes/pass/*` → per-card scene modules (cassette, bonsai)
- `src/components/scenes/lib/*` → shared helpers (`useSceneActivity`, `FrameLimiter`, presets, RNG)
- `src/components/scenes/registry.ts` → single source of truth for card scenes (UI labels + render config)

### Adding a new card scene

1. Create a new scene module under `src/components/scenes/pass/` that exports a React component accepting
   `CardSceneProps` (`src/components/scenes/pass/types.ts`).
2. Add an entry to `src/components/scenes/registry.ts`:
   - `id`, `title`, `chips`, `getDescription(...)`
   - `palette`, `camera`, `toneMapping`, optional `fog`
   - `scene: lazy(() => import("./pass/<your-file>").then(...))`
3. The page renders cards from `PASS_SCENE_DEFINITIONS`, so your new card will appear automatically.

### Performance notes

- Card canvases are lazy-mounted only when in view (avoids extra WebGL contexts offscreen).
- All canvases use `frameloop="demand"` + `FrameLimiter` to target a lower FPS (and pause while scrolling/tab hidden).
- Avoid heavy postprocessing (bloom/composer) for small card scenes.

## Deployment notes

- The app is configured for static export (`output: "export"`).
- For GitHub Pages, set `NEXT_PUBLIC_BASE_PATH` to your repo name.
