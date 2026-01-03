import { CustomSeparator } from "@/components/CustomSeparator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChainSelectionScreen } from "@/components/ChainSelectionScreen";
import { NUM_ENTRIES, PUBKEY } from "@/constants/hookVariables";
import { DASHBOARD } from "@/constants/steps";
import { CHAIN_CONFIGS } from "@/constants/chains";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { useEnabledChains, getChainWithMostEntries } from "@/hooks/useEnabledChains";
import { useChain } from "@/side_panel/chain";
import { logger } from "@/utils/logger";
import { importCryptoKey } from "@/utils/encryption";
import { discoverAccounts, ChainAccountInfo, ChainStatus } from "@/utils/discoverAccounts";
import { download } from "@/utils/utility";
import { useEffect, useRef, useState } from "react";
import { Hex } from "viem";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

type DiscoveryState = "loading" | "complete";
type UserAction = "pending" | "chainSelection" | "import" | "reset";

// Module-level flag to prevent duplicate discovery calls across remounts
let setupDiscoveryInProgress = false;
let setupDiscoveryPubkey: string | null = null;

type EncryptionKeySetupProps = {
  setStep: (step: number) => void;
};
export const EncryptionKeySetup = ({ setStep }: EncryptionKeySetupProps) => {
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [jwk, setJwk, _, generateKeyHandler] = useCryptoKeyManager();
  const [numOnChain, setNumOnChain] = useBrowserStoreLocal<number>(
    NUM_ENTRIES,
    -1
  );
  const { chainId, switchChain } = useChain();
  const { setEnabledChainIds } = useEnabledChains();

  // Multi-chain discovery state
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>("loading");
  const [allChainStatuses, setAllChainStatuses] = useState<ChainStatus[]>([]);
  const [discoveredAccounts, setDiscoveredAccounts] = useState<ChainAccountInfo[]>([]);
  const [userAction, setUserAction] = useState<UserAction>("pending");
  const [selectedChain, setSelectedChain] = useState<ChainAccountInfo | null>(null);

  // Discover accounts across all chains (runs once per pubkey)
  useEffect(() => {
    // Guard: skip if no pubkey, already in progress, or already done for this pubkey
    if (!pubkey || setupDiscoveryInProgress || setupDiscoveryPubkey === pubkey) {
      return;
    }

    setupDiscoveryInProgress = true;
    setupDiscoveryPubkey = pubkey;
    setDiscoveryState("loading");

    discoverAccounts(pubkey as Hex).then((result) => {
      setAllChainStatuses(result.allChains);
      setDiscoveredAccounts(result.accounts);
      setDiscoveryState("complete");
      setupDiscoveryInProgress = false;

      // If single account found, auto-select and auto-enable it
      if (result.accounts.length === 1) {
        const singleAccount = result.accounts[0];
        setSelectedChain(singleAccount);
        setEnabledChainIds([singleAccount.chainId]);
        switchChain(singleAccount.chainId, true);
        setNumOnChain(singleAccount.numEntries);
      }
    }).catch(() => {
      setupDiscoveryInProgress = false;
    });
  }, [pubkey]);

  // Generate key when user chooses reset or no accounts exist
  useEffect(() => {
    if (userAction === "reset" && !jwk) {
      generateKeyHandler();
    }
  }, [userAction]);

  // Generate key when discovery completes with no accounts
  useEffect(() => {
    if (discoveryState === "complete" && discoveredAccounts.length === 0 && !jwk) {
      generateKeyHandler();
    }
  }, [discoveryState, discoveredAccounts]);

  type CreatingOrResetingAccountProps = {
    isNew: boolean;
  };

  const CreatingOrResetingAccount = ({
    isNew,
  }: CreatingOrResetingAccountProps) => {
    return (
      <div className="flex flex-col gap-4 px-2 py-4">
        <h1 className="text-4xl text-center mt-4">
          {isNew ? "No account was detected" : "Account reset"}
        </h1>
        <p className="text-xl mt-4">
          A new encryption key has been generated for you.
        </p>
        <p className="text-xl mt-4">
          Please download a copy of the key and keep it safe.
        </p>
        <Button
          className="border rounded-xl"
          onClick={() => download(jwk ?? {}, "encryption_key.json")}
        >
          Download encryption key
        </Button>

        <p className="text-xl mt-4">When ready, click "Done with setup".</p>
        <Button
          className="border rounded-xl"
          onClick={() => setStep(DASHBOARD)}
        >
          Done with setup
        </Button>
      </div>
    );
  };

  const ExistingAccount = () => {
    const [tmpJwk, setTmpJwk] = useState<JsonWebKey | null>(null);
    const [importAccount, setImportAccount] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(
      null
    );

    logger.debug("ExistingAccount");

    const importJwk = async () => {
      setErrorMessage(null);
      if (!tmpJwk) return;
      try {
        const _ = await importCryptoKey(tmpJwk ?? {});
        // the string was a valid JWK if no error was thrown
        setJwk(tmpJwk);
        setStep(DASHBOARD);
      } catch (e) {
        logger.error("Error importing key: ", e);
        setErrorMessage("Invalid encryption key");
      }
    };

    const handleJWKFileUpload = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) {
        logger.error("No file selected: ", { event });
        return;
      }

      const reader = new FileReader();

      // Read the file content as text
      reader.onload = () => {
        try {
          const _jwk = JSON.parse(reader.result as string) as JsonWebKey;
          setTmpJwk(_jwk);
          setStep(DASHBOARD);
        } catch (e) {
          setFileErrorMessage("Invalid JWK file");
          logger.error("Error parsing file:", e);
        }
      };

      // Start reading the file as text
      reader.readAsText(file);
    };

    const updateTmpJwk = () => {
      const _jwkString = (
        document.getElementById("jwkInput") as HTMLInputElement
      ).value;
      const _jwk = JSON.parse(_jwkString) as JsonWebKey;
      setTmpJwk(_jwk);
    };

    useEffect(() => {
      if (tmpJwk) importJwk();
    }, [tmpJwk]);

    const currentChainName = CHAIN_CONFIGS[chainId]?.name || "Unknown";

    if (importAccount === null) {
      return (
        <div className="flex flex-col gap-4 px-2 py-4">
          <h1 className="text-4xl text-center mt-4">Account found on {currentChainName}</h1>
          <p className="text-xl mt-4">
            Would you like to import your encryption key or reset your account?
          </p>
          <div className="flex gap-4">
            <Button
              className="border rounded-xl"
              onClick={() => setImportAccount(true)}
            >
              Import encryption key
            </Button>
            <Button
              className="border rounded-xl"
              onClick={() => setImportAccount(false)}
            >
              Reset account
            </Button>
          </div>
        </div>
      );
    } else if (importAccount) {
      return (
        <div className="flex flex-col gap-4 px-2 py-4">
          <h1 className="text-4xl text-center mt-4">Import encryption key</h1>
          <p className="text-xl mt-4">
            Please select your encryption key file to import
          </p>
          <Input
            type="file"
            id="jwt-file-selector"
            className="cursor-pointer"
            onChange={handleJWKFileUpload}
          />
          {fileErrorMessage && (
            <p className="text-red-400">{fileErrorMessage}</p>
          )}

          <CustomSeparator text="Alternatively" />

          <p className="text-xl">
            Please paste your encryption key (JWT format) here:
          </p>
          <Textarea id="jwkInput" className="min-h-24" />
          {errorMessage && <p className="text-red-400">{errorMessage}</p>}
          <Button className="border rounded-xl" onClick={updateTmpJwk}>
            Import key
          </Button>
        </div>
      );
    } else if (!importAccount) {
      return <CreatingOrResetingAccount isNew={false} />;
    }
  };

  // Chain status icon component
  const ChainStatusIcon = ({ status }: { status: ChainStatus }) => {
    if (discoveryState === "loading") {
      return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />;
    }
    switch (status.status) {
      case "found":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "not_found":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Chain selection handler for multi-chain scenarios
  const handleSelectChain = (account: ChainAccountInfo) => {
    logger.info(`User selected ${account.chainName} with ${account.numEntries} entries`);
    setSelectedChain(account);
    switchChain(account.chainId, true);
    setNumOnChain(account.numEntries);
  };

  // Handle chain selection completion from ChainSelectionScreen
  const handleChainSelectionComplete = (selectedChainIds: number[]) => {
    // Store enabled chain IDs
    setEnabledChainIds(selectedChainIds);

    // Find the chain with the most entries to use as the primary chain
    const primaryChainId = getChainWithMostEntries(discoveredAccounts);
    const primaryAccount = discoveredAccounts.find(
      (a) => a.chainId === primaryChainId
    );

    if (primaryAccount) {
      setSelectedChain(primaryAccount);
      switchChain(primaryAccount.chainId, true);
      setNumOnChain(primaryAccount.numEntries);
    }

    // Proceed to import screen
    setUserAction("import");
  };

  // Handle import action
  const handleImport = () => {
    if (selectedChain) {
      switchChain(selectedChain.chainId, true);
      setNumOnChain(selectedChain.numEntries);
    }
    setUserAction("import");
  };

  // Handle reset action
  const handleReset = () => {
    setNumOnChain(0);
    setUserAction("reset");
  };

  // If user chose to import, show import UI
  if (userAction === "import") {
    return <ExistingAccount />;
  }

  // If user chose to reset or no accounts found, show new account UI
  if (userAction === "reset" || (discoveryState === "complete" && discoveredAccounts.length === 0)) {
    return <CreatingOrResetingAccount isNew={userAction !== "reset"} />;
  }

  // If multiple chains found and user hasn't selected chains yet, show chain selection screen
  if (userAction === "chainSelection" || (discoveryState === "complete" && discoveredAccounts.length > 1 && userAction === "pending")) {
    return (
      <ChainSelectionScreen
        discoveredChains={discoveredAccounts}
        onContinue={handleChainSelectionComplete}
      />
    );
  }

  // Check if a chain is currently selected
  const isChainSelected = (cId: number) => {
    if (selectedChain) return selectedChain.chainId === cId;
    if (discoveredAccounts.length === 1) return discoveredAccounts[0].chainId === cId;
    return false;
  };

  // Get the active chain (selected or single found)
  const activeChain = selectedChain || (discoveredAccounts.length === 1 ? discoveredAccounts[0] : null);

  // Main discovery view
  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      <h1 className="text-4xl text-center mt-4">
        {discoveryState === "loading" ? "Searching for existing accounts" : "Accounts search"}
      </h1>

      {/* Chain status list */}
      <div className="flex flex-col gap-2 mt-4">
        {discoveryState === "loading" ? (
          // Show placeholder rows while loading
          Object.values(CHAIN_CONFIGS).map((config) => (
            <div
              key={config.chain.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800"
            >
              <span className="text-lg">{config.name}</span>
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ))
        ) : (
          // Show actual results
          allChainStatuses.map((status) => {
            const isFound = status.status === "found";
            const isSelected = isChainSelected(status.chainId);

            return (
              <div
                key={status.chainId}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  isSelected
                    ? "bg-slate-700 border-2 border-green-500"
                    : isFound
                    ? "bg-slate-800 border border-slate-600 cursor-pointer hover:bg-slate-700 hover:border-green-500/50"
                    : "bg-slate-800/50"
                }`}
                onClick={() => {
                  if (isFound) {
                    const account = discoveredAccounts.find(a => a.chainId === status.chainId);
                    if (account) handleSelectChain(account);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <ChainStatusIcon status={status} />
                  <span className={`text-lg ${isFound ? "text-white" : "text-slate-400"}`}>
                    {status.chainName}
                  </span>
                </div>
                {isFound && (
                  <span className="text-sm text-green-400">
                    {status.numEntries} credential{status.numEntries !== 1 ? "s" : ""}
                  </span>
                )}
                {status.status === "error" && (
                  <span className="text-xs text-yellow-400">unavailable</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action buttons - shown after discovery completes */}
      {discoveryState === "complete" && discoveredAccounts.length > 0 && (
        <div className="flex flex-col gap-4 mt-6">
          {activeChain ? (
            <>
              <p className="text-lg text-center text-slate-300">
                Using <span className="text-white font-medium">{activeChain.chainName}</span>
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  className="border rounded-xl"
                  onClick={handleImport}
                >
                  Import encryption key
                </Button>
                <Button
                  className="border rounded-xl"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset account
                </Button>
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-center">
              Select a chain above to continue
            </p>
          )}
        </div>
      )}
    </div>
  );
};
