import { CredsIcon } from "@/components/icons/credsIcon";
import { MoreIcon } from "@/components/icons/moreIcon";
import { SettingsIcon } from "@/components/icons/settingsIcon";
import { SyncIcon } from "@/components/icons/syncIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dappUrl } from "@/config";
import { useBrowserStore, useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { useState } from "react";

const isOpen = async (tabId: number) => {
  try {
    await chrome.tabs.get(tabId);
  } catch (_e) {
    return false;
  }
  return true;
};

const openedTabs = async (tabIds: number[]) => {
  const newTabIds = [];
  for (const tabId of tabIds) {
    if (await isOpen(tabId)) newTabIds.push(tabId);
  }
  return newTabIds;
};

export type View =
  | "All Credentials"
  | "Current Page"
  | "New Credential"
  | "Edit Credential"
  | "Generate Keypair"
  | "Encrypt message"
  | "Settings"
  | "Sync";

const Icon = ({
  view,
  children,
  label,
  onClick,
  disableFor = 0,
}: {
  view: View;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disableFor?: number;
}) => {
  const [disabled, setDisabled] = useState<boolean>(false);

  const viewToLabel: Record<View, string> = {
    "Current Page": "Creds",
    "New Credential": "Add Cred",
    Settings: "Settings",
    Sync: "Sync",
    "All Credentials": "Creds",
    "Edit Credential": "Edit Cred",
    "Encrypt message": "Encrypt message",
    "Generate Keypair": "Generate Keypair",
  };
  const isActive = viewToLabel[view] === label;

  const buttonClass =
    "bg-transparent focus:outline-none focus-visible:outline-none w-auto h-auto p-1";
  const iconClass = `flex flex-col items-center text-center text-lg
    ${
      isActive
        ? `text-purple-200`
        : `text-purple-300 hover:text-purple-400 active:text-purple-500 focus:text-purple-500`
    }
    `;
  const disabledIconClass = `
    flex flex-col items-center text-center 
    text-lg text-purple-300 text-opacity-50
    cursor-not-allowed
    `;

  const handleClick = () => {
    if (disableFor > 0) {
      setDisabled(true);
      setTimeout(() => setDisabled(false), disableFor);
    }
    onClick();
  };

  return (
    <button className={buttonClass} onClick={handleClick} disabled={disabled}>
      <div className={disabled ? disabledIconClass : iconClass}>
        {children}
        <p className={isActive ? "underline italic" : ""}>{label}</p>
      </div>
    </button>
  );
};

export const Header = () => {
  const [tabIds, setTabIds] = useBrowserStoreLocal<number[]>("tabIds", []);
  const [view, setView] = useBrowserStore<View>("view", "Current Page");
  const [tab] = useCurrentTab();

  return (
    <div className="flex justify-around items-end px-4 mt-4">
      {/* Dashboard */}
      <Icon view={view} label="Creds" onClick={() => setView("Current Page")}>
        <CredsIcon className="w-6 h-6" />
      </Icon>

      {/* Sync */}
      <Icon
        view={view}
        label="Sync"
        onClick={async () => {
          // don't open a new tab if it's already open
          if (new Set(tabIds).has(tab?.id || -1)) {
            setView("Sync");
            return;
          }

          const newTab = await chrome.tabs.create({
            url: dappUrl,
          });
          if (!newTab) return;

          setTabIds([
            ...(await openedTabs(tabIds)),
            newTab.id ?? chrome.tabs.TAB_ID_NONE,
          ]);

          setView("Sync");
        }}
      >
        <SyncIcon className="w-6 h-6" />
      </Icon>

      {/* Settings */}
      <Icon view={view} label="Settings" onClick={() => setView("Settings")}>
        <SettingsIcon className="w-6 h-6" />
      </Icon>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Icon view={view} label="Actions" onClick={() => {}}>
            <MoreIcon className="w-6 h-6" />
          </Icon>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="flex flex-col gap-4 bg-slate-600 text-white border-slate-500 mr-8 p-4 z-50">
          <DropdownMenuItem
            className="text-lg cursor-pointer p-2"
            onClick={() => setView("New Credential")}
          >
            New Credential
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-lg cursor-pointer p-2"
            onClick={() => setView("Generate Keypair")}
          >
            Generate Keypair
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-lg cursor-pointer p-2"
            onClick={() => setView("Encrypt message")}
          >
            Encrypt / Decrypt
          </DropdownMenuItem>
          {/* <DropdownMenuItem
            className="text-lg cursor-pointer p-2"
            onClick={() => setView("Encrypt message")}
          >
            Generate encryption key shares
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
