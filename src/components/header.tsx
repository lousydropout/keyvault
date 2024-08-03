import { Connect } from "./connect";

export const Header = () => {
  return (
    <div className="flex items-end justify-between mt-4">
      <h1 className="text-violet-400 font-semibold text-5xl">keyvault</h1>
      <Connect />
    </div>
  );
};
