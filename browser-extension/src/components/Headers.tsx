import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { CustomButton, CustomButtonProps } from "./CustomButton";
import { Dispatch, SetStateAction, useState } from "react";
import { SettingsIcon, AddIcon } from "@chakra-ui/icons";

interface IconProps extends CustomButtonProps {
  label: string;
}

const Key = ({ color }: { color: string }) => (
  <Box color={color}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
      />
    </svg>
  </Box>
);

const Upload = ({ color }: { color: string }) => (
  <Box color={color}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  </Box>
);

const Download = ({ color }: { color: string }) => (
  <Box color={color}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  </Box>
);

const Icon = ({ children, label, ...rest }: IconProps) => {
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

export type View =
  | "All Credentials"
  | "Current Page"
  | "New Credential"
  | "Settings"
  | "Sync";

type HeadersProps = {
  setView: Dispatch<SetStateAction<View>>;
  queryOnChainIfNeeded: () => Promise<void>;
};

const Headers = ({ setView, queryOnChainIfNeeded }: HeadersProps) => {
  const [disabled, setDisabled] = useState<boolean>(false);

  return (
    <HStack justifyContent={"space-around"} alignItems={"end"} px={4} mt={4}>
      <Icon
        colorScheme="primary"
        label="Creds"
        onClick={() => setView("All Credentials")}
      >
        <Key color="purple.200" />
        {/* <ViewIcon color="purple.200" boxSize={6} /> */}
      </Icon>

      {/* Sync */}
      <Icon colorScheme="primary" label="Sync" onClick={() => setView("Sync")}>
        <Upload color="purple.200" />
      </Icon>

      {/* Refresh */}
      <Icon
        colorScheme="primary"
        label="Refresh"
        isDisabled={disabled}
        onClick={() => {
          setDisabled(true);
          setTimeout(() => setDisabled(false), 10_000);
          queryOnChainIfNeeded();
        }}
      >
        <Download color="purple.200" />
      </Icon>

      {/* Settings */}
      <Icon
        colorScheme="primary"
        label="Settings"
        onClick={() => setView("Settings")}
      >
        <SettingsIcon color="purple.200" boxSize={6} />
      </Icon>

      {/* New Credential */}
      <Icon
        colorScheme="primary"
        label="Add Cred"
        onClick={() => setView("New Credential")}
      >
        <AddIcon color="purple.200" boxSize={5} />
      </Icon>
    </HStack>
  );
};
export { Headers };
