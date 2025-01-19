import * as weiroll from "@weiroll/weiroll.js";
import { type Address, encodeFunctionData, erc20Abi, zeroAddress } from "viem";
import { Contract } from "ethers";
import { acrossSpokePoolAbi } from "./abis/acrossSpokePoolAbi";
import { mathContractAbi } from "./abis/mathContractAbi";
import type {
  BaseArgs,
  BaseTransaction,
  ITransaction,
  TRANSACTION_TYPES,
} from "./types";
import { CommandFlags, WEIROLL_ADDRESS } from "./weiroll";
import { weirollAbi } from "./abis/weirollAbi";

export interface AcrossDepositArgs extends BaseArgs {
  type: TRANSACTION_TYPES.ACROSS_DEPOSIT;
  acrossSpokePoolAddress: Address;
  depositor: Address;
  recipient: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  outputAmount: bigint;
  destinationChainId: bigint;
  exclusiveRelayer: Address;
  quoteTimestamp: bigint;
  fillDeadline: bigint;
  exclusivityDeadlineOffset: bigint;
  message: `0x${string}`;
}

export class AcrossDepositCreator implements ITransaction<AcrossDepositArgs> {
  async createRawTx(args: AcrossDepositArgs): Promise<BaseTransaction> {
    const depositArgs =
      args.exclusiveRelayer === zeroAddress
        ? {
            abi: acrossSpokePoolAbi,
            functionName: "depositExclusive",
            args: [
              args.depositor,
              args.recipient,
              args.inputToken,
              args.outputToken,
              args.inputAmount,
              args.outputAmount,
              args.destinationChainId,
              args.exclusiveRelayer,
              args.quoteTimestamp,
              args.fillDeadline,
              args.exclusivityDeadlineOffset,
              args.message,
            ],
          }
        : {
            abi: acrossSpokePoolAbi,
            functionName: "depositV3",
            args: [
              args.depositor,
              args.recipient,
              args.inputToken,
              args.outputToken,
              args.inputAmount,
              args.outputAmount,
              args.destinationChainId,
              args.exclusiveRelayer,
              args.quoteTimestamp,
              args.fillDeadline,
              args.exclusivityDeadlineOffset,
              args.message,
            ],
          };

    return {
      to: args.acrossSpokePoolAddress,
      value: BigInt(0),
      callData: encodeFunctionData(depositArgs),
    };
  }
}

export interface CreateAcrossWeirollProxyArgs extends BaseArgs {
  type: TRANSACTION_TYPES.CREATE_ACROSS_WEIROLL_PROXY;
  acrossSpokePoolAddress: Address;
  mathContractAddress: Address;
  cowShedProxy: Address;
  depositor: Address;
  recipient: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  destinationChainId: bigint;
  exclusiveRelayer: Address;
  quoteTimestamp: bigint;
  fillDeadline: bigint;
  exclusivityDeadlineOffset: bigint;
  message: `0x${string}`;
  relayFeePercentage: bigint;
}

export class CreateAcrossWeirollProxyCreator
  implements ITransaction<CreateAcrossWeirollProxyArgs>
{
  async createRawTx(
    args: CreateAcrossWeirollProxyArgs
  ): Promise<BaseTransaction> {
    const planner = new weiroll.Planner();

    const tokenWeirollContract = weiroll.Contract.createContract(
      new Contract(args.inputToken, erc20Abi),
      CommandFlags.STATICCALL
    );

    const acrossSpokePoolContract = weiroll.Contract.createContract(
      new Contract(args.acrossSpokePoolAddress, acrossSpokePoolAbi),
      CommandFlags.CALL
    );

    const mathContract = weiroll.Contract.createContract(
      new Contract(args.mathContractAddress, mathContractAbi),
      CommandFlags.STATICCALL
    );

    const amount = planner.add(
      tokenWeirollContract.balanceOf(args.cowShedProxy)
    );

    const outputAmount = planner.add(
      mathContract.multiplyAndSubtract(amount, BigInt(args.relayFeePercentage))
    );

    planner.add(
      args.exclusiveRelayer === zeroAddress
        ? acrossSpokePoolContract.depositV3(
            args.depositor,
            args.recipient,
            args.inputToken,
            args.outputToken,
            amount,
            outputAmount,
            args.destinationChainId,
            args.exclusiveRelayer,
            args.quoteTimestamp,
            args.fillDeadline,
            args.exclusivityDeadlineOffset,
            args.message
          )
        : acrossSpokePoolContract.depositExclusive(
            args.depositor,
            args.recipient,
            args.inputToken,
            args.outputToken,
            amount,
            outputAmount,
            args.destinationChainId,
            args.exclusiveRelayer,
            args.quoteTimestamp,
            args.fillDeadline,
            args.exclusivityDeadlineOffset,
            args.message
          )
    );

    const { commands, state } = planner.plan();

    return {
      to: WEIROLL_ADDRESS,
      value: BigInt(0),
      callData: encodeFunctionData({
        abi: weirollAbi,
        functionName: "execute",
        args: [commands, state],
      }),
      isDelegateCall: true,
    };
  }
}
