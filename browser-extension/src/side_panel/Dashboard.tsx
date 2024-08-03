import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Box, HStack, Heading, Switch, Text } from "@chakra-ui/react";
import { NewCredsForm } from "../components/NewCredsForm";
import {
  Cred,
  addEntry,
  deleteEntry,
  getCredsByURL,
  getEntriesByURL,
} from "../utils/credentials";
import { Headers, View } from "../components/Headers";
import { Settings } from "../components/Settings";
import { Encrypted, decrypt } from "../utils/encryption";
import { Sync } from "../components/Sync";
import { Context } from "../hooks/useFiniteStateMachine";
import { State } from "./stateMachine";
import { CredentialCard } from "../components/CredentialCard";
import { URL } from "../side_panel/url";

export type DashboardProps = {
  currentUrl: string;
  queryOnChainIfNeeded: () => Promise<void>;
  creds: Cred[];
  setCreds: Dispatch<SetStateAction<Cred[]>>;
  cryptoKey: CryptoKey;
  encrypted: Encrypted[];
  setEncrypted: Dispatch<SetStateAction<Encrypted[]>>;
  jwk: JsonWebKey;
  contextState: Context<State>;
};

export const Dashboard = ({
  currentUrl,
  queryOnChainIfNeeded,
  creds,
  setCreds,
  cryptoKey,
  encrypted,
  setEncrypted,
  jwk,
  contextState,
}: DashboardProps) => {
  const [view, setView] = useState<View>("All Credentials");

  const credentials = getCredsByURL(creds);

  interface CredentialsProps {
    credentials: { [key: string]: Cred[] };
    onDelete: (index: number) => Promise<void>;
  }

  const CredCardsForUrl = ({ credentials, onDelete }: CredentialsProps) => {
    const sortedKeys = Object.keys(credentials).sort();

    return (
      <Box>
        {sortedKeys.map((url) => {
          const credsByUrl = credentials[url];
          if (sortedKeys.length > 1 && credsByUrl.length === 0) return null;
          return (
            <Box key={url} pt={2}>
              <Heading
                as={"h2"}
                fontSize={"xx-large"}
                fontWeight="bold"
                textAlign={"center"}
                mb={2}
              >
                {url}
              </Heading>

              {credsByUrl.map((cred, index) => {
                // TODO: show deleted creds if user wants to see them
                if (cred.isDeleted) return null;
                return (
                  <CredentialCard
                    cred={cred}
                    key={index}
                    onSave={onSave}
                    onModify={onModify}
                    onDelete={onDelete}
                  />
                );
              })}

              {credsByUrl.length === 0 && (
                <Box border={"1px solid grey"} borderRadius={"lg"} p={4} mt={4}>
                  <Text textAlign={"center"} fontSize={"large"}>
                    No credentials found for this URL
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  const onSave = async (data: Cred) => {
    const result = await addEntry(cryptoKey, creds, data);
    setCreds(result);
  };

  const onModify = async (data: Cred) => {
    const _creds = creds;
    _creds[data.curr as number] = data;
    setCreds(_creds);
  };

  const onDelete = async (index: number) => {
    const result = await deleteEntry(cryptoKey, creds, index);
    setCreds(result);
  };

  const getCiphertexts = async () => {
    if (creds.length > encrypted.length) {
      setEncrypted(creds.map((cred) => cred.ciphertext as Encrypted));
    }
  };

  // get ciphertexts from creds and set them to encrypted
  useEffect(() => {
    getCiphertexts();
  }, [creds]);

  // decrypt all remaining encrypted creds and set them to creds
  useEffect(() => {
    const decryptAll = async (from: number) => {
      const _creds: Cred[] = [];

      // assumption: encrypted.length >= creds.length ==>
      if (encrypted.length > creds.length) {
        for (let i = from; i < encrypted.length; i++) {
          _creds.push({
            ...JSON.parse(await decrypt(cryptoKey as CryptoKey, encrypted[i])),
            ciphertext: encrypted[i],
            onChain: true,
            curr: i,
            next: -1,
          });
        }
        setCreds((prev) => [...prev, ..._creds]);
      }
    };

    if (!cryptoKey || !creds) return;

    decryptAll(creds.length);
  }, [cryptoKey, encrypted, creds]);

  useEffect(() => {
    if (view === "Sync") {
      chrome.tabs.create({ url: `${URL}/sync` });
    }
  }, [view]);

  const toggleCredView = (prev: View) => {
    return prev === "Current Page" ? "All Credentials" : "Current Page";
  };

  return (
    <>
      <Headers setView={setView} queryOnChainIfNeeded={queryOnChainIfNeeded} />
      <Box px={4} py={8} display={"flex"} flexDir={"column"} gap={4}>
        {/* Add form for new passwords */}
        {view === "New Credential" && (
          <NewCredsForm
            onSave={onSave}
            currentUrl={currentUrl}
            toggleShow={() => {
              setView("All Credentials");
            }}
          />
        )}

        {view === "Settings" && (
          <Settings
            creds={creds}
            encrypted={encrypted}
            jwk={jwk}
            contextState={contextState}
          />
        )}

        {view === "Sync" && <Sync />}

        {(view === "Current Page" || view === "All Credentials") && (
          <>
            <Heading
              as={"h1"}
              fontSize={"xxx-large"}
              fontWeight="bold"
              textAlign={"center"}
            >
              Credentials
            </Heading>
            <HStack
              spacing={4}
              justifyContent={"space-between"}
              alignItems={"center"}
              borderBottom="2px solid grey"
              mb={2}
            >
              <Heading
                as={"h2"}
                fontSize={"xx-large"}
                fontWeight="bold"
                textAlign={"center"}
              >
                Show {view === "All Credentials" ? "All" : "Current"}
              </Heading>

              <Switch
                size={"lg"}
                isChecked={view === "All Credentials"}
                onChange={() => setView((prev) => toggleCredView(prev))}
                colorScheme={"purple"}
              />
            </HStack>

            {view === "Current Page" ? (
              <CredCardsForUrl
                credentials={{ [currentUrl]: credentials[currentUrl] ?? [] }}
                onDelete={onDelete}
              />
            ) : (
              <CredCardsForUrl credentials={credentials} onDelete={onDelete} />
            )}
          </>
        )}
      </Box>
    </>
  );
};
