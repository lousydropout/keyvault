import { AddCredIcon } from "@/components/icons/addCredIcon";
import { CredsIcon } from "@/components/icons/credsIcon";
import { RefreshIcon } from "@/components/icons/refreshIcon";
import { SettingsIcon } from "@/components/icons/settingsIcon";
import { SyncIcon } from "@/components/icons/syncIcon";
import { useChromeStoreLocal } from "@/hooks/useChromeStore";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { Dispatch, SetStateAction, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  };
  const isActive = viewToLabel[view] === label;

  const buttonClass =
    "bg-transparent focus:outline-none focus-visible:outline-none w-auto h-auto p-1";
  const iconClass = `flex flex-col items-center text-center text-lg
    ${
      isActive
        ? `text-purple-200`
        : `text-purple-300 hover:text-purple-400
          active:text-purple-500 focus:text-purple-500`
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

type HeadersProps = {
  view: View;
  setView: Dispatch<SetStateAction<View>>;
  queryOnChainIfNeeded: () => Promise<void>;
};

export const Header = ({ view, setView }: HeadersProps) => {
  const [tabIds, setTabIds] = useChromeStoreLocal<number[]>("tabIds", []);
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
            url: `http://localhost:5173`,
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

      {/* Refresh */}
      {/* <Icon
        view={view}
        label="Refresh"
        onClick={queryOnChainIfNeeded}
        disableFor={10_000}
      >
        <RefreshIcon className="w-6 h-6" />
      </Icon> */}

      {/* Settings */}
      <Icon view={view} label="Settings" onClick={() => setView("Settings")}>
        <SettingsIcon className="w-6 h-6" />
      </Icon>

      {/* New Credential */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Icon view={view} label="Actions" onClick={() => {}}>
            <AddCredIcon className="w-6 h-6" />
          </Icon>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-600 text-white border-slate-500 mr-8">
          <DropdownMenuItem
            className="text-lg"
            onClick={() => setView("New Credential")}
          >
            New Credential
          </DropdownMenuItem>
          <DropdownMenuItem className="text-lg">
            Encrypt / Decrypt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
