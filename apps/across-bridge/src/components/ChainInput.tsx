import { DestinationChainSelector } from "../components/DestinationChainSelector";

import { useIFrameContext } from "@bleu/cow-hooks-ui";
import { useTokenContext } from "#/context/token";
import { chainIdMap } from "#/utils/chainMapping";
import { getChainNameById } from "#/utils/chainMapping";

export const ChainInput = () => {
  const { context } = useIFrameContext();
  const { token } = useTokenContext();
  const currentChainName = getChainNameById(Number(context?.chainId));

  // Create chainOptions by filtering out the current chain
  // Need to filter out chains that don't support the token
  const chainOptions = Object.entries(chainIdMap)
    .filter(([chainName, chainConfig]) => {
      if (chainName === currentChainName) return false;
      const tokenSymbol = token?.symbol?.toLowerCase();
      if (!tokenSymbol) return false;
      return chainConfig[tokenSymbol as keyof typeof chainConfig] !== undefined;
    })
    .map(([chainName]) => chainName);

  return (
    <DestinationChainSelector
      chainOptions={chainOptions}
      namePeriodValue="destinationChain"
      namePeriodScale="destinationChain"
      type="string"
      label="Destination Chain"
      validation={{ required: true }}
      onKeyDown={(e) =>
        ["e", "E", "+", "-", ".", ","].includes(e.key) && e.preventDefault()
      }
    />
  );
};
