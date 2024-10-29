import { useEffect, useState } from "react";

type MessageType =
  | "ACCOUNT_CREATION"
  | "TO_EXTENSION"
  | "FROM_EXTENSION"
  | "REQUEST";

type Message = {
  type: MessageType;
  channelName: string;
  data: Record<string, any>;
  overwrite?: boolean;
};

export type Context = {
  pubkey: string;
  address: string;
  chainId: number;
};

export function isContext(obj: any): obj is Context {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.pubkey === "string" &&
    typeof obj.address === "string" &&
    typeof obj.chainId === "number"
  );
}

export const usePubkeyMessage = (): Context | null => {
  const [context, setContext] = useState<Context | null>(null);

  useEffect(() => {
    // handler for messages from chrome extension via contentScript
    const handleMessage = (event: MessageEvent) => {
      console.log("[usePubkeyMessage] Received event: ", event);
      const { data: message }: { data: Message } = event;

      if (typeof message === "object" && message.type === "FROM_EXTENSION") {
        const data = message.data;
        console.log("Received data: ", data, isContext(data));
        if (!isContext(data)) return;

        console.log("Received context: ", data);

        setContext(data);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return context;
};
