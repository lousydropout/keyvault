import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { formatAddress } from "@/lib/utils";
import { WalletConnector } from "@/WalletConnector";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const allowedWallets = new Set(["io.metamask"]);

export const Connect = () => {
  const account = useAccount();
  const { connectors, connect: walletConnect } = useConnect();
  const { disconnect } = useDisconnect();

  return account?.isConnected ? (
    <Button
      className="border-slate-500"
      onClick={() => {
        disconnect();
      }}
    >
      Hi,{" " + formatAddress(account?.address as string) + "!"}
    </Button>
  ) : (
    <Dialog>
      <DialogTrigger
        id="connect-wallet-modal"
        // className="border border-slate-500 px-4 py-2 rounded-lg"
      >
        <Button className="border-slate-500">Connect</Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg">
        <ErrorBoundary>
          <DialogHeader>
            <DialogTitle className="text-center">Connect</DialogTitle>
            <DialogDescription className="flex flex-col gap-4 pt-4 w-1/2 mx-auto">
              {connectors
                .filter((connector) => allowedWallets.has(connector.id))
                .map((connector) => (
                  <WalletConnector
                    key={connector.uid}
                    connector={connector}
                    onClick={() => {
                      walletConnect(
                        { connector },
                        {
                          onSettled: () => {
                            document
                              .getElementById("connect-wallet-modal")
                              ?.click();
                          },
                        }
                      );
                    }}
                  />
                ))}
            </DialogDescription>
          </DialogHeader>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};
