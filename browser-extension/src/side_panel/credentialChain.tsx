import { CredentialCard } from "@/side_panel/credentialCard";
import { logger } from "@/utils/logger";
import { isPasswordAdditionCred, PasswordCred } from "@/utils/credentials";

export const CredentialChain = ({
  chain,
  tab,
}: {
  chain: PasswordCred[];
  tab: chrome.tabs.Tab | undefined;
}) => {
  const cred = chain[chain.length - 1];
  logger.debug("[CredentialChain] cred: ", cred);
  if (!isPasswordAdditionCred(cred)) return <></>;
  return <CredentialCard key={cred.id} cred={cred} tab={tab} />;
};
