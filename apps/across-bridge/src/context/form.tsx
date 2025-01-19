"use client";

import { type PropsWithChildren, useCallback, useMemo } from "react";

import { Form } from "@bleu.builders/ui";
import { useIFrameContext } from "@bleu/cow-hooks-ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useGetHooksTransactions } from "#/hooks/useGetHooksTransactions";
import {
  acrossSpokePoolMapping,
  mathContractMapping,
} from "#/utils/acrossSpokePoolMapping";
import {
  type CreateAcrossFormData,
  createAcrossDepositSchema,
} from "#/utils/schema";
import { validateRecipient } from "#/utils/validateRecipient";
import { useTokenContext } from "./token";

export function FormContextProvider({ children }: PropsWithChildren) {
  const { context, setHookInfo } = useIFrameContext();

  const form = useForm<CreateAcrossFormData>({
    resolver: zodResolver(createAcrossDepositSchema),
    defaultValues: {
      destinationChain: "Ethereum",
      bridgeUserInput: false,
      bridgeAllFromSwap: true,
    },
  });

  const { clearErrors, setError } = form;

  const getHooksTransactions = useGetHooksTransactions();

  const router = useRouter();

  const spokePoolAddress = useMemo(() => {
    return context?.chainId
      ? acrossSpokePoolMapping[context.chainId]
      : undefined;
  }, [context?.chainId]);

  const mathContractAddress = useMemo(() => {
    return context?.chainId ? mathContractMapping[context.chainId] : undefined;
  }, [context?.chainId]);

  const { token } = useTokenContext();

  const onSubmitCallback = useCallback(
    async (data: CreateAcrossFormData) => {
      if (
        !context?.account ||
        !token ||
        !spokePoolAddress ||
        !mathContractAddress
      )
        return;

      // Validate ENS name and get address
      clearErrors("recipient");
      let address: string;
      try {
        address = await validateRecipient(data.recipient);
      } catch (error) {
        if (error instanceof Error) {
          setError("recipient", {
            type: "manual",
            message: error.message,
          });
        } else {
          setError("recipient", {
            type: "manual",
            message: "Couldn't verify ENS name",
          });
        }
        return;
      }

      const hookInfo = await getHooksTransactions({
        chainId: context.chainId,
        token,
        spokePoolAddress,
        mathContractAddress,
        formData: { ...data, recipient: address },
      });
      if (!hookInfo) return;

      setHookInfo(hookInfo);
      router.push("/signing");
    },
    [
      context?.account,
      token,
      spokePoolAddress,
      mathContractAddress,
      router.push,
      setHookInfo,
      getHooksTransactions,
      setError,
      clearErrors,
    ],
  );

  const onSubmit = useMemo(
    () => form.handleSubmit(onSubmitCallback),
    [form, onSubmitCallback],
  );

  return (
    <Form className="contents" {...form} onSubmit={onSubmit}>
      {children}
    </Form>
  );
}
