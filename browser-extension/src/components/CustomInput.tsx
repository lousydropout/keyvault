import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  InputProps,
  InputRightElement,
} from "@chakra-ui/react";
import { colors } from "../utils/colors";
import { CopyIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useState } from "react";

export interface CustomInputProps extends InputProps {
  value?: string;
  copyable?: boolean;
  isPassword?: boolean;
  leftText?: string;
  hasLabel?: boolean;
  label?: string;
  isReadOnly?: boolean;
  type?: string;
  variant?: "outline" | "unstyled" | "flushed" | "filled";
  required?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  value = "",
  copyable = false,
  isPassword = false,
  leftText = "",
  isReadOnly = false,
  variant = "filled",
  type = "text",
  hasLabel = true,
  label,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const handleCopyInput = () => {
    navigator.clipboard.writeText(value);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FormControl>
      {hasLabel && <FormLabel m={2}>{label}</FormLabel>}
      <InputGroup>
        {leftText && (
          <InputLeftAddon
            bgColor={colors.secondary._active.bg}
            border={"hidden"}
          >
            {leftText}
          </InputLeftAddon>
        )}
        <Input
          value={value}
          variant={variant}
          type={!isPassword || showPassword ? "text" : "password"}
          bgColor={"transparent"}
          _hover={{ bgColor: "transparent" }}
          _active={{ bgColor: "transparent" }}
          ringColor={colors.secondary.bg}
          borderColor={colors.secondary.bg}
          focusBorderColor={colors.primary.bg}
          cursor={isReadOnly ? "not-allowed" : "auto"}
          opacity={isReadOnly ? 0.72 : 1}
          pl={2}
          {...rest}
        />
        {(copyable || isPassword) && (
          <>
            <InputRightElement
              display={"flex"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
            >
              {isPassword && (
                <Button
                  size="md"
                  backgroundColor={"transparent"}
                  onClick={handleTogglePassword}
                  _hover={{ backgroundColor: "transparent" }}
                  _focus={{ outline: "none" }}
                  _focusVisible={{
                    outline: "none",
                    backgroundColor: "purple.600",
                  }}
                >
                  {showPassword ? (
                    <ViewIcon color={"purple.200"} />
                  ) : (
                    <ViewOffIcon color={"purple.200"} />
                  )}
                </Button>
              )}
              <Button
                size="md"
                backgroundColor={"transparent"}
                onClick={handleCopyInput}
                _hover={{ backgroundColor: "transparent" }}
                _focus={{ outline: "none" }}
                _focusVisible={{
                  outline: "none",
                  backgroundColor: "purple.600",
                }}
              >
                <CopyIcon color={"purple.200"} />
              </Button>
            </InputRightElement>
            {showTooltip && (
              <Box
                position="absolute"
                top="-40%"
                right="0"
                bg="purple.800"
                color="white"
                p={2}
                borderRadius="md"
                fontSize="sm"
              >
                Copied!
              </Box>
            )}
          </>
        )}
      </InputGroup>
    </FormControl>
  );
};

export { CustomInput };
