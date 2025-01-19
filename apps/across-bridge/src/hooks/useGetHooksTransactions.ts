import type { IHooksInfo } from "@bleu/cow-hooks-ui";
import type { Token } from "@uniswap/sdk-core";
import type { Address } from "viem";
import type { createAcrossDepositSchema } from "#/utils/schema";
import { useGetHooksInfoBridgeAllFromSwap } from "./useGetHooksInfoBridgeAllFromSwap";
import { useGetHooksInfoBridgeUserAmount } from "./useGetHooksInfoBridgeUserAmount";

export interface GetHooksTransactionsParams {
  chainId: number;
  token: Token;
  spokePoolAddress: Address;
  mathContractAddress: Address;
  formData: typeof createAcrossDepositSchema._type;
}

export function useGetHooksTransactions() {
  const getHooksInfoBridgeAllFromSwap = useGetHooksInfoBridgeAllFromSwap();
  const getHooksInfoBridgeUserAmount = useGetHooksInfoBridgeUserAmount();

  return async (
    params: GetHooksTransactionsParams,
  ): Promise<IHooksInfo | undefined> => {
    const {
      formData: { bridgeAllFromSwap },
    } = params;

    const hooksInfo = bridgeAllFromSwap
      ? await getHooksInfoBridgeAllFromSwap(params)
      : getHooksInfoBridgeUserAmount(params);

    if (!hooksInfo) throw new Error("Error encoding transactions");

    return hooksInfo;
  };
}
