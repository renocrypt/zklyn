import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { WalletProvider } from "@/components/wallet-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
});

const metadataBase =
  process.env.NEXT_PUBLIC_APP_URL &&
  process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : new URL("http://localhost:3000");

export const metadata: Metadata = {
  title: "zklyn — Spatial Access Pass",
  description:
    "Unlock a spatial art experience with a one‑time onchain access pass. Claim free or mint premium to enter the vault.",
  metadataBase,
  openGraph: {
    title: "zklyn — Spatial Access Pass",
    description:
      "Unlock a spatial art experience with a one‑time onchain access pass. Claim free or mint premium to enter the vault.",
    url: "https://zklyn.renocrypt.com",
    siteName: "zklyn",
    images: [
      {
        url: "/zklyn.svg",
        width: 512,
        height: 512,
        alt: "zklyn spatial access pass",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "zklyn — Spatial Access Pass",
    description:
      "Unlock a spatial art experience with a one‑time onchain access pass. Claim free or mint premium to enter the vault.",
    images: ["/zklyn.svg"],
  },
  icons: {
    icon: [{ url: "/zklyn.svg", type: "image/svg+xml" }],
    shortcut: ["/zklyn.svg"],
    apple: ["/zklyn.svg"],
  },
};

export const viewport = {
  themeColor: "#0c0f1a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
