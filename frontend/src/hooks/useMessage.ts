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

export type EncryptedType = {
  iv: string;
  ciphertext: string;
  onChain: boolean;
};

export type Context = {
  address: string;
  chainId: number;
  encrypteds: EncryptedType[];
  numEntries: number;
  overwrite?: boolean;
};

export function isEncryptedType(obj: any): obj is EncryptedType {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.iv === "string" &&
    typeof obj.ciphertext === "string" &&
    typeof obj.onChain === "boolean"
  );
}

function isEncrypteds(obj: any): obj is Context["encrypteds"] {
  return Array.isArray(obj) && obj.every(isEncryptedType);
}

export function isContext(obj: any): obj is Context {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.address === "string" &&
    typeof obj.chainId === "number" &&
    typeof obj.encrypteds === "object" &&
    obj.encrypteds !== null &&
    isEncrypteds(obj.encrypteds) &&
    typeof obj.numEntries === "number" &&
    (obj.overwrite === undefined || typeof obj.overwrite === "boolean")
  );
}

export const useMessage = (): Context | null => {
  const [context, setContext] = useState<Context | null>(null);

  useEffect(() => {
    // handler for messages from chrome extension via contentScript
    const handleMessage = (event: MessageEvent) => {
      console.log("[useMessage] Received event: ", event);
      const { data: message }: { data: Message } = event;

      if (typeof message === "object" && message.type === "FROM_EXTENSION") {
        const data = message.data;
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
