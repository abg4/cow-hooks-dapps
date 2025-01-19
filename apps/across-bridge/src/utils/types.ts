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
