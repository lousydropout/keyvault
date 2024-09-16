import { Cred, CredsByUrl } from "@/utils/credentials";
import { CredentialChain } from "@/side_panel/credentialChain";
import { useCurrentTab } from "@/hooks/useCurrentTab";

const allChainsEndInDeletion = (chains: Cred[][]) => {
  return chains.every((chain) => {
    const last = chain[chain.length - 1];
    if (last.isValid && last.type === "password") return last.isDeleted;
    return true;
  });
};

export const CredentialsAll = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  const [tab] = useCurrentTab();

  return (
    <div className="flex flex-col gap-4 p-0 py-4">
      {credsUrl ? (
        Object.entries(credsUrl).map(([url, chains]) => {
          if (allChainsEndInDeletion(chains)) return <></>;
          return (
            <div key={url} className="flex flex-col gap-2">
              <h2 className="text-xl text-center italic font-semibold mb-4">
                {url}
              </h2>
              {chains.map((chain) => (
                <CredentialChain chain={chain} tab={tab} />
              ))}
            </div>
          );
        })
      ) : (
        <h3>Loading...</h3>
      )}
    </div>
  );
};
