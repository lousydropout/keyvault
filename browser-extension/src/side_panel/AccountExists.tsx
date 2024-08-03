import { Box, Heading, Text } from "@chakra-ui/react";
import { Dispatch, useEffect, useState } from "react";
import { CustomButton } from "../components/CustomButton";
import { CustomTextArea } from "../components/CustomTextArea";
import { hash, importCryptoKey } from "../utils/encryption";
import { queryData } from "../utils/smartContractQuery";
import { State } from "./stateMachine";
import { Context } from "../hooks/useFiniteStateMachine";
import { URL } from "./url";
import { getHostname } from "../utils/getHostname";

export type AccountExistsProps = {
  setJwk: Dispatch<React.SetStateAction<JsonWebKey | null>>;
  contextState: Context<State>;
  setState: (action: string, data: Record<string, any>) => void;
  generateKey: () => Promise<void>;
  currentUrl: string | null;
};

export const AccountExists = ({
  setJwk,
  contextState,
  generateKey,
  setState,
  currentUrl,
}: AccountExistsProps) => {
  const [importOrReset, setImportOrReset] = useState<
    "IMPORT" | "RESET" | undefined
  >();
  const [encKey, setEncKey] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    generateKey();
  }, []);

  return (
    <Box px={4} py={12} display={"flex"} flexDir={"column"} gap={4}>
      <Box textAlign={"left"} mb={2}>
        <Heading as={"h1"} display={"inline"}>
          Registered account found for address:
        </Heading>
        <Text as={"h3"} fontSize={"lg"} display={"inline"} ml={2}>
          {contextState?.context.truncatedAddress || ""}
        </Text>
      </Box>

      <Text as={"h3"} mb={8} fontSize="xl">
        To continue, you can either import your encryption key or reset your
        account using a new encryption key:
      </Text>
      {(importOrReset === undefined || importOrReset === "RESET") && (
        <>
          <CustomButton
            colorScheme="primary"
            onClick={() => {
              setImportOrReset("IMPORT");
              setState("IMPORT_ACCOUNT", {});
            }}
          >
            Import my encryption key
          </CustomButton>
          <CustomButton
            colorScheme="secondary"
            onClick={async () => {
              if (currentUrl !== getHostname(URL)) {
                await chrome.tabs.create({ url: URL });
              } else {
                setImportOrReset("RESET");
                // await generateKey();
                setState("ACCOUNT_RESET_REQUESTED", {
                  encryptionKeyHash: contextState?.context.encryptionKeyHash,
                });
              }
            }}
          >
            Reset my account
          </CustomButton>
          <CustomButton
            colorScheme="warning"
            onClick={() => setState("DISCONNECT_WALLET", {})}
          >
            Cancel
          </CustomButton>
        </>
      )}
      {importOrReset === "IMPORT" && (
        <>
          <CustomTextArea
            value={encKey}
            onChange={(e) => setEncKey(e.target.value)}
          />
          <Text
            fontSize={"large"}
            display={errorMsg === undefined ? "none" : "inline"}
            color="tomato"
          >
            Errors: {errorMsg}
          </Text>
          <CustomButton
            colorScheme="primary"
            isDisabled={importing}
            onClick={async () => {
              let _jwk;
              try {
                setImporting(true);
                _jwk = JSON.parse(encKey);
                await importCryptoKey(_jwk);
                const jwkString = JSON.stringify(
                  _jwk,
                  Object.keys(_jwk).sort()
                );
                const jwkStringHash = await hash(jwkString);
                const accountId = contextState?.context?.walletAddress;
                const encryptionKeyHash = await queryData(
                  "get-encryption-key-hash",
                  { accountId }
                );

                if (encryptionKeyHash && jwkStringHash !== encryptionKeyHash) {
                  // setErrorMsg(
                  //   `The hash of the JWK you inputted (${jwkStringHash}) does not match the hash on record (${encryptionKeyHash}).`
                  // );
                  throw new Error(
                    `The hash of the JWK you inputted (${jwkStringHash}) does not match the hash on record (${encryptionKeyHash}).`
                  );
                }

                setJwk(_jwk);
                setState("ACCOUNT_IMPORT_SUCCESS", { encryptionKeyHash });
              } catch (e: Error | any) {
                // if (errorMsg === undefined)
                setErrorMsg(e.message);
                setImporting(false);
              }
            }}
          >
            Import encryption key
          </CustomButton>
          <CustomButton
            colorScheme="warning"
            onClick={() => setState("DISCONNECT_WALLET", {})}
          >
            Cancel
          </CustomButton>
        </>
      )}
    </Box>
  );
};
