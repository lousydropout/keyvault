import { useCurrentTab } from "@/hooks/useCurrentTab";
import { CredentialCard } from "@/side_panel/credentialCard";
import { CredsByUrl, isPasswordAdditionCred } from "@/utils/credentials";

export const CurrentPage = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  const [_, currentUrl] = useCurrentTab();

  const url = currentUrl || "Unknown";
  const chains = credsUrl[url];

  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      <h2 className="text-xl text-center italic font-semibold">{url}</h2>
      {chains ? (
        chains.map((chain) => {
          const cred = chain[chain.length - 1];
          if (!isPasswordAdditionCred(cred)) return <></>;
          return <CredentialCard key={cred.id} cred={cred} />;
        })
      ) : (
        <></>
      )}
    </div>
  );
};
