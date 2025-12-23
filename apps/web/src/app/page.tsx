"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { formatUnits, zeroAddress } from "viem";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FloatingNav } from "@/components/floating-nav";
import { LockOverlay } from "@/components/lock-overlay";
import { accessPassAbi, erc20Abi } from "@/lib/abis";
import {
  ACCESS_PASS_ADDRESS,
  PREMIUM_PRICE_FALLBACK,
  TREASURY_ADDRESS,
  USDC_ADDRESS,
} from "@/config/web3";
import { PASS_SCENE_DEFINITIONS } from "@/components/scenes/registry";

const HeroScene = dynamic(() => import("@/components/scenes/hero-scene"), {
  ssr: false,
});
const PassScene = dynamic(() => import("@/components/scenes/pass-scene"), {
  ssr: false,
});

const steps = [
  "Connect a wallet on Base",
  "Claim the free pass once per wallet",
  "Approve USDC and mint Premium",
  "Enter the spatial vault",
];

const panelClass =
  "relative overflow-hidden border border-white/10 bg-black/30 shadow-[0_32px_90px_rgba(2,6,20,0.55)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_55%)]";
const pillClass =
  "rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.6rem] uppercase tracking-[0.25em]";

const formatWalletError = (err: unknown) => {
  const error = err as {
    name?: string;
    message?: string;
    shortMessage?: string;
    details?: string;
    cause?: { name?: string; message?: string; shortMessage?: string };
  };
  const combined = [
    error?.shortMessage,
    error?.message,
    error?.details,
    error?.cause?.shortMessage,
    error?.cause?.message,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    error?.name === "UserRejectedRequestError" ||
    error?.cause?.name === "UserRejectedRequestError" ||
    /user rejected|user denied|denied transaction signature|rejected/i.test(
      combined
    )
  ) {
    return "Transaction cancelled in wallet.";
  }

  if (/chain not configured|wrong network/i.test(combined)) {
    return "Wallet is on an unsupported network. Please switch to Base.";
  }

  if (/insufficient funds/i.test(combined)) {
    return "Not enough ETH on Base to cover gas.";
  }

  return combined || "Something went wrong. Please try again.";
};

