import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "./ui/button";

export const Connect = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account && chain;
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
                    onClick={openConnectModal}
                  >
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
                    onClick={openChainModal}
                  >
                    Wrong network
                  </Button>
                );
              }
              return (
                <div className="flex gap-2">
                  <Button
                    className="flex gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60"
                    onClick={openChainModal}
                  >
                    {chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        className="w-4 h-4"
                      />
                    )}
                    {chain.name}
                  </Button>
                  <Button
                    className={`
                      flex items-center justify-center gap-2
                      px-4 py-2
                      bg-slate-600 hover:bg-slate-600 hover:opacity-80 active:opacity-60
                    `}
                    onClick={openAccountModal}
                  >
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
