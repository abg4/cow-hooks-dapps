"use client";

import { Spinner, useIFrameContext } from "@bleu/cow-hooks-ui";
import { useCallback, useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { COW_NATIVE_TOKEN_ADDRESS } from "@bleu/utils";
import { ALL_SUPPORTED_CHAIN_IDS } from "@cowprotocol/cow-sdk";
import { AmountInput } from "#/components/AmountInput";
import { BridgeAllFromSwapCheckbox } from "#/components/BridgeAllFromSwapCheckbox";
import { BridgeUserInputCheckbox } from "#/components/BridgeUserInputCheckbox";
import { Button } from "#/components/Button";
import { ChainInput } from "#/components/ChainInput";
import { RecipientInput } from "#/components/RecipientInput";
import { useTokenContext } from "#/context/token";
import { useFormatVariables } from "#/hooks/useFormatVariables";
import { getChainNameById } from "#/utils/chainMapping";
import { chainIdMap } from "#/utils/chainMapping";
import { decodeCalldata } from "#/utils/decodeCalldata";
import type { CreateAcrossFormData } from "#/utils/schema";

export default function Page() {
  const { context, publicClient } = useIFrameContext();
  const [isEditHookLoading, setIsEditHookLoading] = useState(true);
  const { token } = useTokenContext();
  const { control, setValue } = useFormContext<CreateAcrossFormData>();
  const { isSubmitting, isSubmitSuccessful } = useFormState({ control });

  const bridgeUserInput = useWatch({ control, name: "bridgeUserInput" });
  const bridgeAllFromSwap = useWatch({ control, name: "bridgeAllFromSwap" });
  const amount = useWatch({ control, name: "amount" });
  const recipient = useWatch({ control, name: "recipient" });
  const destinationChain = useWatch({ control, name: "destinationChain" });

  const {
    userBalanceFloat,
    swapAmountFloat,
    allAfterSwapFloat,
    formattedUserBalance,
    formattedSwapAmount,
    formattedAllAfterSwap,
  } = useFormatVariables({
    userBalance: token?.userBalance,
    tokenDecimals: token?.decimals,
  });

  const loadHookInfo = useCallback(async () => {
    if (
      !context?.hookToEdit ||
      !context.account ||
      !publicClient ||
      !token?.decimals ||
      !isEditHookLoading
    )
      return;
    try {
      const data = await decodeCalldata(
        context?.hookToEdit?.hook.callData as `0x${string}`,
        token.decimals,
      );
      if (data) {
        setValue("bridgeUserInput", data.bridgeUserInput);
        setValue("bridgeAllFromSwap", data.bridgeAllFromSwap);
        setValue("recipient", data.recipient);
        setValue("destinationChain", data.destinationChain);
        setValue("amount", data.amount);
        setIsEditHookLoading(false);
      }
    } catch {}
  }, [
    context?.hookToEdit,
    context?.account,
    publicClient,
    token?.decimals,
    setValue,
    isEditHookLoading,
  ]);

  if (!context || (context?.hookToEdit && isEditHookLoading)) {
    if (context?.hookToEdit && isEditHookLoading) loadHookInfo();
    return (
      <div className="flex items-center justify-center w-full h-full bg-transparent text-color-text-paper">
        <Spinner
          size="lg"
          style={{
            width: "25px",
            height: "25px",
            color: "gray",
            animation: "spin 2s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!context.account)
    return (
      <span className="block w-full mt-10 text-center">
        Connect your wallet first
      </span>
    );

  // TODO: remove when weiroll contract is deployed to Base.
  if (context.chainId === 8453) {
    return (
      <span className="block w-full mt-10 text-center">
        Across transactions are supported on Arbitrum and Base.
      </span>
    );
  }

  if (!context?.orderParams?.sellAmount || !context?.orderParams?.buyAmount)
    return (
      <span className="block w-full mt-10 text-center">
        Please specify your swap order first
      </span>
    );

  if (!ALL_SUPPORTED_CHAIN_IDS.includes(context.chainId)) {
    return (
      <span className="block w-full mt-10 text-center">Unsupported chain</span>
    );
  }

  if (token) {
    const currentChainName = getChainNameById(Number(context.chainId));
    const availableChains = Object.entries(chainIdMap).filter(
      ([chainName, chainConfig]) => {
        if (chainName === currentChainName) return false;
        const tokenSymbol = token?.symbol?.toLowerCase();
        if (!tokenSymbol) return false;
        return !!chainConfig[tokenSymbol as keyof typeof chainConfig];
      },
    );

    if (availableChains.length === 0) {
      return (
        <span className="block w-full mt-10 text-center">
          The {token?.symbol} token is not supported by Across. Select a
          different token.
        </span>
      );
    }
  }

  if (
    context.orderParams.buyTokenAddress.toLowerCase() ===
    COW_NATIVE_TOKEN_ADDRESS.toLowerCase()
  ) {
    return (
      <span className="block w-full mt-10 text-center">
        ETH is currently not supported. Please use WETH instead.
      </span>
    );
  }

  const amountPreview = bridgeAllFromSwap
    ? formattedSwapAmount
    : formattedAllAfterSwap;
  const amountPreviewFullDecimals = bridgeAllFromSwap
    ? String(swapAmountFloat)
    : String(allAfterSwapFloat);

  const isOutOfFunds =
    !!bridgeUserInput &&
    !!amount &&
    !!allAfterSwapFloat &&
    amount > allAfterSwapFloat;

  const buttonDisabled =
    isOutOfFunds ||
    !recipient ||
    !destinationChain ||
    (!amount && bridgeUserInput) ||
    isSubmitting ||
    isSubmitSuccessful;

  const isBuildingHook = isSubmitting || isSubmitSuccessful;

  return (
    <div className="flex flex-col flex-wrap w-full flex-grow gap-4">
      <div className="w-full flex flex-col flex-grow gap-4 items-start justify-start text-center">
        <ChainInput />
        <AmountInput
          token={token}
          bridgeAllFromSwap={bridgeAllFromSwap}
          amountPreview={amountPreview}
          amountPreviewFullDecimals={amountPreviewFullDecimals}
          formattedUserBalance={formattedUserBalance}
          userBalanceFloat={userBalanceFloat}
          shouldEnableMaxSelector={
            bridgeUserInput && amount !== userBalanceFloat && !!userBalanceFloat
          }
        />
        <RecipientInput />
        <div className="w-full flex flex-col gap-y-2">
          <BridgeAllFromSwapCheckbox />
          <BridgeUserInputCheckbox />
        </div>
      </div>
      <Button
        context={context}
        isOutOfFunds={isOutOfFunds}
        isBuildingHook={isBuildingHook}
        disabled={buttonDisabled}
        tokenSymbol={token?.symbol}
      />
    </div>
  );
}
