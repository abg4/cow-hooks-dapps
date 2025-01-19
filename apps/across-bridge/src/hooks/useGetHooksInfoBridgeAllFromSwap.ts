import { type IHooksInfo, useIFrameContext } from "@bleu/cow-hooks-ui";
import {
  TRANSACTION_TYPES,
  TransactionFactory,
} from "@bleu/utils/transactionFactory";
import { useCallback } from "react";
import { type Address, maxUint256 } from "viem";
import { getAcrossQuote, getOutputToken } from "../utils/across";
import { chainIdMap } from "../utils/chainMapping";
import type { GetHooksTransactionsParams } from "./useGetHooksTransactions";

export const useGetHooksInfoBridgeAllFromSwap = () => {
  const { context, cowShedProxy } = useIFrameContext();

  return useCallback(
    async (
      params: GetHooksTransactionsParams,
    ): Promise<IHooksInfo | undefined> => {
      const {
        token,
        spokePoolAddress,
        mathContractAddress,
        formData: { destinationChain, recipient },
      } = params;

      if (!context?.account || !context?.orderParams || !cowShedProxy) return;
      const tokenAddress = token.address as Address;
      const destinationChainId = chainIdMap[destinationChain];
      if (!destinationChainId) return;

      const outputToken = getOutputToken(
        tokenAddress,
        token.chainId,
        destinationChainId.chainId,
      );
      if (!outputToken) return;

      const quote = await getAcrossQuote(
        {
          originChainId: context.chainId,
          destinationChainId: destinationChainId.chainId,
          inputToken: tokenAddress,
          outputToken: outputToken as Address,
        },
        BigInt(context?.orderParams.buyAmount),
        recipient as Address,
      );
      const depositParams = quote.deposit;
      const relayFeePercentage = quote.fees.totalRelayFee.pct;

      const txs = await Promise.all([
        // Proxy approves Across Bridge Spoke Pool
        TransactionFactory.createRawTx(TRANSACTION_TYPES.ERC20_APPROVE, {
          type: TRANSACTION_TYPES.ERC20_APPROVE,
          token: tokenAddress,
          spender: spokePoolAddress,
          amount: maxUint256,
        }),
        // Create Across Weiroll Proxy
        TransactionFactory.createRawTx(
          TRANSACTION_TYPES.CREATE_ACROSS_WEIROLL_PROXY,
          {
            type: TRANSACTION_TYPES.CREATE_ACROSS_WEIROLL_PROXY,
            acrossSpokePoolAddress: spokePoolAddress,
            mathContractAddress: mathContractAddress,
            cowShedProxy: cowShedProxy,
            depositor: context.account,
            recipient: recipient as Address,
            inputToken: depositParams.inputToken,
            outputToken: depositParams.outputToken,
            inputAmount: depositParams.inputAmount,
            destinationChainId: BigInt(destinationChainId.chainId),
            exclusiveRelayer: depositParams.exclusiveRelayer,
            quoteTimestamp: BigInt(depositParams.quoteTimestamp),
            fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 7200), // 2 hours from now
            exclusivityDeadlineOffset: BigInt(
              depositParams.exclusivityDeadline,
            ),
            message: depositParams.message,
            relayFeePercentage: relayFeePercentage,
          },
        ),
      ]);

      return { txs, recipientOverride: cowShedProxy };
    },
    [context?.account, context?.chainId, context?.orderParams, cowShedProxy],
  );
};
