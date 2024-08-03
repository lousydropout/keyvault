import { useEffect } from "react";
import { useChromeStorageLocal } from "./useChromeLocalStorage";

export type Context<State> = {
  state: State;
  action: string;
  context: Record<string, any>;
  send: boolean;
};

export type Message = {
  type: "FROM_EXTENSION";
  action: string;
  data: Record<string, any>;
};

function useFiniteStateMachine<State>(
  defaultState: State,
  calculateNextState: (
    context: Context<State>,
    message: Message
  ) => Context<State>
): [
  Context<State> | undefined,
  (
    action?: string | null,
    _context?: Record<string, any>,
    send?: boolean
  ) => void,
  (action: string, data: Record<string, any>) => void
] {
  // Note: there are 2 actions:
  //   - `action` -- this is the action received by the state machine and that'll be used to modify the state
  //   - `context.action` -- this is the action to be sent as part of `postMessage`.

  const [message] = useChromeStorageLocal<Message>("action", {
    type: "FROM_EXTENSION",
    action: "",
    data: {},
  });
  const [context, setContext, hasLoadedContext] = useChromeStorageLocal<
    Context<State> | undefined
  >("context", undefined);

  const updateContext = (
    action: string | null = null,
    data: Record<string, any> = {},
    send: boolean = false
  ) => {
    setContext((prev) => {
      if (prev) {
        const result = {
          ...prev,
          context: { ...prev.context, ...data },
          action: action ? action : "",
          send,
        };
        return result;
      }
    });
  };

  const postMessage = async (action: string, data: Record<string, any>) => {
    // get all Keyvault tab's IDs
    const tabs = await chrome.tabs.query({ title: "KeyVault" });

    // send to all KeyVault tabs (nothing sensitive is ever sent)
    tabs.forEach(async (tab) => {
      if (typeof tab.id !== "number") return;

      await chrome.tabs.sendMessage(tab.id as number, {
        type: "FROM_EXTENSION",
        channelName: "action",
        action,
        data,
      });
    });
  };

  useEffect(() => {
    if (!message) return;
    setContext((currentContext) => {
      if (!currentContext) return currentContext;
      return calculateNextState(currentContext, message);
    });
  }, [message]);

  useEffect(() => {
    const sendMessage = async () => {
      setContext((prev) => {
        if (!prev) return prev;
        if (!(prev.send && prev.action)) return prev;
        postMessage(prev.action, prev.context);
        return { ...prev, action: "", send: true };
      });
    };

    sendMessage();
  }, [context]);

  const updateState = (action: string, data: Record<string, any>) => {
    setContext((currentContext) => {
      if (!currentContext) return currentContext;
      const message: Message = { action, data, type: "FROM_EXTENSION" };
      return calculateNextState(currentContext, message);
    });
  };

  useEffect(() => {
    if (hasLoadedContext && context === undefined) {
      setContext((prev) => {
        if (!prev)
          return { state: defaultState, action: "", context: {}, send: false };
        return { ...prev, state: defaultState };
      });
    }
  }, [hasLoadedContext]);

  return [context, updateContext, updateState];
}

export { useFiniteStateMachine };
