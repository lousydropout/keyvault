import { CredentialCard } from "@/side_panel/credentialCard";
import { Cred, isPasswordAdditionCred } from "@/utils/credentials";

export const CredentialChain = ({ chain }: { chain: Cred[] }) => {
  const cred = chain[chain.length - 1];
  if (!isPasswordAdditionCred(cred)) return <></>;
  return <CredentialCard key={cred.id} cred={cred} />;
};
