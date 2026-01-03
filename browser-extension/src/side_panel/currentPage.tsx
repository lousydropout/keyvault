import { Card, CardHeader } from "@/components/ui/card";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { CredentialChain } from "@/side_panel/credentialChain";
import { CredsByUrl } from "@/utils/credentials";
import { EmptyChainState } from "@/components/EmptyChainState";

type CurrentPageProps = {
  credsUrl: CredsByUrl;
};

export const CurrentPage = ({ credsUrl }: CurrentPageProps) => {
  const [tab, currentUrl] = useCurrentTab();
  const chains = credsUrl[currentUrl || "N/A"];

  // Check if there are any credentials at all
  const hasNoCredentials = Object.keys(credsUrl).length === 0;

  if (hasNoCredentials) {
    return <EmptyChainState isLoading={false} />;
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <h2 className="text-xl text-center italic font-semibold">{currentUrl}</h2>
      {chains ? (
        chains.map((chain, index) => (
          <CredentialChain key={`${currentUrl}-${index}`} chain={chain} tab={tab} />
        ))
      ) : (
        <Card className="bg-transparent mt-4 px-2 text-white">
          <CardHeader className="text-center">
            No credentials found for this URL
          </CardHeader>
        </Card>
      )}
    </div>
  );
};
