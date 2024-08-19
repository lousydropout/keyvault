import { Card, CardHeader } from "@/components/ui/card";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { CredentialCard } from "@/side_panel/credentialCard";
import { CredsByUrl, isPasswordAdditionCred } from "@/utils/credentials";

export const CurrentPage = ({ credsUrl }: { credsUrl: CredsByUrl }) => {
  const [_, currentUrl] = useCurrentTab();

  const url = currentUrl || "Unknown";
  const chains = credsUrl[url];

  return (
    <div className="flex flex-col gap-2 mt-4 px-2">
      <h2 className="text-xl text-center italic font-semibold">{url}</h2>
      {chains ? (
        chains.map((chain) => {
          const cred = chain[chain.length - 1];
          if (!isPasswordAdditionCred(cred)) return <></>;
          return <CredentialCard key={cred.id} cred={cred} />;
        })
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
