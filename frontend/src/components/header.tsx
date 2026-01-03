import { Connect } from "@/Connect";
import { useExpectedChain } from "@/hooks/useExpectedChain";

export const Header = () => {
  const { chainName, isFromUrl } = useExpectedChain();

  return (
    <div className="flex items-end justify-between mt-4">
      <a href="/" className="text-violet-400 font-semibold text-5xl">
        Keyvault {isFromUrl && <span className="text-3xl text-slate-400">| {chainName}</span>}
      </a>
      <div className="flex gap-2">
        <Connect />
      </div>
    </div>
  );
};
