import { useState } from "react";

export const Icon = ({
  children,
  label,
  onClick,
  disableFor = 0,
}: {
  children: React.ReactNode;
  label?: string;
  onClick: () => void;
  disableFor?: number;
}) => {
  const [disabled, setDisabled] = useState<boolean>(false);

  const buttonClass =
    "bg-transparent focus:outline-none focus-visible:outline-none w-auto h-auto p-1";
  const iconClass = `flex flex-col items-center text-center text-lg`;
  const disabledIconClass = `
    flex flex-col items-center text-center 
    text-lg text-purple-300 text-opacity-50
    cursor-not-allowed
    `;

  const handleClick = () => {
    if (disableFor > 0) {
      setDisabled(true);
      setTimeout(() => setDisabled(false), disableFor);
    }
    onClick();
  };

  return (
    <button className={buttonClass} onClick={handleClick} disabled={disabled}>
      <div className={disabled ? disabledIconClass : iconClass}>
        {children}
        {label && <p>{label}</p>}
      </div>
    </button>
  );
};
