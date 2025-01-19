import { Checkbox } from "@bleu/cow-hooks-ui";
import { useFormContext } from "react-hook-form";

export const BridgeUserInputCheckbox = () => {
  const { setValue } = useFormContext();

  return (
    <Checkbox
      name="bridgeUserInput"
      label="Input bridge amount manually"
      onSelectSideEffect={() => {
        setValue("amount", undefined);
        setValue("bridgeAllFromSwap", false);
      }}
    />
  );
};
