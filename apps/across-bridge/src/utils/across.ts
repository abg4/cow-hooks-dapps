import { createAcrossClient } from "@across-protocol/app-sdk";
import type { Address } from "viem";
import { arbitrum, base, mainnet, optimism } from "viem/chains";
import { chainIdMap } from "../utils/chainMapping";
import type { ChainConfig } from "../utils/types";
import type { Route } from "./types";

function createClientAcross() {
  const client = createAcrossClient({
    integratorId: "0x0062", // cowswap identifier
    chains: [mainnet, optimism, arbitrum, base],
  });
  return client;
}

export async function getAcrossQuote(
  params: Route,
  inputAmount: bigint,
  recipient: Address,
) {
  const client = createClientAcross();
  const quote = await client.getQuote({
    route: params,
    inputAmount,
    recipient,
  });
  return quote;
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
