"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { base, mainnet } from "wagmi/chains";

const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const isClient = typeof window !== "undefined";

const connectors = [
  injected({ shimDisconnect: true }),
  ...(projectId && isClient
    ? [
        walletConnect({
          projectId,
          showQrModal: true,
          metadata: {
            name: "zklyn",
            description: "Access pass minting for the zklyn 3D experience.",
            url: appUrl,
            icons: [],
          },
        }),
      ]
    : []),
];

const config = createConfig({
  chains: [base, mainnet],
  connectors,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
