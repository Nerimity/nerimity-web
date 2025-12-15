import { MessageType } from "@/chat-api/RawData";
import { t } from "@nerimity/i18lite";

export const getSystemMessage = (messageType: MessageType, isBot = false) => {
  switch (messageType) {
    case MessageType.CONTENT:
      return null;

    case MessageType.JOIN_SERVER:
      return {
        icon: "login",
        color: "var(--success-color)",
        message: isBot
          ? t("systemMessages.joinServer.bot")   
          : t("systemMessages.joinServer.user"), 
      };

    case MessageType.LEAVE_SERVER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: t("systemMessages.leaveServer"),
      };

    case MessageType.KICK_USER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: t("systemMessages.kickUser"),
      };

    case MessageType.BAN_USER:
      return {
        icon: "block",
        color: "var(--alert-color)",
        message: t("systemMessages.banUser"),
      };

    case MessageType.CALL_STARTED:
      return {
        icon: "call",
        color: "var(--success-color)",
        message: t("systemMessages.callStarted"),
      };

    case MessageType.BUMP_SERVER:
      return {
        icon: "trending_up",
        color: "var(--primary-color)",
        message: t("systemMessages.bumpServer"),
      };

    case MessageType.PINNED_MESSAGE:
      return {
        icon: "keep",
        color: "var(--primary-color)",
        message: t("systemMessages.pinnedMessage"),
      };

    default:
      return {
        icon: "info",
        color: "var(--alert-color)",
        message: t("systemMessages.unsupported"),
      };
  }
};
