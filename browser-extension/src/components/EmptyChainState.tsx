type EmptyChainStateProps = {
  isLoading: boolean;
};

export const EmptyChainState = ({
  isLoading,
}: EmptyChainStateProps) => {
  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm">
        <p className="text-slate-200 text-lg">
          No credentials found.
        </p>
      </div>
    </div>
  );
};
