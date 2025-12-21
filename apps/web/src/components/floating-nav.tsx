"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

type FloatingNavProps = {
  address?: string;
  isConnected: boolean;
  connectors: { id: string; name: string }[];
  isConnecting: boolean;
  showConnectors: boolean;
  onToggleConnectors: () => void;
  onConnect: (connectorId?: string) => void;
  onDisconnect: () => void;
  networkLabel: string;
  networkBadgeClass: string;
};

const shortenAddress = (value?: string) => {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const navLinks = [
  { label: "Pass", href: "#mint" },
  { label: "Free", href: "#free" },
  { label: "Vault", href: "#premium" },
];

export function FloatingNav({
  address,
  isConnected,
  connectors,
  isConnecting,
  showConnectors,
  onToggleConnectors,
  onConnect,
  onDisconnect,
  networkLabel,
  networkBadgeClass,
}: FloatingNavProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      const next = Math.min(window.scrollY / 160, 1);
      setScrollProgress(next);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReducedMotion, scrollProgress]);

  const easedProgress = useMemo(() => {
    if (prefersReducedMotion) return 0;
    return 1 - Math.pow(1 - scrollProgress, 3);
  }, [prefersReducedMotion, scrollProgress]);

  const lerp = (from: number, to: number) => from + (to - from) * easedProgress;
  const height = lerp(82, 56);
  const paddingX = lerp(26, 16);
  const paddingY = lerp(18, 8);
  const radius = lerp(14, 999);
  const borderOpacity = lerp(0.2, 0.42);
  const shadowOpacity = lerp(0.22, 0.48);

  const borderColor = `rgba(255, 255, 255, ${borderOpacity})`;
  const boxShadow = `0 26px 70px rgba(2, 6, 18, ${shadowOpacity})`;

  return (
    <motion.header
      className="fixed left-2 right-2 top-2 z-50 mx-auto flex max-w-6xl items-center border border-transparent bg-black/70 backdrop-blur-xl"
      animate={{
        height: prefersReducedMotion ? 64 : height,
        paddingLeft: prefersReducedMotion ? 20 : paddingX,
        paddingRight: prefersReducedMotion ? 20 : paddingX,
        paddingTop: prefersReducedMotion ? 12 : paddingY,
        paddingBottom: prefersReducedMotion ? 12 : paddingY,
        borderRadius: prefersReducedMotion ? 999 : radius,
        borderColor: prefersReducedMotion
          ? "rgba(255, 255, 255, 0.2)"
          : borderColor,
        boxShadow: prefersReducedMotion
          ? "0 18px 40px rgba(5, 8, 20, 0.35)"
          : boxShadow,
      }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        mass: 0.6,
      }}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/5">
            <Image src="/zklyn.svg" alt="zklyn" width={28} height={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
              zklyn
            </span>
            <span className="text-sm font-semibold">Spatial Access</span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm uppercase tracking-[0.2em] text-muted-foreground lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span
            className={`hidden rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] lg:inline-flex ${networkBadgeClass}`}
          >
            {networkLabel}
          </span>
          {!isConnected ? (
            <div className="relative flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  connectors.length > 1 ? onToggleConnectors() : onConnect()
                }
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting…" : "Connect"}
              </Button>
              {showConnectors && connectors.length > 1 && (
                <div className="absolute right-0 top-11 z-10 w-48 rounded-2xl border border-white/10 bg-background/95 p-2 text-sm shadow-2xl backdrop-blur">
                  <p className="px-2 pb-2 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Select wallet
                  </p>
                  <div className="flex flex-col gap-2">
                    {connectors.map((connector) => (
                      <Button
                        key={connector.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onConnect(connector.id)}
                      >
                        {connector.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground lg:flex">
                {shortenAddress(address)}
              </div>
              <Button size="sm" variant="outline" onClick={onDisconnect}>
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