const shortenAddress = (value?: string) => {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showConnectors, setShowConnectors] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const accessPassAddress = ACCESS_PASS_ADDRESS
    ? (ACCESS_PASS_ADDRESS as `0x${string}`)
    : undefined;
  const usdcAddress = USDC_ADDRESS ? (USDC_ADDRESS as `0x${string}`) : undefined;
  const treasuryAddress = TREASURY_ADDRESS;

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: base.id });
  const prefersReducedMotion = useReducedMotion() ?? false;

  const needsChainSwitch = isConnected && chainId !== base.id;
  const isOnBase = isConnected && chainId === base.id;
  const canTransact =
    isConnected && !needsChainSwitch && Boolean(accessPassAddress);

  const userAddress = (address ?? zeroAddress) as `0x${string}`;
  const readEnabled = Boolean(isConnected && accessPassAddress);

  const {
    data: freeClaimedData,
    refetch: refetchFreeClaimed,
  } = useReadContract({
    address: accessPassAddress ?? zeroAddress,
    abi: accessPassAbi,
    functionName: "freeClaimed",
    args: [userAddress],
    chainId: base.id,
    query: { enabled: readEnabled },
  });

  const { data: freeBalanceData, refetch: refetchFreeBalance } =
    useReadContract({
      address: accessPassAddress ?? zeroAddress,
      abi: accessPassAbi,
      functionName: "balanceOf",
      args: [userAddress, 0n],
      chainId: base.id,
      query: { enabled: readEnabled },
    });

  const { data: premiumBalanceData, refetch: refetchPremiumBalance } =
    useReadContract({
      address: accessPassAddress ?? zeroAddress,
      abi: accessPassAbi,
      functionName: "balanceOf",
      args: [userAddress, 1n],
      chainId: base.id,
      query: { enabled: readEnabled },
    });

  const { data: premiumPriceData, refetch: refetchPremiumPrice } =
    useReadContract({
      address: accessPassAddress ?? zeroAddress,
      abi: accessPassAbi,
      functionName: "premiumPrice",
      chainId: base.id,
      query: { enabled: Boolean(accessPassAddress) },
    });

  const { data: usdcBalanceData, refetch: refetchUsdcBalance } =
    useReadContract({
      address: usdcAddress ?? zeroAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress],
      chainId: base.id,
      query: { enabled: Boolean(isConnected && usdcAddress) },
    });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress ?? zeroAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAddress, accessPassAddress ?? zeroAddress],
    chainId: base.id,
    query: { enabled: Boolean(isConnected && usdcAddress && accessPassAddress) },
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const freeClaimed = Boolean(freeClaimedData);
  const freeBalance = freeBalanceData ?? 0n;
  const premiumBalance = premiumBalanceData ?? 0n;
  const premiumPrice = premiumPriceData ?? PREMIUM_PRICE_FALLBACK;
  const usdcBalance = usdcBalanceData ?? 0n;
  const allowance = allowanceData ?? 0n;

  const premiumPriceLabel = useMemo(
    () => formatUnits(premiumPrice, 6),
    [premiumPrice]
  );

  const usdcBalanceLabel = useMemo(
    () => formatUnits(usdcBalance, 6),
    [usdcBalance]
  );

  const needsApproval = allowance < premiumPrice;
  const hasFreePass = freeBalance > 0n;
  const hasPremiumPass = premiumBalance > 0n;
  const canClaimFree = canTransact && !freeClaimed && freeBalance === 0n;
  const showVault = Boolean(accessPassAddress);

  const networkLabel = !isConnected
    ? "Not connected"
    : chainId === base.id
    ? "Base"
    : chainId === mainnet.id
    ? "Ethereum"
    : `Chain ${chainId}`;

  const networkBadgeClass = !isConnected
    ? "border-border/60 bg-muted/40 text-muted-foreground"
    : chainId === base.id
    ? "border-emerald-200/40 bg-emerald-500/10 text-emerald-200"
    : "border-amber-200/40 bg-amber-500/10 text-amber-200";

  const handleConnect = async (connectorId?: string) => {
    setError("");
    setStatus("");
    const connector =
      connectors.find((item) => item.id === connectorId) ?? connectors[0];
    if (!connector) {
      setError("No wallet connector available.");
      return;
    }
    await connect({ connector });
    setShowConnectors(false);
  };

  const handleClaimFree = async () => {
    if (!canTransact || !accessPassAddress) return;
    setError("");
    setStatus("Submitting free pass claim…");
    try {
      const hash = await writeContractAsync({
        address: accessPassAddress,
        abi: accessPassAbi,
        functionName: "claimFree",
        chainId: base.id,
      });
      setStatus("Waiting for confirmation…");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setStatus("Free pass claimed.");
      await Promise.all([refetchFreeBalance(), refetchFreeClaimed()]);
    } catch (err: unknown) {
      console.error(err);
      setError(formatWalletError(err));
    }
  };

  const handleApprove = async () => {
    if (!canTransact || !accessPassAddress || !usdcAddress) return;
    setError("");
    setStatus("Submitting USDC approval…");
    try {
      const hash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [accessPassAddress, premiumPrice],
        chainId: base.id,
      });
      setStatus("Waiting for confirmation…");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setStatus("USDC approved.");
      await Promise.all([refetchAllowance(), refetchUsdcBalance()]);
    } catch (err: unknown) {
      console.error(err);
      setError(formatWalletError(err));
    }
  };

  const handleMintPremium = async () => {
    if (!canTransact || !accessPassAddress) return;
    setError("");
    setStatus("Submitting premium mint…");
    try {
      const hash = await writeContractAsync({
        address: accessPassAddress,
        abi: accessPassAbi,
        functionName: "mintPremium",
        args: [1n],
        chainId: base.id,
      });
      setStatus("Waiting for confirmation…");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setStatus("Premium pass minted.");
      await Promise.all([
        refetchPremiumBalance(),
        refetchPremiumPrice(),
        refetchAllowance(),
        refetchUsdcBalance(),
      ]);
    } catch (err: unknown) {
      console.error(err);
      setError(formatWalletError(err));
    }
  };

  const scrollToMint = () => {
    document.getElementById("mint")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToVault = () => {
    document.getElementById("free")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPremium = () => {
    document.getElementById("premium")?.scrollIntoView({ behavior: "smooth" });
  };

  const primaryCta = (() => {
    if (!isConnected) {
      return {
        label: isConnecting ? "Connecting…" : "Connect to Enter",
        disabled: isConnecting || connectors.length === 0,
        onClick: () => handleConnect(),
      };
    }

    if (needsChainSwitch) {
      return {
        label: isSwitching ? "Switching…" : "Switch to Base",
        disabled: isSwitching,
        onClick: () => switchChain({ chainId: base.id }),
      };
    }

    if (!accessPassAddress) {
      return {
        label: "Contract not configured",
        disabled: true,
        onClick: () => undefined,
      };
    }

    if (canClaimFree) {
      return {
        label: isWriting ? "Claiming…" : "Claim Free Pass",
        disabled: isWriting,
        onClick: handleClaimFree,
      };
    }

    if (!hasPremiumPass) {
      if (needsApproval) {
        return {
          label: isWriting
            ? "Approving…"
            : `Approve USDC ($${premiumPriceLabel})`,
          disabled: isWriting || !canTransact,
          onClick: handleApprove,
        };
      }

      return {
        label: isWriting ? "Minting…" : `Mint Premium ($${premiumPriceLabel})`,
        disabled: isWriting || !canTransact,
        onClick: handleMintPremium,
      };
    }

    return {
      label: "Enter the Vault",
      disabled: false,
      onClick: () => (hasPremiumPass ? scrollToPremium() : scrollToVault()),
    };
  })();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_oklch(0.22_0.08_265/0.7),_transparent_55%),_radial-gradient(circle_at_20%_10%,_oklch(0.32_0.18_300/0.35),_transparent_60%),_linear-gradient(160deg,_oklch(0.08_0.02_260),_oklch(0.06_0.02_265))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage:
            "radial-gradient(circle at 25% 20%, rgba(0,0,0,0.95), transparent 65%)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle,_oklch(0.68_0.2_285/0.35)_0%,_transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 translate-x-1/3 rounded-full bg-[radial-gradient(circle,_oklch(0.82_0.18_80/0.32)_0%,_transparent_70%)] blur-3xl" />

      <FloatingNav
        address={address}
        isConnected={isConnected}
        connectors={connectors.map((connector) => ({
          id: connector.id,
          name: connector.name,
        }))}
        isConnecting={isConnecting}
        showConnectors={showConnectors}
        onToggleConnectors={() => setShowConnectors((prev) => !prev)}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        networkLabel={networkLabel}
        networkBadgeClass={networkBadgeClass}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-28 sm:px-6 lg:gap-28 lg:px-8 lg:pt-32">
        <section
          id="mint"
          className="grid items-center gap-12 lg:min-h-[85vh] lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">
              <span className={pillClass}>Base mainnet</span>
              <span className="text-muted-foreground/50">•</span>
              <span className={pillClass}>ERC-1155 access</span>
              <span className="text-muted-foreground/50">•</span>
              <span className={pillClass}>Futurist / Brutalist</span>
              <span
                className={`ml-auto rounded-full border px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] lg:hidden ${networkBadgeClass}`}
              >
                {networkLabel}
              </span>
            </div>
            <h1 className="text-4xl font-serif font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Access the vault where light becomes geometry.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              zklyn is a spatial gallery built for collectors of onchain form. Claim
              a free pass once per wallet, or mint a premium pass in USDC to unlock
              the full vault.
            </p>

            <div className="flex flex-col items-start gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={primaryCta.onClick}
                  disabled={primaryCta.disabled}
                >
                  {primaryCta.label}
                </Button>
                {showVault && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={scrollToVault}
                    disabled={!showVault}
                  >
                    View vault
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {showDetails ? "Hide details" : "View wallet & mint details"}
                </button>
                {(status || error) && (
                  <div className="flex flex-wrap gap-3">
                    {status && (
                      <span className="text-muted-foreground">{status}</span>
                    )}
                    {error && <span className="text-destructive">{error}</span>}
                  </div>
                )}
              </div>

              {isConnected && needsChainSwitch && (
                <p className="text-sm text-muted-foreground">
                  Connected to {networkLabel}. Switch to Base to continue.
                </p>
              )}

              {isConnected && !accessPassAddress && (
                <p className="text-sm text-muted-foreground">
                  Missing <span className="font-semibold">AccessPass</span>{" "}
                  address. Set{" "}
                  <span className="font-semibold">
                    NEXT_PUBLIC_ACCESS_PASS_ADDRESS
                  </span>{" "}
                  and redeploy the site.
                </p>
              )}
            </div>
          </div>

          <div className={`h-[340px] rounded-[28px] p-2 sm:h-[420px] lg:h-[520px] ${panelClass}`}>
            <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,_oklch(0.46_0.2_285/0.25),_transparent_60%)]" />
            <div className="relative h-full w-full overflow-hidden rounded-[24px]">
              <HeroScene reducedMotion={prefersReducedMotion} />
            </div>
          </div>
        </section>

        {showDetails && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className={panelClass}>
              <CardHeader>
                <CardTitle className="text-lg">Mint Flow</CardTitle>
                <CardDescription>
                  Everything happens in your wallet. No backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {steps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-foreground">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-muted-foreground">
                  Premium holders unlock extra scenes, assets, and experimental
                  renders.
                </div>
              </CardContent>
            </Card>

            <Card className={panelClass}>
              <CardHeader>
                <CardTitle className="text-lg">Pass Snapshot</CardTitle>
                <CardDescription>
                  {isOnBase ? "Live reads from Base mainnet." : "Connect on Base to view."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Free pass balance</span>
                  <span className="text-foreground">
                    {isOnBase ? freeBalance.toString() : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Premium pass balance</span>
                  <span className="text-foreground">
                    {isOnBase ? premiumBalance.toString() : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Premium price</span>
                  <span className="text-foreground">${premiumPriceLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>USDC balance</span>
                  <span className="text-foreground">
                    {isOnBase ? usdcBalanceLabel : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Treasury</span>
                  <span className="text-foreground">
                    {shortenAddress(treasuryAddress)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>USDC</span>
                  <span className="text-foreground">
                    {shortenAddress(USDC_ADDRESS)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wallet</span>
                  <span className="text-foreground">
                    {shortenAddress(address)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {showVault && (
          <section id="free" className="grid gap-6 lg:grid-cols-2">
            {PASS_SCENE_DEFINITIONS.map((definition) => {
              const lockedByTier =
                definition.tier === "free" ? !hasFreePass : !hasPremiumPass;
              const locked = !isConnected || needsChainSwitch || lockedByTier;

              const overlay = (() => {
                if (!isConnected) {
                  return {
                    title: "Connect to unlock",
                    description: "Connect a wallet to verify access.",
                    actionLabel: isConnecting ? "Connecting…" : "Connect wallet",
                    onAction: () => handleConnect(),
                    disabled: isConnecting || connectors.length === 0,
                    variant: "outline" as const,
                  };
                }

                if (needsChainSwitch) {
                  return {
                    title: "Switch to Base",
                    description: "Switch networks to continue.",
                    actionLabel: isSwitching ? "Switching…" : "Switch to Base",
                    onAction: () => switchChain({ chainId: base.id }),
                    disabled: isSwitching,
                    variant: "outline" as const,
                  };
                }

                if (definition.tier === "free") {
                  if (freeClaimed && !hasFreePass) {
                    return {
                      title: "Free pass missing",
                      description:
                        "This wallet already claimed a pass, but it isn't held here. Passes are transferable.",
                      actionLabel: "View details",
                      onAction: () => {
                        setShowDetails(true);
                        scrollToMint();
                      },
                      disabled: false,
                      variant: "outline" as const,
                    };
                  }

                  return {
                    title: "Access Restricted",
                    description: "Claim a Free Pass to enter the gallery.",
                    actionLabel: isWriting ? "Claiming…" : "Claim Free Pass",
                    onAction: handleClaimFree,
                    disabled: isWriting || !canClaimFree,
                    variant: "outline" as const,
                  };
                }

                if (needsApproval) {
                  return {
                    title: "Premium Vault",
                    description: "Approve USDC to mint Premium.",
                    actionLabel: isWriting
                      ? "Approving…"
                      : `Approve USDC ($${premiumPriceLabel})`,
                    onAction: handleApprove,
                    disabled: isWriting || !canTransact,
                    variant: "default" as const,
                  };
                }

                const hasEnoughUsdc = usdcBalance >= premiumPrice;

                return {
                  title: "Premium Vault",
                  description: hasEnoughUsdc
                    ? "Mint Premium to unlock."
                    : `Insufficient USDC (need $${premiumPriceLabel}).`,
                  actionLabel: isWriting
                    ? "Minting…"
                    : `Mint Premium ($${premiumPriceLabel})`,
                  onAction: handleMintPremium,
                  disabled: isWriting || !canTransact || !hasEnoughUsdc,
                  variant: "default" as const,
                };
              })();

              return (
                <Card
                  key={definition.id}
                  id={definition.anchorId}
                  className={panelClass}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{definition.title}</CardTitle>
                    <CardDescription>
                      {definition.getDescription({
                        freeBalance,
                        premiumBalance,
                        freeClaimed,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="relative h-60 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                      <PassScene
                        id={definition.id}
                        reducedMotion={prefersReducedMotion}
                      />
                      {locked && (
                        <LockOverlay
                          title={overlay.title}
                          description={overlay.description}
                          actionLabel={overlay.actionLabel}
                          onAction={overlay.onAction}
                          disabled={overlay.disabled}
                          variant={overlay.variant}
                        />
                      )}
                    </div>
                    <div
                      className={`flex flex-wrap gap-2 text-xs ${locked ? "opacity-60" : ""}`}
                    >
                      {definition.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
