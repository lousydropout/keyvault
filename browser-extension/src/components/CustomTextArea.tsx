import { FormControl, FormLabel, Textarea } from "@chakra-ui/react";
import { colors } from "../utils/colors";
import { ChangeEventHandler } from "react";

export type CustomTextAreaProps = {
  isReadOnly?: boolean;
  variant?: "outline" | "unstyled" | "flushed" | "filled";
  placeholder?: string;
  label?: string;
  value?: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

const CustomTextArea: React.FC<CustomTextAreaProps> = ({
  isReadOnly = false,
  variant = "filled",
  value = "",
  label,
  placeholder,
  onChange,
}) => {
  return (
    <FormControl>
      <FormLabel m={2}>{label}</FormLabel>
      <Textarea
        value={value}
        variant={variant}
        bgColor="transparent"
        _hover={{ bgColor: "transparent" }}
        _active={{ bgColor: "transparent" }}
        ringColor={colors.secondary.bg}
        borderColor={colors.secondary.bg}
        focusBorderColor={colors.primary.bg}
        cursor={isReadOnly ? "not-allowed" : "auto"}
        opacity={isReadOnly ? 0.72 : 1}
        pl={2}
        onChange={onChange}
        placeholder={placeholder}
      />
    </FormControl>
  );
};

export { CustomTextArea };
