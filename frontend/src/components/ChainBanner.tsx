import { Button } from "@/components/ui/button";
import { useChainId, useSwitchChain } from "wagmi";
import { isValidChainId } from "@/chainConfig";

type ChainBannerProps = {
  expectedChainId: number;
  expectedChainName: string;
};

/**
 * Banner displaying the expected chain and prompting network switch if mismatched.
 * Blocks interactions when wallet is on the wrong chain.
 */
export const ChainBanner = ({
  expectedChainId,
  expectedChainName,
}: ChainBannerProps) => {
  const walletChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectChain = walletChainId === expectedChainId;

  if (isCorrectChain) {
    return (
      <div className="w-full max-w-md mx-auto p-4 bg-green-900/30 border border-green-700 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-green-300 font-medium">
            Connected to {expectedChainName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-yellow-300 font-medium">
            Syncing to: {expectedChainName}
          </span>
        </div>
        <p className="text-yellow-200 text-sm">
          Please switch your wallet to {expectedChainName} to continue.
        </p>
        {isValidChainId(expectedChainId) && (
          <Button
            variant="outline"
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500"
            disabled={isPending}
            onClick={() => switchChain({ chainId: expectedChainId })}
          >
            {isPending ? "Switching..." : `Switch to ${expectedChainName}`}
          </Button>
        )}
      </div>
    </div>
  );
};
