import { View } from "@/components/header";
import { CopyIcon } from "@/components/icons/copy";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { useChromeStore, useChromeStoreLocal } from "@/hooks/useChromeStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import {
  basePasswordCred,
  deletePasswordCred,
  type PasswordAdditionCred,
} from "@/utils/credentials";
import { encrypt, Encrypted } from "@/utils/encryption";
import { useState } from "react";

const defaultPassword = "********";

const CardRow = ({
  value,
  isSecret = false,
}: {
  value: string;
  isSecret?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };
  return (
    <div className="relative flex justify-end gap-2 items-center text-purple-200 text-opacity-100 text-lg">
      <span>{isSecret ? defaultPassword : value}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="hover:text-purple-400 active:text-purple-500 focus:outline-none"
      >
        <CopyIcon className="w-6 h-6" />
      </button>
      {showTooltip && (
        <div className="absolute -top-8 -right-12 bg-purple-500 text-white p-2 rounded-md text-sm">
          Copied!
        </div>
      )}
    </div>
  );
};

const Left = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className={className}
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M15.75 19.5 8.25 12l7.5-7.5"
    />
  </svg>
);

const CredentialCard = ({
  cred,
  tab,
}: {
  cred: PasswordAdditionCred;
  tab: chrome.tabs.Tab | undefined;
}) => {
  const [_view, setView] = useChromeStore<View>("view", "Current Page");
  const [_credToBeEdited, setCredToBeEdited] =
    useChromeStore<PasswordAdditionCred>("credToBeEdited", basePasswordCred);
  const [encrypteds, setEncrypteds] = useChromeStoreLocal<Encrypted[]>(
    "encrypteds",
    []
  );
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [_modifiedEncrypteds, setModifiedEncrypteds] =
    useChromeStoreLocal<boolean>("modifiedEncrypteds", false);

  const getNonces = () => encrypteds.map(({ iv }: Encrypted) => iv);

  return (
    <div className="flex w-full sm:w-96 mx-auto gap-2 items-center justify-end">
      <Card className="flex w-fit p-0 py-4 bg-transparent border-opacity-10 text-purple-200">
        <CardHeader className="my-0 py-0 w-full flex">
          <CardDescription className={`grid grid-cols-9 gap-4 items-center`}>
            <div
              className="self-end col-span-3 cursor-pointer"
              onClick={() => {
                chrome.tabs.sendMessage(tab?.id || chrome.tabs.TAB_ID_NONE, {
                  type: "FROM_EXTENSION",
                  action: "fillCredentials",
                  username: cred.username,
                  password: cred.password,
                });
              }}
            >
              <Left className="w-12 text-purple-400 hover:text-purple-500 active:text-purple-600" />
            </div>
            <div className="col-span-6 flex flex-col gap-4 items-end">
              <CardRow value={cred.username} />
              <CardRow value={cred.password} isSecret />
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="h-full flex flex-col gap-2 justify-start">
        <Button
          variant="link"
          className="text-slate-400 text-md p-0 text-left"
          onClick={() => {
            setCredToBeEdited(cred);
            setView("Edit Credential");
          }}
        >
          EDIT
        </Button>
        <Button
          variant="link"
          className="text-red-500 text-md px-2 text-left"
          onClick={async () => {
            const deletedCred = deletePasswordCred(cred, encrypteds.length);
            // Ensure that the nonce (IV) is unique
            const nonces = getNonces();
            let encrypted: Encrypted;
            while (true) {
              encrypted = await encrypt(cryptoKey as CryptoKey, deletedCred);
              if (!nonces.includes(encrypted.iv)) break;
            }
            setEncrypteds((values) => [...values, encrypted]);
            setModifiedEncrypteds(true);
          }}
        >
          DELETE
        </Button>
      </div>
    </div>
  );
};

export { CredentialCard };
