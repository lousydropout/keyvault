import { AddCredIcon } from "@/components/icons/addCredIcon";
import { CredsIcon } from "@/components/icons/credsIcon";
import { RefreshIcon } from "@/components/icons/refreshIcon";
import { SettingsIcon } from "@/components/icons/settingsIcon";
import { SyncIcon } from "@/components/icons/syncIcon";
import { Dispatch, SetStateAction, useState } from "react";

export type View =
  | "All Credentials"
  | "Current Page"
  | "New Credential"
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

export const Header = ({
  view,
  setView,
  queryOnChainIfNeeded,
}: HeadersProps) => {
  return (
    <div className="flex justify-around items-end px-4 mt-4">
      {/* Dashboard */}
      <Icon view={view} label="Creds" onClick={() => setView("Current Page")}>
        <CredsIcon className="w-6 h-6" />
      </Icon>

      {/* Sync */}
      <Icon view={view} label="Sync" onClick={() => setView("Sync")}>
        <SyncIcon className="w-6 h-6" />
      </Icon>

      {/* Refresh */}
      <Icon
        view={view}
        label="Refresh"
        onClick={queryOnChainIfNeeded}
        disableFor={10_000}
      >
        <RefreshIcon className="w-6 h-6" />
      </Icon>

      {/* Settings */}
      <Icon view={view} label="Settings" onClick={() => setView("Settings")}>
        <SettingsIcon className="w-6 h-6" />
      </Icon>

      {/* New Credential */}
      <Icon
        view={view}
        label="Add Cred"
        onClick={() => setView("New Credential")}
      >
        <AddCredIcon className="w-6 h-6" />
      </Icon>
    </div>
  );
};
