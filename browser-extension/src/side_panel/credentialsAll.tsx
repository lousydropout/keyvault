import { CredsByUrl } from "@/utils/credentials";
import { CredentialChain } from "./credentialChain";

export const CredentialsAll = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  return (
    <div className="flex flex-col gap-4 p-0 py-4">
      {credsUrl ? (
        Object.entries(credsUrl).map(([url, chains]) => (
          <div key={url} className="flex flex-col gap-2">
            <h2 className="text-xl text-center italic font-semibold">{url}</h2>
            {chains.map((chain) => (
              <CredentialChain chain={chain} />
            ))}
          </div>
        ))
      ) : (
        <h3>Loading...</h3>
      )}
    </div>
  );
};
