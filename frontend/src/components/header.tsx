import { Button } from "@/components/ui/button";
import { chain, NETWORK } from "@/config";
import { Connect } from "@/Connect";
import { useAccount, useSwitchChain } from "wagmi";

const Chain = () => {
  const account = useAccount();
  const { switchChain } = useSwitchChain();

  if (!account?.isConnected) {
    return <></>;
  }

  if (chain.id !== account.chainId) {
    return (
      <Button
        className="text-slate-300 hover:text-slate-200"
        onClick={() => switchChain({ chainId: chain.id })}
      >
        Switch network
      </Button>
    );
  }

  return <></>;
};

export const Header = () => {
  return (
    <div className="flex items-end justify-between mt-4">
      <a href="/" className="text-violet-400 font-semibold text-5xl">
        Keyvault {NETWORK === "astar" ? "" : "| localhost"}
      </a>
      <div className="flex gap-2">
        <Chain />
        <Connect />
      </div>
    </div>
  );
};
