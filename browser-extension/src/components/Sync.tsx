import { Box } from "@chakra-ui/react";
import { CustomButton } from "./CustomButton";
import { URL } from "../side_panel/url";

const Sync = () => {
  return (
    <Box px={4} py={12} display={"flex"} flexDir={"column"} gap={4}>
      <CustomButton
        colorScheme="primary"
        onClick={async () => await chrome.tabs.create({ url: `${URL}/sync` })}
      >
        Sync credentials to blockchain
      </CustomButton>
    </Box>
  );
};

export { Sync };
