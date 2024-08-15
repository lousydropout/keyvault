import { API_URL } from "@/side_panel/url";
import { defineChain } from "viem";

export const shibuya = defineChain({
  id: 81,
  name: "Shibuya",
  testnet: true,
  nativeCurrency: { name: "SBY", symbol: "SBY", decimals: 18 },
  rpcUrls: { default: { http: [API_URL] } },
  blockExplorers: {
    default: { name: "Subscan", url: "https://shibuya.subscan.io" },
  },
});
