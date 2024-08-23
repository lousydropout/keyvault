import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
  Theme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { astar } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import astarLogo from "./assets/astar.png";
import merge from "lodash.merge";

const queryClient = new QueryClient();

const projectId = "62fceac10780ac6f1980e2d6934a6493";

const chains = [
  { ...astar, iconBackground: "#000", iconUrl: astarLogo },
] as const;

const config = getDefaultConfig({
  appName: "keyvault",
  projectId,
  chains,
  transports: { [astar.id]: http() },
});

type Web3ModalProviderProps = {
  children: React.ReactNode;
};

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          appInfo={{ appName: "keyvault" }}
          modalSize="compact"
          theme={merge(darkTheme(), {
            colors: { modalBackground: "#475569" },
          } as Theme)}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
