import { cowShedAbi, weirollAbi, acrossSpokePoolAbi } from "@bleu/utils/transactionFactory";
import { type DecodeFunctionDataReturnType, decodeFunctionData } from "viem";
import { getChainNameById } from "./chainMapping";
import type { CreateAcrossFormData } from "./schema";

export const decodeCalldata = async (
  string: `0x${string}`,
  tokenDecimals: number,
): Promise<CreateAcrossFormData> => {
  const decodedFunctionData = decodeFunctionData({
    abi: cowShedAbi,
    data: string,
  });

  if (!decodedFunctionData?.args)
    throw new Error("error decoding cowShed calldata");

  // First scenario: bridgeUserInput -> decode create across contract
  try {
    const result = decodeAcrossFromUserInput(
      decodedFunctionData,
      tokenDecimals,
    );
    return result;
  } catch {}

  // Second scenario: bridgeAllFromSwap -> decode weiroll contract
  try {
    const result = decodeAcrossAllFromSwap(decodedFunctionData);
    return result;
  } catch {}

  throw new Error("Couldn't recover hook params");
};

const decodeAcrossFromUserInput = (
  decodedFunctionData: DecodeFunctionDataReturnType,
  tokenDecimals: number,
) => {
  const result = {} as CreateAcrossFormData;

  const spokePoolDepositData = decodeFunctionData({
    abi: acrossSpokePoolAbi,
    //@ts-ignore
    data: decodedFunctionData.args[0].at(-1).callData as `0x${string}`,
  });

  const args = spokePoolDepositData.args;
  if (!args) throw new Error("decode has no args");

  const destinationChainName = getChainNameById(Number(args[6]));
  if (!destinationChainName) throw new Error("decode has no destination chain");

  result.destinationChain = destinationChainName;
  result.recipient = args[1] as string;
  result.amount = Number(args[4]) / 10 ** tokenDecimals;
  result.bridgeUserInput = true;
  result.bridgeAllFromSwap = false;

  if (!result)
    throw new Error("Could not compute result by decoding create across ABI");
  return result;
};

const decodeAcrossAllFromSwap = (
  decodedFunctionData: DecodeFunctionDataReturnType,
) => {
  const result = {} as CreateAcrossFormData;

  const weirollData = decodeFunctionData({
    abi: weirollAbi,
    //@ts-ignore
    data: decodedFunctionData.args[0].at(-1).callData as `0x${string}`,
  });
  const args = weirollData?.args as [unknown, { [key: number]: string }];
  if (!args) throw new Error("decode has no args");

  //@ts-ignore
  result.recipient = `0x${args[1][2].slice(-40)}` as string;
  const destinationChainName = getChainNameById(
    Number.parseInt(args[1][5], 16),
  );
  if (!destinationChainName) throw new Error("decode has no destination chain");

  result.destinationChain = destinationChainName;
  result.amount = undefined;
  result.bridgeUserInput = false;
  result.bridgeAllFromSwap = true;
  return result;
};
