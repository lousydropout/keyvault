import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EnabledChainsSection } from "@/components/EnabledChainsSection";
import {
  CREDENTIALS,
  ENCRYPTEDS,
  MODIFIED_ENCRYPTEDS,
  PENDING_CREDS,
  PUBKEY,
} from "@/constants/hookVariables";
import { WELCOME } from "@/constants/steps";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { Cred, PasswordAdditionCred } from "@/utils/credentials";
import {
  credentialsToCSV,
  credentialsToEncryptedCSV,
  decryptAndParseCSV,
  isEncryptedCSV,
  mergeImportedCredentials,
  parseCSV,
} from "@/utils/csv";
import { discoverAccounts, ChainStatus } from "@/utils/discoverAccounts";
import { Encrypted } from "@/utils/encryption";
import { Hex } from "viem";
import { ChangeEvent, useEffect, useRef, useState } from "react";

const downloadJSON = (data: Record<string, any>, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const logOut = async () => {
  await chrome.storage.local.set({
    step: WELCOME.toString(),
    // Reset all the creds-related data
    pubkey: "",
    jwk: null,
    numEntries: "0",
    encrypteds: "[]",
    pendingCreds: "[]",
    keypairs: "[]",
    credsByUrl: "{}",
    tabIds: "[]",
  });
};

type ImportStatus =
  | { type: "idle" }
  | { type: "success"; count: number; skipped: number }
  | { type: "error"; message: string };

export const Settings = () => {
  const [pubkey] = useBrowserStoreLocal<string>(PUBKEY, "");
  const [jwk, , cryptoKey] = useCryptoKeyManager();
  const [encrypteds] = useBrowserStoreLocal<Encrypted[]>(ENCRYPTEDS, []);
  const [creds] = useBrowserStoreLocal<Cred[]>(CREDENTIALS, []);
  const [pendingCreds, setPendingCreds] = useBrowserStoreLocal<Cred[]>(
    PENDING_CREDS,
    []
  );
  const [, setModifiedEncrypteds] = useBrowserStoreLocal<boolean>(
    MODIFIED_ENCRYPTEDS,
    false
  );
  const [devMode, setDevMode] = useBrowserStoreLocal<boolean>("devMode", false);

  const [importStatus, setImportStatus] = useState<ImportStatus>({
    type: "idle",
  });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chain discovery state
  const [chainStatuses, setChainStatuses] = useState<ChainStatus[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Discover chains when pubkey is available
  useEffect(() => {
    if (!pubkey) {
      setChainStatuses([]);
      return;
    }

    const discover = async () => {
      setIsDiscovering(true);
      try {
        const result = await discoverAccounts(pubkey as Hex);
        setChainStatuses(result.allChains);
      } catch {
        setChainStatuses([]);
      } finally {
        setIsDiscovering(false);
      }
    };

    discover();
  }, [pubkey]);

  const handleExportCSV = () => {
    const csv = credentialsToCSV(creds);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `keyvault_credentials_${timestamp}.csv`);
  };

  const handleExportEncryptedCSV = async () => {
    if (!cryptoKey) {
      return;
    }
    const encrypted = await credentialsToEncryptedCSV(cryptoKey, creds);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadJSON(encrypted, `keyvault_encrypted_credentials_${timestamp}.json`);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: "idle" });

    try {
      const content = await file.text();

      let importedCreds: PasswordAdditionCred[];

      if (isEncryptedCSV(content)) {
        if (!cryptoKey) {
          setImportStatus({
            type: "error",
            message: "Encryption key not available. Cannot decrypt file.",
          });
          setIsImporting(false);
          return;
        }

        const result = await decryptAndParseCSV(cryptoKey, content);
        if (!result.success) {
          setImportStatus({ type: "error", message: result.error });
          setIsImporting(false);
          return;
        }
        importedCreds = result.credentials;
      } else {
        const result = parseCSV(content);
        if (!result.success) {
          setImportStatus({ type: "error", message: result.error });
          setIsImporting(false);
          return;
        }
        importedCreds = result.credentials;
      }

      if (importedCreds.length === 0) {
        setImportStatus({
          type: "error",
          message: "No credentials found in the file.",
        });
        setIsImporting(false);
        return;
      }

      const allExisting = [...creds, ...pendingCreds];
      const newCreds = mergeImportedCredentials(allExisting, importedCreds);
      const skippedCount = importedCreds.length - newCreds.length;

      if (newCreds.length === 0) {
        setImportStatus({
          type: "success",
          count: 0,
          skipped: skippedCount,
        });
        setIsImporting(false);
        return;
      }

      setPendingCreds((prev) => [...prev, ...newCreds]);
      setModifiedEncrypteds(true);

      setImportStatus({
        type: "success",
        count: newCreds.length,
        skipped: skippedCount,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import file";
      setImportStatus({ type: "error", message });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4 justify-end">
      <h3 className="mt-8 mb-4 text-center text-lg">
        Wallet address: {pubkey || "N/A"}
      </h3>

      {/* Developer Mode */}
      <div className="flex items-center justify-between py-2 px-4">
        <div>
          <Label htmlFor="dev-mode" className="text-white">
            Developer Mode
          </Label>
          <p className="text-xs text-slate-400 mt-1">
            Enables localhost network for development testing
          </p>
        </div>
        <Switch
          id="dev-mode"
          checked={devMode}
          onCheckedChange={setDevMode}
        />
      </div>

      {/* Enabled Chains */}
      <h3 className="mt-8 mb-4 text-center text-lg">Enabled Chains</h3>
      <p className="text-xs text-slate-400 text-center px-4 mb-2">
        Select which chains to use for syncing your credentials. Only chains
        where you have existing data can be enabled.
      </p>
      <EnabledChainsSection
        chainStatuses={chainStatuses}
        isLoading={isDiscovering}
      />

      {/* encryption key */}
      <h3 className="mt-8 mb-4 text-center text-lg">Encryption key</h3>
      <Button
        variant="secondary"
        onClick={() => downloadJSON(jwk as JsonWebKey, "encryption_key.json")}
      >
        Download encryption key
      </Button>

      {/* credentials - JSON format */}
      <h3 className="mt-8 mb-4 text-center text-lg">Credentials (JSON)</h3>
      <Button
        variant="secondary"
        onClick={() => downloadJSON(encrypteds, "encrypted_credentials.json")}
      >
        Download (encrypted) credentials
      </Button>
      <Button
        variant="secondary"
        onClick={() => downloadJSON(creds, "unencrypted_credentials.json")}
      >
        Download (unencrypted) credentials
      </Button>

      {/* credentials - CSV format */}
      <h3 className="mt-8 mb-4 text-center text-lg">Credentials (CSV)</h3>
      <Button variant="secondary" onClick={handleExportCSV}>
        Export as CSV
      </Button>
      <Button
        variant="secondary"
        onClick={handleExportEncryptedCSV}
        disabled={!cryptoKey}
      >
        Export as Encrypted CSV
      </Button>

      {/* CSV Import */}
      <h3 className="mt-8 mb-4 text-center text-lg">Import Credentials</h3>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select CSV file to import"
      />
      <Button
        variant="secondary"
        onClick={handleImportClick}
        disabled={isImporting}
      >
        {isImporting ? "Importing..." : "Import from CSV"}
      </Button>
      <p className="text-xs text-slate-400 text-center px-4">
        Supports Chrome password manager CSV format and encrypted KeyVault
        exports.
      </p>

      {/* Import status messages */}
      {importStatus.type === "success" && (
        <div className="px-4 py-2 bg-green-900/50 border border-green-700 rounded-md text-center">
          <p className="text-green-300 text-sm">
            {importStatus.count > 0
              ? `Successfully imported ${importStatus.count} credential${importStatus.count !== 1 ? "s" : ""}.`
              : "No new credentials to import."}
            {importStatus.skipped > 0 && (
              <span className="block text-xs text-green-400 mt-1">
                {importStatus.skipped} duplicate
                {importStatus.skipped !== 1 ? "s" : ""} skipped.
              </span>
            )}
          </p>
        </div>
      )}
      {importStatus.type === "error" && (
        <div className="px-4 py-2 bg-red-900/50 border border-red-700 rounded-md text-center">
          <p className="text-red-300 text-sm">{importStatus.message}</p>
        </div>
      )}

      {/* log out */}
      <Button variant="destructive" onClick={logOut} className="mt-4">
        Log out
      </Button>
    </div>
  );
};
