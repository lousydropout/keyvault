type EmptyChainStateProps = {
  chainName: string;
  isLoading: boolean;
};

export const EmptyChainState = ({
  chainName,
  isLoading,
}: EmptyChainStateProps) => {
  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm">
        <p className="text-slate-200 text-lg mb-2">
          No credentials found on {chainName}.
        </p>
        <p className="text-slate-400 text-sm">
          Your credentials on other chains remain unchanged.
        </p>
      </div>
    </div>
  );
};
