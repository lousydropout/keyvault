import { Context, Message } from "../hooks/useFiniteStateMachine";

export type State =
  | "CHECKING"
  | "ACCOUNT_DOES_NOT_EXIST"
  | "ACCOUNT_EXISTS"
  | "ACCOUNT_IMPORT"
  | "ACCOUNT_RESET"
  | "LOGGED_IN"
  | "ON_CHAIN_UPDATE_IN_PROGRESS";

export type Action =
  | "DISCONNECT_WALLET"
  | "REQUEST_CONTEXT"
  | "FOUND_NO_ACCOUNT"
  | "FOUND_ACCOUNT"
  | "ACCOUNT_RESET_REQUESTED"
  | "ACCOUNT_RESET_SUCCESS"
  | "ACCOUNT_IMPORT_SUCCESS"
  | "ACCOUNT_CREATION_SUCCESS"
  | "ACCOUNT_CREATION_FAILURE"
  | "SYNC_SUCCESS"
  | "ON_CHAIN_UPDATE_SUCCESS"
  | "UPDATING_CREDENTIALS_ON_CHAIN_STATUS"
  | "IMPORT_ACCOUNT";

export const calculateNextState = (
  currentContext: Context<State>,
  message: Message
): Context<State> => {
  let result;

  console.log(
    "[calculateNextState] currentContext: ",
    currentContext,
    message.action
  );

  switch (message.action as Action) {
    case "DISCONNECT_WALLET":
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> CHECKING (send: true)`
      );
      result = {
        ...currentContext,
        state: "CHECKING" as State,
        action: message.action,
        send: true,
      };
      delete result.context.walletAddress;
      delete result.context.correctKey;
      delete result.context.createdAccount;
      return result;

    case "IMPORT_ACCOUNT":
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> ACCOUNT_IMPORT (send: false)`
      );
      return {
        ...currentContext,
        action: message.action,
        state: "ACCOUNT_IMPORT" as State,
        send: false,
      };

    case "REQUEST_CONTEXT":
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: true)`
      );
      return { ...currentContext, action: "UPDATE_CONTEXT", send: true };

    case "FOUND_NO_ACCOUNT":
      if (currentContext.state !== "CHECKING") {
        console.log(
          `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: ${currentContext.send})`
        );
        return currentContext;
      }
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> ACCOUNT_DOES_NOT_EXIST (send: false)`
      );
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "ACCOUNT_DOES_NOT_EXIST" as State,
        send: false,
      };

    case "FOUND_ACCOUNT":
      if (
        currentContext.state !== "CHECKING" &&
        currentContext.state !== "ACCOUNT_EXISTS"
      ) {
        console.log(
          `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: ${currentContext.send})`
        );
        return currentContext;
      }
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> ACCOUNT_EXISTS (send: true)`
      );
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "ACCOUNT_EXISTS" as State,
        send: true,
      };

    case "ACCOUNT_IMPORT_SUCCESS":
      if (currentContext.state != "ACCOUNT_IMPORT") {
        console.log(
          `[stateMachine] ${message.action}: ${currentContext.state} -> CHECKING (send: ${currentContext.send})`
        );
        return currentContext;
      }
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> LOGGED_IN (send: true)`
      );
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "LOGGED_IN" as State,
        send: true,
      };

    case "ACCOUNT_RESET_REQUESTED":
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> ACCOUNT_RESET (send: true)`
      );
      // if (currentContext.state != "ACCOUNT_RESET") return currentContext;
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "ACCOUNT_RESET" as State,
        send: true,
      };

    case "ACCOUNT_RESET_SUCCESS":
      if (
        currentContext.state != "ACCOUNT_RESET" &&
        currentContext.state != "ACCOUNT_EXISTS"
      ) {
        console.log(
          `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: ${currentContext.send})`
        );
        return currentContext;
      }
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> LOGGED_IN (send: true)`
      );
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "LOGGED_IN" as State,
        send: true,
      };

    case "ACCOUNT_CREATION_SUCCESS":
      if (currentContext.state !== "ACCOUNT_DOES_NOT_EXIST") {
        console.log(
          `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: ${currentContext.send})`
        );
        return currentContext;
      }
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> LOGGED_IN (send: true)`
      );
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "LOGGED_IN" as State,
        send: true,
      };

    case "ACCOUNT_CREATION_FAILURE":
      if (currentContext.state !== "ACCOUNT_DOES_NOT_EXIST") {
        console.log(
          `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: ${currentContext.send})`
        );
        return currentContext;
      }
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> HOME (send: true)`
      );
      return {
        ...currentContext,
        action: message.action,
        context: { ...currentContext.context, ...message.data },
        state: "HOME" as State,
        send: true,
      };

    case "SYNC_SUCCESS":
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> ON_CHAIN_UPDATE_IN_PROGRESS (send: false)`
      );
      return {
        ...currentContext,
        action: "UPDATING_CREDENTIALS_ON_CHAIN_STATUS",
        state: "ON_CHAIN_UPDATE_IN_PROGRESS" as State,
        send: false,
      };

    case "ON_CHAIN_UPDATE_SUCCESS":
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> LOGGED_IN (send: false)`
      );
      return {
        ...currentContext,
        action: message.action,
        state: "LOGGED_IN" as State,
        send: false,
      };

    default:
      console.log(
        `[stateMachine] ${message.action}: ${currentContext.state} -> UNCHANGED (send: false)`
      );
      return {
        ...currentContext,
        context: { ...currentContext.context, ...message.data },
        send: false,
      };
  }
};
