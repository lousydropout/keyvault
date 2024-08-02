import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { astar } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import astarLogo from "./assets/astar.png";

const queryClient = new QueryClient();

const projectId = "62fceac10780ac6f1980e2d6934a6493";

const chains = [
  { ...astar, iconBackground: "#000", iconUrl: astarLogo },
] as const;
// const chains = [astar] as const;

const config = getDefaultConfig({
  appName: "keyvault",
  projectId,
  chains,
  transports: {
    [astar.id]: http(),
  },
});

interface Web3ModalProviderProps {
  children: React.ReactNode;
}

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
