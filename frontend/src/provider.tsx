import { config } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

// const chains = [
//   hardhat,
//   { ...astar, iconBackground: "#000", iconUrl: astarLogo },
// ] as const;

type Web3ModalProviderProps = {
  children: React.ReactNode;
};

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  return (
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  );
}
