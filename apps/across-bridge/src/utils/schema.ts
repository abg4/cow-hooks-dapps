import { isAddress } from "viem";
import { z } from "zod";
import { chainIdMap } from "./chainMapping";

export const chainOptions = Object.keys(chainIdMap) as [string, ...string[]];

const isValidRecipient = (recipient: string) => {
  // better ENS validation is performed on form submit
  return isAddress(recipient) || recipient.endsWith(".eth");
};

export const createAcrossDepositSchema = z
  .object({
    recipient: z
      .string()
      .min(1, "Recipient is required")
      .refine(isValidRecipient, "Insert a valid address or ENS name"),
    destinationChain: z.enum(chainOptions),
    amount: z
      .number({ message: "Invalid amount" })
      .gt(0, "Amount must be greater than 0")
      .optional(),
    bridgeAllFromSwap: z.boolean(),
    bridgeUserInput: z.boolean(),
  })
  .refine(
    (schema) => {
      return !(schema.amount === undefined && schema.bridgeUserInput);
    },
    { message: "Amount is required", path: ["amount"] },
  );

export type CreateAcrossFormData = typeof createAcrossDepositSchema._type;
