import { type IHooksInfo, useIFrameContext } from "@bleu/cow-hooks-ui";
import {
  TRANSACTION_TYPES,
  TransactionFactory,
} from "@bleu/utils/transactionFactory";
import { useCallback } from "react";
import { type Address, parseUnits } from "viem";
import type { DepositParams } from "#/utils/types";
import { getAcrossQuote, getOutputToken } from "../utils/across";
import { chainIdMap } from "../utils/chainMapping";
import type { GetHooksTransactionsParams } from "./useGetHooksTransactions";

export const useGetHooksInfoBridgeUserAmount = () => {
  const { context, cowShedProxy } = useIFrameContext();

  return useCallback(
    async (
      params: GetHooksTransactionsParams,
    ): Promise<IHooksInfo | undefined> => {
      const {
        token,
        spokePoolAddress,
        formData: { destinationChain, amount, recipient },
      } = params;

      if (!context?.account || !cowShedProxy || !amount) return;

      const amountWei = parseUnits(
        amount.toFixed(token.decimals),
        token.decimals,
      );
      const tokenAddress = token.address as Address;
      const tokenSymbol = token.symbol ?? "";
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
        amountWei,
        recipient as Address,
      );

      if (!quote) return;

      const fee = BigInt(quote.totalRelayFee.total);
      const outputAmount = amountWei - fee;

      const depositParams: DepositParams = {
        depositor: context.account,
        recipient: recipient as Address,
        inputToken: tokenAddress,
        outputToken: outputToken as Address,
        inputAmount: amountWei,
        outputAmount,
        destinationChainId: destinationChainId.chainId,
        exclusiveRelayer: quote.exclusiveRelayer,
        quoteTimestamp: BigInt(quote.timestamp),
        exclusivityDeadline: quote.exclusivityDeadline,
        message: "0x",
        fillDeadline: quote.fillDeadline,
      };

      const txs = await Promise.all([
        // Transfer to proxy
        TransactionFactory.createRawTx(TRANSACTION_TYPES.ERC20_TRANSFER_FROM, {
          type: TRANSACTION_TYPES.ERC20_TRANSFER_FROM,
          token: tokenAddress,
          from: context?.account,
          to: cowShedProxy,
          amount: amountWei,
          symbol: tokenSymbol,
        }),
        // Proxy approves Across Spoke Pool
        TransactionFactory.createRawTx(TRANSACTION_TYPES.ERC20_APPROVE, {
          type: TRANSACTION_TYPES.ERC20_APPROVE,
          token: tokenAddress,
          spender: spokePoolAddress,
          amount: amountWei,
        }),
        // Create Across Deposit
        TransactionFactory.createRawTx(TRANSACTION_TYPES.ACROSS_DEPOSIT, {
          type: TRANSACTION_TYPES.ACROSS_DEPOSIT,
          acrossSpokePoolAddress: spokePoolAddress,
          depositor: context.account,
          recipient: recipient as Address,
          inputToken: depositParams.inputToken,
          outputToken: depositParams.outputToken,
          inputAmount: depositParams.inputAmount,
          outputAmount: depositParams.outputAmount,
          destinationChainId: BigInt(destinationChainId.chainId),
          exclusiveRelayer: depositParams.exclusiveRelayer,
          quoteTimestamp: BigInt(depositParams.quoteTimestamp),
          fillDeadline: depositParams.fillDeadline,
          exclusivityDeadlineOffset: BigInt(depositParams.exclusivityDeadline),
          message: depositParams.message,
        }),
      ]);

      const permitData = [
        {
          tokenAddress: tokenAddress,
          amount: amountWei,
          tokenSymbol: tokenSymbol,
        },
      ];

      return { txs, permitData };
    },
    [context?.account, context?.chainId, cowShedProxy],
  );
};
