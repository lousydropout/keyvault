import { useCurrentTab } from "@/hooks/useCurrentTab";
import { logger } from "@/utils/logger";
import { CredentialChain } from "@/side_panel/credentialChain";
import { CredsByUrl, PASSWORD_TYPE, PasswordCred } from "@/utils/credentials";
import { EmptyChainState } from "@/components/EmptyChainState";

const allChainsEndInDeletion = (chains: PasswordCred[][]) => {
  return chains.every((chain) => {
    const last = chain[chain.length - 1];
    if (last.type === PASSWORD_TYPE) return last.isDeleted;
    return true;
  });
};

type CredentialsAllProps = {
  credsUrl: CredsByUrl;
};

export const CredentialsAll = ({ credsUrl }: CredentialsAllProps) => {
  const [tab] = useCurrentTab();

  logger.debug("[CredentialsAll] credsUrl: ", credsUrl);

  // Check if still loading (credsUrl is falsy)
  const isLoading = !credsUrl;

  // Get visible entries (those not all deleted)
  const visibleEntries = credsUrl
    ? Object.entries(credsUrl).filter(
        ([_url, chains]) => !allChainsEndInDeletion(chains)
      )
    : [];

  const hasNoCredentials = !isLoading && visibleEntries.length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-0 py-4">
        <h3>Loading...</h3>
      </div>
    );
  }

  if (hasNoCredentials) {
    return <EmptyChainState isLoading={false} />;
  }

  return (
    <div className="flex flex-col gap-4 p-0 py-4">
      {visibleEntries.map(([url, chains]) => (
        <div key={url} className="flex flex-col gap-2">
          <h2 className="text-xl text-center italic font-semibold mb-4">
            {url}
          </h2>
          {chains.map((chain, index) => (
            <CredentialChain key={`${url}-${index}`} chain={chain} tab={tab} />
          ))}
        </div>
      ))}
    </div>
  );
};
