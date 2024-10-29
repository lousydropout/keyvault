import { useCurrentTab } from "@/hooks/useCurrentTab";
import { CredentialChain } from "@/side_panel/credentialChain";
import { CredsByUrl, PASSWORD_TYPE, PasswordCred } from "@/utils/credentials";

const allChainsEndInDeletion = (chains: PasswordCred[][]) => {
  return chains.every((chain) => {
    const last = chain[chain.length - 1];
    if (last.type === PASSWORD_TYPE) return last.isDeleted;
    return true;
  });
};

export const CredentialsAll = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  const [tab] = useCurrentTab();

  console.log("[CredentialsAll] credsUrl: ", credsUrl);

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
