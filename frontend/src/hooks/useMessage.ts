import { useCallback, useEffect, useState } from "react";

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

/**
 * Batch message format from extension (new format).
 */
type BatchData = {
  encrypteds: Encrypted[];
  address: string;
  startIndex: number;
  chainId: number;
};

/**
 * Result type for useMessage hook with batch support.
 */
export type MessageResult = {
  /** Current entry to process (null if queue empty) */
  current: Context | null;
  /** Total entries in current batch */
  total: number;
  /** Number of entries remaining (including current) */
  remaining: number;
  /** Advance to next entry after successful submission */
  next: () => void;
};

export function isEncrypted(obj: any): obj is Encrypted {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.iv === "string" &&
    typeof obj.ciphertext === "string"
  );
}

function isBatchData(obj: any): obj is BatchData {
  return (
    typeof obj === "object" &&
    obj !== null &&
    Array.isArray(obj.encrypteds) &&
    obj.encrypteds.every(isEncrypted) &&
    typeof obj.address === "string" &&
    typeof obj.startIndex === "number" &&
    typeof obj.chainId === "number"
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

export const useMessage = (): MessageResult => {
  // Queue of entries to process
  const [queue, setQueue] = useState<Context[]>([]);
  const [total, setTotal] = useState(0);

  const current = queue.length > 0 ? queue[0] : null;
  const remaining = queue.length;

  // Advance to next entry after successful submission
  const next = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { data: message } = event;

      if (typeof message === "object" && message?.type === "FROM_EXTENSION") {
        console.log("[useMessage] FROM_EXTENSION message:", message);
        const data = message.data;

        // Handle new batch format
        if (isBatchData(data)) {
          console.log("[useMessage] Received batch:", data.encrypteds.length, "entries");
          const entries: Context[] = data.encrypteds.map((encrypted, i) => ({
            address: data.address,
            chainId: data.chainId,
            encrypted,
            numEntries: data.startIndex + i,
            overwrite: true,
          }));
          setQueue(entries);
          setTotal(entries.length);
          return;
        }

        // Handle legacy single-entry format
        if (isContext(data)) {
          console.log("[useMessage] Received single entry (legacy format)");
          setQueue([data]);
          setTotal(1);
          return;
        }

        console.log("[useMessage] Validation failed. Unknown format:", data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return { current, total, remaining, next };
};
