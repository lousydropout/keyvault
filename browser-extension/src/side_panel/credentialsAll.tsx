import { CredentialCard } from "@/side_panel/credentialCard";
import { CredsByUrl, isPasswordAdditionCred } from "@/utils/credentials";

export const CredentialsAll = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      {credsUrl ? (
        Object.entries(credsUrl).map(([url, chains]) => (
          <div key={url} className="flex flex-col gap-2">
            <h2 className="text-xl text-center italic font-semibold">{url}</h2>
            {chains.map((chain) => {
              const cred = chain[chain.length - 1];
              if (!isPasswordAdditionCred(cred)) return <></>;
              return <CredentialCard key={cred.id} cred={cred} />;
            })}
          </div>
        ))
      ) : (
        <h3>Loading...</h3>
      )}
    </div>
  );
};
