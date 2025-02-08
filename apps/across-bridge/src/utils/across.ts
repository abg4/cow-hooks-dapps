import type { Address } from "viem";
import { chainIdMap } from "../utils/chainMapping";
import type { ChainConfig } from "../utils/types";
import type { Route } from "./types";
import axios from "axios";

export async function getAcrossQuote(
  params: Route,
  inputAmount: bigint,
  recipient: Address
) {
  try {
    const url = `https://app.across.to/api/suggested-fees?token=${params.inputToken}&originChainId=${params.originChainId}&destinationChainId=${params.destinationChainId}&amount=${inputAmount}&recipient=${recipient}`;
    return await axios.get(url).then((res) => res.data);
  } catch (error) {
    console.error("Failed to fetch quote:", error);
    return null;
  }
}

export function getOutputToken(
  tokenAddress: Address,
  sourceChainId: number,
  destinationChainId: number,
): Address | undefined {
  // Find the chain configuration for the destination chain
  const destinationChainConfig = Object.values(chainIdMap).find(
    (config) => config.chainId === destinationChainId,
  );
  if (!destinationChainConfig) return;

  // Find the token symbol in the source chain configuration
  const sourceChainConfig = Object.values(chainIdMap).find(
    (config) => config.chainId === sourceChainId,
  );
  if (!sourceChainConfig) return;

  // Find the token symbol by matching the address
  const tokenSymbol = Object.keys(sourceChainConfig).find(
    (key) => sourceChainConfig[key as keyof ChainConfig] === tokenAddress,
  );
  if (!tokenSymbol) return;

  // Use the tokenSymbol to find the outputToken in the destination chain
  return destinationChainConfig[tokenSymbol as keyof ChainConfig] as Address;
}
