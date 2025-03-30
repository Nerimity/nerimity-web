import { MessageType } from "@/chat-api/RawData";
import { useTransContext } from "@mbarzda/solid-i18next";

export const getSystemMessage = (messageType: MessageType) => {
  const [t] = useTransContext();
  switch (messageType) {
    case MessageType.JOIN_SERVER:
      return {
        icon: "login",
        color: "var(--primary-color)",
        message: t("servers.systemMessages.joined"),
      };
    case MessageType.LEAVE_SERVER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: t("servers.systemMessages.left"),
      };
    case MessageType.KICK_USER:
      return {
        icon: "logout",
        color: "var(--alert-color)",
        message: t("servers.systemMessages.kicked"),
      };
    case MessageType.BAN_USER:
      return {
        icon: "block",
        color: "var(--alert-color)",
        message: t("servers.systemMessages.banned"),
      };
    case MessageType.CALL_STARTED:
      return {
        icon: "call",
        color: "var(--success-color)",
        message: t("servers.systemMessages.call"),
      };
    case MessageType.BUMP_SERVER:
      return {
        icon: "trending_up",
        color: "var(--primary-color)",
        message: t("servers.systemMessages.bump"),
      };
    default:
      return undefined;
  }
};
