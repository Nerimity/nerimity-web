import { MessageType } from "@/chat-api/RawData";

export const getSystemMessage = (messageType: MessageType) => {
  switch (messageType) {
    case MessageType.JOIN_SERVER:
      return {
        icon: "login",
        color: "var(--success-color)",
        message: "has joined the server.",
      };
    case MessageType.LEAVE_SERVER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: "has left the server.",
      };
    case MessageType.KICK_USER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: "has been kicked.",
      };
    case MessageType.BAN_USER:
      return {
        icon: "block",
        color: "var(--alert-color)",
        message: "has been banned.",
      };
    case MessageType.CALL_STARTED:
      return {
        icon: "call",
        color: "var(--success-color)",
        message: "started a call.",
      };
    case MessageType.BUMP_SERVER:
      return {
        icon: "trending_up",
        color: "var(--primary-color)",
        message: "bumped the server.",
      };
    case MessageType.PINNED_MESSAGE:
      return {
        icon: "keep",
        color: "var(--primary-color)",
        message: "pinned a message.",
      };
    default:
      return {
        icon: "info",
        color: "var(--alert-color)",
        message: "Unsupported message.",
      };
  }
};
