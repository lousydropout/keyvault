import { Card, CardHeader } from "@/components/ui/card";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { CredentialChain } from "@/side_panel/credentialChain";
import { CredsByUrl } from "@/utils/credentials";

export const CurrentPage = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  const [tab, currentUrl] = useCurrentTab();
  const chains = credsUrl[currentUrl || "N/A"];

  return (
    <div className="flex flex-col gap-2 mt-4">
      <h2 className="text-xl text-center italic font-semibold">{currentUrl}</h2>
      {chains ? (
        chains.map((chain) => <CredentialChain chain={chain} tab={tab} />)
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
