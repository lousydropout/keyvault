import { Connect } from "./connect";

export const Header = () => {
  return (
    <div className="flex items-end justify-between mt-4">
      <a href="/" className="text-violet-400 font-semibold text-5xl">
        keyvault
      </a>
      <Connect />
    </div>
  );
};
