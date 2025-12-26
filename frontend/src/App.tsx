import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastAction } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { abi, address, client } from "@/config";
import { CHAIN_CONFIGS, isValidChainId } from "@/chainConfig";
import { useToast } from "@/hooks/use-toast";
import { useMessage } from "@/hooks/useMessage";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract } from "wagmi";

// Helper to get chain name from chainId
const getChainName = (id: number | undefined) => {
  if (id === undefined) return "Unknown";
  return CHAIN_CONFIGS[id]?.name || `Chain ${id}`;
};

export default function App() {
  const message = useMessage();
  const account = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { toast } = useToast();
  const [isOkay, setIsOkay] = useState<boolean>(false);
  const [ciphertext, setCiphertext] = useState<string>("");
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const [submitted, setSubmitted] = useState<boolean>(false);

  const submit = async (ciphertext: string) => {
    if (!account?.address) return;
    writeContract({
      abi,
      address,
      functionName: "storeEntry",
      args: [ciphertext],
      nonce: await client?.getTransactionCount({ address: account?.address }),
    });
    setSubmitted(true);
  };

  useEffect(() => {
    if (isSuccess) toast({ description: "Success!" });
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: error?.name,
        description: "Would you like to retry?",
        action: (
          <ToastAction altText="Try again" onClick={() => submit(ciphertext)}>
            Resubmit
          </ToastAction>
        ),
      });
      console.log("error: ", error);
    }
  }, [error]);

  useEffect(() => {
    if (account && message) {
      toast({ description: "Received data." });

      setIsOkay(
        account?.address?.toLowerCase() === message?.address?.toLowerCase() && chainId === message?.chainId
      );
    }
  }, [message, account]);

  useEffect(() => {
    if (!isOkay) return;

    const encrypted = message?.encrypted;
    if (!encrypted) return;
    setCiphertext(encrypted.iv + encrypted.ciphertext);
  }, [isOkay]);

  console.log("VITE_NETWORK: ", import.meta.env.VITE_NETWORK);
  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col items-center mt-16 gap-16">
        <h1 className="text-slate-200 text-center text-4xl">
          Let's update your on-chain data!
        </h1>

        {((!submitted && message) || error) && (
          <>
            <p className="text-slate-300 text-lg text-left">Received data</p>

            {isOkay ? (
              <>
                <p className="text-slate-300 text-lg text-left">
                  Looks like you have an update to push on-chain.
                </p>
                <Button
                  variant="outline"
                  disabled={isPending || ciphertext === ""}
                  onClick={async () => {
                    console.log("submitting: ", ciphertext);
                    console.log("submitting to: ", address);
                    await submit(ciphertext);
                  }}
                >
                  Push data
                </Button>
                {error ? <p className="text-red-400">{error.message}</p> : <></>}
              </>
            ) : (
              <p className="text-slate-300 text-lg text-left">
                {account?.address?.toLowerCase() !== message?.address?.toLowerCase() ? (
                  <p className="text-red-300">
                    Error: The data you sent is for a different account:{" "}
                    {message?.address}
                  </p>
                ) : (
                  <></>
                )}
                {chainId !== message?.chainId ? (
                  <div className="text-red-300 flex flex-col gap-4 items-center">
                    <p>
                      Error: Chain mismatch. You're connected to {getChainName(chainId)},
                      but the data is for {getChainName(message?.chainId)}.
                    </p>
                    {message?.chainId && isValidChainId(message.chainId) && (
                      <Button
                        variant="outline"
                        disabled={isSwitching}
                        onClick={() => switchChain({ chainId: message.chainId })}
                      >
                        {isSwitching ? "Switching..." : `Switch to ${getChainName(message.chainId)}`}
                      </Button>
                    )}
                  </div>
                ) : (
                  <></>
                )}
              </p>
            )}
          </>
        )}
        {!submitted && !message && (
          <p className="text-slate-300 text-lg text-left">
            Waiting for data. . .
          </p>
        )}
        {submitted && isSuccess && (
          <p className="text-slate-300 text-lg text-left">
            Submitted, please close this tab.
          </p>
        )}

        {/* <pre className="text-slate-200 text-lg">
          {JSON.stringify(message, null, 2)}
        </pre> */}

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
