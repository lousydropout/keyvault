import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAddress = (address: string): string => {
  if (typeof address !== "string" || address.length < 10) {
    throw new Error("Invalid address length");
  }

  const start = address.slice(0, 4);
  const end = address.slice(-4);

  return `${start}...${end}`;
};
