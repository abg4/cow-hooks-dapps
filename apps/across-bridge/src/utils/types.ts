import type { Address } from "viem";

export type Route = {
  originChainId: number;
  destinationChainId: number;
  inputToken: `0x${string}`;
  outputToken: `0x${string}`;
};

export interface ChainConfig {
  chainId: number;
  usdc: string;
  weth?: string;
  wbtc?: string;
  dai?: string;
  usdt?: string;
  uma?: string;
}

export interface DepositParams {
  depositor: Address;
  recipient: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  outputAmount: bigint;
  destinationChainId: number;
  exclusiveRelayer: Address;
  quoteTimestamp: bigint;
  fillDeadline: bigint;
  exclusivityDeadline: bigint;
  message: `0x${string}`;
}
