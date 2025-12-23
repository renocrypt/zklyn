import { getAddress, isAddress } from "viem";

const normalizeAddress = (value: string | undefined) => {
  if (!value) return "";
  return isAddress(value) ? getAddress(value) : "";
};

export const USDC_ADDRESS = normalizeAddress(
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
);

export const TREASURY_ADDRESS = normalizeAddress(
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
    "0x73871971f79673b8a57a48fb9e13a4ab7b25222e"
);

export const ACCESS_PASS_ADDRESS = normalizeAddress(
  process.env.NEXT_PUBLIC_ACCESS_PASS_ADDRESS
);

const premiumPriceRaw = (process.env.NEXT_PUBLIC_PREMIUM_PRICE ?? "100000000").trim();
let premiumPriceFallback = 100000000n;
try {
  premiumPriceFallback = BigInt(premiumPriceRaw);
} catch {
  console.warn(
    "Invalid NEXT_PUBLIC_PREMIUM_PRICE (expected an integer string like 100000000). Using fallback."
  );
}
export const PREMIUM_PRICE_FALLBACK = premiumPriceFallback;

export const BASE_CHAIN_ID = 8453;
