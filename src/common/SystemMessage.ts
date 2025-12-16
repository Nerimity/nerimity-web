import { MessageType } from "@/chat-api/RawData";
import { t } from "@nerimity/i18lite";

const tn = (v: string) => v;

export const getSystemMessage = (messageType: MessageType, isBot = false) => {
  switch (messageType) {
    case MessageType.CONTENT:
      return null;

    case MessageType.JOIN_SERVER:
      return {
        icon: "login",
        color: "var(--success-color)",
        message: isBot
          ? tn("systemMessages.joinServer.bot")
          : tn("systemMessages.joinServer.user"),
      };

    case MessageType.LEAVE_SERVER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: tn("systemMessages.leaveServer"),
      };

    case MessageType.KICK_USER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: tn("systemMessages.kickUser"),
      };

    case MessageType.BAN_USER:
      return {
        icon: "block",
        color: "var(--alert-color)",
        message: tn("systemMessages.banUser"),
      };

    case MessageType.CALL_STARTED:
      return {
        icon: "call",
        color: "var(--success-color)",
        message: tn("systemMessages.callStarted"),
      };

    case MessageType.BUMP_SERVER:
      return {
        icon: "trending_up",
        color: "var(--primary-color)",
        message: tn("systemMessages.bumpServer"),
      };

    case MessageType.PINNED_MESSAGE:
      return {
        icon: "keep",
        color: "var(--primary-color)",
        message: tn("systemMessages.pinnedMessage"),
      };

    default:
      return {
        icon: "info",
        color: "var(--alert-color)",
        message: tn("systemMessages.unsupported"),
      };
  }
};
