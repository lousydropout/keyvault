import { Text, VStack } from "@chakra-ui/react";
import { CustomButton, CustomButtonProps } from "./CustomButton";

interface IconProps extends CustomButtonProps {
  label: string;
}

export const Icon = ({ children, label, ...rest }: IconProps) => {
  return (
    <CustomButton
      backgroundColor="transparent"
      // _hover={{ backgroundColor: "transparent" }}
      _focus={{ outline: "none" }}
      _focusVisible={{
        outline: "none",
        backgroundColor: "purple.600",
      }}
      width={"fit-content"}
      height={"fit-content"}
      p={1}
      {...rest}
    >
      <VStack>
        {children}

        <Text textAlign={"center"} fontSize={"large"} color={"purple.200"}>
          {label}
        </Text>
      </VStack>
    </CustomButton>
  );
};
