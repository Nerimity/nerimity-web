import { t } from "@nerimity/i18lite";

interface Status {
  name: () => string;
  id: string;
  color: string;
}

// OFFLINE = 0,
// ONLINE = 1,
// LTP = 2, // Looking To Play
// AFK = 3, // Away from keyboard
// DND = 4, // Do not disturb

export const UserStatuses: Status[] = [
  {
    name: () => t("status.offline"),
    id: "offline",
    color: "var(--status-offline)",
  },
  {
    name: () => t("status.online"),
    id: "online",
    color: "var(--status-online)",
  },
  {
    name: () => t("status.ltp"),
    id: "ltp",
    color: "var(--status-looking-to-play)",
  },
  {
    name: () => t("status.afk"),
    id: "afk",
    color: "var(--status-away-from-keyboard)",
  },
  {
    name: () => t("status.dnd"),
    id: "dnd",
    color: "var(--status-do-not-disturb)",
  },
];

export function userStatusDetail(status: number) {
  return UserStatuses[status] || (UserStatuses[0] as Status);
}
