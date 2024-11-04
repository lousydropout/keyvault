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

export type Encrypted = {
  iv: string;
  ciphertext: string;
};

export type Context = {
  address: string;
  chainId: number;
  encrypted: Encrypted;
  numEntries: number;
  overwrite?: boolean;
};

export function isEncrypted(obj: any): obj is Encrypted {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.iv === "string" &&
    typeof obj.ciphertext === "string"
  );
}

export function isContext(obj: any): obj is Context {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.address === "string" &&
    typeof obj.chainId === "number" &&
    typeof obj.encrypted === "object" &&
    obj.encrypted !== null &&
    isEncrypted(obj.encrypted) &&
    typeof obj.numEntries === "number" &&
    (obj.overwrite === undefined || typeof obj.overwrite === "boolean")
  );
}

export const useMessage = (): Context | null => {
  const [context, setContext] = useState<Context | null>(null);
  console.log("[useMessage] context: ", JSON.stringify(context));

  useEffect(() => {
    // handler for messages from chrome extension via contentScript
    const handleMessage = (event: MessageEvent) => {
      console.log("[useMessage] Received event: ", event);
      const { data: message }: { data: Message } = event;

      if (typeof message === "object" && message.type === "FROM_EXTENSION") {
        const data = message.data;
        console.log("Received data: ", data, isContext(data));
        if (!isContext(data)) return;

        console.log("Received context: ", data);

        if (data.overwrite) {
          console.log("Overwriting context: ", data);
          setContext(data);
        } else {
          console.log("Not overwriting context: ", data);
          setContext((prevContext) => ({ ...prevContext, ...data }));
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return context;
};
