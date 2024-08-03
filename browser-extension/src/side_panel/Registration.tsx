import { Box, Heading } from "@chakra-ui/react";
import { CustomButton } from "../components/CustomButton";
import { URL } from "./url";

export const Registration = () => (
  <Box px={4} py={12} display={"flex"} flexDir={"column"} gap={4}>
    <Heading textAlign={"center"} as={"h1"} mb={12}>
      Welcome to KeyVault!
    </Heading>
    <Heading as={"h3"} mb={8}>
      Let's register your address. Please follow the instructions on the dApp.
      If you happen to have closed the tab, you can reopen it by clicking on the
      button below.
    </Heading>
    <CustomButton
      colorScheme="secondary"
      onClick={async () => await chrome.tabs.create({ url: URL })}
    >
      Open
    </CustomButton>
  </Box>
);
