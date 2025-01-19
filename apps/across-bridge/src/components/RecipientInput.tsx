import { Input } from "@bleu/cow-hooks-ui";
import { useFormContext } from "react-hook-form";

export const RecipientInput = () => {
  const { setValue } = useFormContext();

  return (
    <Input
      id="recipient"
      name="recipient"
      label="Bridge Recipient"
      placeholder="Address or ENS name"
      autoComplete="off"
      className="h-12 p-2.5 rounded-xl bg-color-paper-darker border-none"
      validation={{
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue("recipient", e.target.value.trim());
        },
      }}
    />
  );
};
