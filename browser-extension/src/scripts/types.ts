export type ContentScriptMessage = {
  type: string;
  action: string;
  username?: string;
  password?: string;
};

export const isContentScriptMessage = (obj: object): boolean => {
  return (
    "type" in obj &&
    typeof obj.type === "string" &&
    "action" in obj &&
    typeof obj.action === "string"
  );
};
