import { Box, HStack } from "@chakra-ui/react";
import { CustomInput } from "./CustomInput";
import { Cred } from "../utils/credentials";
import { CustomTextArea } from "./CustomTextArea";
import { useState } from "react";
import { CustomButton } from "./CustomButton";
import { Icon } from "./Icon";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

const CredentialsSlider = ({ chain }: { chain: Cred[]; num: number }) => {
  const [cred, setCred] = useState<Cred>(chain[chain.length - 1]);

  return (
    <Box
      border={"1px"}
      rounded={"md"}
      p={4}
      my={4}
      display={"flex"}
      flexDir={"column"}
      alignItems={"end"}
    >
      <HStack>
        <Icon colorScheme="primary" label="Previous" onClick={() => {}}>
          <ChevronLeftIcon color="purple.200" />
        </Icon>
        <Icon colorScheme="primary" label="Next" onClick={() => {}}>
          <ChevronRightIcon color="purple.200" />
        </Icon>
      </HStack>
      <CustomInput
        label={"username/email"}
        type="text"
        value={cred?.username || ""}
        onChange={(e) => setCred({ ...cred, username: e.target.value })}
      />
      <CustomInput
        label={"password"}
        type="password"
        isPassword={true}
        value={cred?.password || ""}
        onChange={(e) => setCred({ ...cred, password: e.target.value })}
      />

      <CustomTextArea
        value={cred?.description || ""}
        label={"description"}
        onChange={(e) => setCred({ ...cred, description: e.target.value })}
      />

      <Box my={4}></Box>
      <HStack>
        <CustomButton colorScheme={"warning"}>Delete</CustomButton>
        <CustomButton colorScheme={"accent"}>Update</CustomButton>
      </HStack>
    </Box>
  );
};

export { CredentialsSlider };
