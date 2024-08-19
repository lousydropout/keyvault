import { CopyIcon } from "@/components/icons/copy";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { PasswordAdditionCred } from "@/utils/credentials";
import { useState } from "react";

const defaultPassword = "********";

const CardRow = ({
  value,
  isSecret = false,
}: {
  value: string;
  isSecret?: boolean;
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };
  return (
    <div className="relative flex justify-end gap-8 items-center text-purple-200 text-opacity-100">
      <span>{isSecret ? defaultPassword : value}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="hover:text-purple-400 active:text-purple-500 focus:outline-none"
      >
        <CopyIcon className="w-6 h-6" />
      </button>
      {showTooltip && (
        <div className="absolute -top-8 -right-12 bg-purple-500 text-white p-2 rounded-md text-sm">
          Copied!
        </div>
      )}
    </div>
  );
};

const CredentialCard = ({ cred }: { cred: PasswordAdditionCred }) => {
  return (
    <Card className="mt-4 p-4 bg-transparent border-opacity-10 text-purple-200">
      <CardHeader className="my-0 py-0">
        <CardDescription className="flex flex-col gap-4">
          <CardRow value={cred.username} />
          <CardRow value={cred.password} isSecret />
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export { CredentialCard };
