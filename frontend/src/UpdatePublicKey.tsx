import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { abi, address, client } from "@/config";
import { useToast } from "@/hooks/use-toast";
import { usePubkeyMessage } from "@/hooks/usePubkeyMessage";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";

export default function UpdatePublicKey() {
  const message = usePubkeyMessage();
  const account = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const [isOkay, setIsOkay] = useState<boolean>(false);
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const [submitted, setSubmitted] = useState<boolean>(false);

  const submit = async (pubkey: string) => {
    if (!account?.address) return;
    writeContract({
      abi,
      address,
      functionName: "storePubkey",
      args: [pubkey],
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
          <ToastAction
            altText="Try again"
            onClick={() => {
              if (message?.pubkey) submit(message?.pubkey);
            }}
          >
            Resubmit
          </ToastAction>
        ),
      });
      console.log("error: ", error);
    }
  }, [error]);

  useEffect(() => {
    console.log("[UpdatePublicKey] message: ", message, account);
    if (account && message) {
      toast({ description: "Received data." });

      setIsOkay(
        account?.address === message?.address && chainId === message?.chainId
      );
    }
  }, [message, account]);

  return (
    <div className="flex flex-1 flex-col items-center mt-16 gap-16">
      <h1 className="text-slate-200 text-center text-4xl">
        Let's publish your public key for others to see!
      </h1>

      {((!submitted && message) || error) && (
        <>
          <p className="text-slate-300 text-lg text-left">Received data</p>

          {isOkay ? (
            <>
              <Button
                variant="outline"
                disabled={isPending || message?.pubkey === undefined}
                onClick={async () => {
                  console.log("submitting: ", message?.pubkey);
                  console.log("submitting to: ", address);
                  if (message?.pubkey) await submit(message?.pubkey);
                }}
              >
                Push data
              </Button>
              {error ? <p className="text-red-400">{error.message}</p> : <></>}
            </>
          ) : (
            <p className="text-slate-300 text-lg text-left">
              {account?.address !== message?.address ? (
                <p className="text-red-300">
                  Error: The data you sent is for a different account:{" "}
                  {message?.address}
                </p>
              ) : (
                <></>
              )}
              {chainId !== message?.chainId ? (
                <p className="text-red-300">
                  Error: The data you sent is for a different chain:{" "}
                  {message?.chainId}
                </p>
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
  );
}
