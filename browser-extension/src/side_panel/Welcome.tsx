import { Box, Heading } from "@chakra-ui/react";
import { CustomButton } from "../components/CustomButton";
import { URL } from "./url";

export const Welcome = () => (
  <Box px={4} py={12} display={"flex"} flexDir={"column"} gap={4}>
    <Heading as={"h1"} mb={12}>
      Welcome to KeyVault!
    </Heading>
    <Heading as={"h3"} mb={8}>
      To get started with your password manager, please first connect your
      wallet.
    </Heading>
    <CustomButton
      colorScheme="primary"
      onClick={async () => await chrome.tabs.create({ url: URL })}
    >
      Open
    </CustomButton>
  </Box>
);
