import { Button, ButtonProps } from "@chakra-ui/react";
import { colors } from "../utils/colors";

export interface CustomButtonProps extends ButtonProps {
  colorScheme: "primary" | "secondary" | "accent" | "warning";
}

const CustomButton: React.FC<CustomButtonProps> = ({
  colorScheme,
  children,
  ...rest
}) => {
  return (
    <Button {...colors[colorScheme]} {...rest} disabled>
      {children}
    </Button>
  );
};

export { CustomButton };
