import { useChain } from "@/side_panel/chain";
import { CHAIN_CONFIGS } from "@/constants/chains";
import { useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { hardhat } from "viem/chains";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const ChainSelector = () => {
  const { chainId, switchChain, supportedChains, hasUnsavedData } = useChain();
  const [devMode] = useBrowserStoreLocal<boolean>("devMode", false);
  const currentChain = CHAIN_CONFIGS[chainId];
  const [pendingChainId, setPendingChainId] = useState<number | null>(null);

  // Show localhost only if:
  // 1. Developer mode is enabled in settings, OR
  // 2. Currently connected to localhost (don't hide current chain)
  const availableChains = supportedChains.filter((id) => {
    if (id === hardhat.id) {
      return devMode || chainId === hardhat.id;
    }
    return true;
  });

  const handleChainChange = (value: string) => {
    const newChainId = Number(value);
    const result = switchChain(newChainId);

    if (!result.switched && result.reason === "unsaved_data") {
      // Show confirmation dialog
      setPendingChainId(newChainId);
    }
  };

  const confirmSwitch = () => {
    if (pendingChainId !== null) {
      switchChain(pendingChainId, true); // Force switch
      setPendingChainId(null);
    }
  };

  return (
    <>
      <Select
        value={chainId.toString()}
        onValueChange={handleChainChange}
      >
        <SelectTrigger className="w-24 h-8 bg-slate-700 border-slate-600 text-white text-sm">
          <SelectValue>{currentChain?.name || "Select Chain"}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {availableChains.map((id) => (
            <SelectItem
              key={id}
              value={id.toString()}
              className="text-white hover:bg-slate-600 cursor-pointer"
            >
              {CHAIN_CONFIGS[id].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={pendingChainId !== null} onOpenChange={() => setPendingChainId(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Switch Chain?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              You have unsaved credentials. Switching chains will clear your current data.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSwitch}
              className="bg-red-600 hover:bg-red-700"
            >
              Switch Chain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
