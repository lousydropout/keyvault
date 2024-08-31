import { Button } from "@/components/ui/button";
import { abi, address, client } from "@/config";
import { useMessage } from "@/hooks/useMessage";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";

export default function App() {
  const message = useMessage();
  const account = useAccount();
  const chainId = useChainId();
  const [isOkay, setIsOkay] = useState<boolean>(false);
  const [offChainCiphertexts, setOffChainCiphertexts] = useState<string[]>([]);
  const { writeContract, isPending, error } = useWriteContract();

  const submit = async (ciphertext: string) => {
    if (!account?.address) return;
    writeContract({
      abi,
      address,
      functionName: "storeEntry",
      args: [ciphertext],
      nonce: await client?.getTransactionCount({ address: account?.address }),
    });
  };

  // useEffect(() => {
  //   if (isSuccess) {
  //     setOffChainCiphertexts((prev) => prev.slice(1));
  //   }
  // }, [isSuccess]);

  useEffect(() => console.log("error: ", error), [error]);

  useEffect(() => {
    if (account) console.log({ account });
    if (account && message) {
      setIsOkay(
        account?.address === message?.address && chainId === message?.chainId
      );
    }
  }, [message, account]);

  useEffect(() => {
    if (!isOkay) return;

    const encrypteds = message?.encrypteds;
    const offChainEncrypteds = encrypteds?.filter((e) => !e.onChain);

    if (!offChainEncrypteds) return;

    const offChainData = offChainEncrypteds?.map(
      (encrypted) => encrypted.iv + encrypted.ciphertext
    );
    setOffChainCiphertexts(offChainData);
  }, [isOkay]);

  useEffect(() => {
    if (!offChainCiphertexts) return;
  }, [offChainCiphertexts]);

  return (
    <div className="flex flex-1 flex-col items-center mt-16 gap-16">
      <h1 className="text-slate-200 text-center text-4xl">
        Let's update your on-chain data!
      </h1>
      {message ? (
        <>
          <p className="text-slate-300 text-lg text-left">Received data</p>

          {isOkay ? (
            <>
              <p className="text-slate-300 text-lg text-left">
                Looks like you have {offChainCiphertexts.length} update
                {offChainCiphertexts.length == 1 ? "" : "s"} to push on-chain.
                Let's handle them one by one.
              </p>
              <Button
                variant="outline"
                disabled={isPending || offChainCiphertexts.length === 0}
                onClick={async () => {
                  console.log("submitting: ", offChainCiphertexts[0]);
                  console.log("submitting to: ", address);
                  await submit(offChainCiphertexts[0]);
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
      ) : (
        <p className="text-slate-300 text-lg text-left">
          Waiting for data. . .
        </p>
      )}

      {/* <pre className="text-slate-200 text-lg">
        {JSON.stringify(message, null, 2)}
      </pre> */}
    </div>
  );
}
