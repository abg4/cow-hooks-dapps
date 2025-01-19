import { TokenAmountInput, useIFrameContext } from "@bleu/cow-hooks-ui";
import type { Token } from "@uniswap/sdk-core";

export const AmountInput = ({
  token,
  bridgeAllFromSwap,
  amountPreview,
  amountPreviewFullDecimals,
  formattedUserBalance,
  userBalanceFloat,
  shouldEnableMaxSelector,
}: {
  token: Token | undefined;
  bridgeAllFromSwap: boolean;
  amountPreview: string | undefined;
  amountPreviewFullDecimals: string | undefined;
  formattedUserBalance: string | undefined;
  userBalanceFloat: number | undefined;
  shouldEnableMaxSelector: boolean;
}) => {
  const { context } = useIFrameContext();

  return (
    <TokenAmountInput
      name="amount"
      type="number"
      inputMode="decimal"
      step={`0.${"0".repeat(token?.decimals ? token?.decimals - 1 : 8)}1`}
      max="1000000000000"
      token={token}
      label="Bridge Amount"
      placeholder="0.0"
      autoComplete="off"
      disabled={bridgeAllFromSwap}
      disabledValue={amountPreview}
      disabledValueFullDecimals={amountPreviewFullDecimals}
      userBalance={formattedUserBalance}
      userBalanceFullDecimals={String(userBalanceFloat)}
      shouldEnableMaxSelector={shouldEnableMaxSelector}
      shouldDisplayApprox={
        //@ts-ignore
        context?.orderParams.kind === "sell"
      }
      validation={{
        setValueAs: (v) => (v === "" ? undefined : Number(v)),
        required: !bridgeAllFromSwap,
      }}
      onKeyDown={(e) =>
        ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
      }
    />
  );
};
