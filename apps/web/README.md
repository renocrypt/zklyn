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
```

## Deployment notes

- The app is configured for static export (`output: "export"`).
- For GitHub Pages, set `NEXT_PUBLIC_BASE_PATH` to your repo name.
