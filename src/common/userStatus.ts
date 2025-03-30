import { t } from "i18next";

interface Status {
  name: string;
  id: string;
  color: string;
}

// OFFLINE = 0,
// ONLINE = 1,
// LTP = 2, // Looking To Play
// AFK = 3, // Away from keyboard
// DND = 4, // Do not disturb

export const UserStatuses: Status[] = [
  { name: t("profile.status.offline"), id: "offline", color: "#adadad" },
  { name: t("profile.status.online"), id: "online", color: "#78e380" },
  { name: t("profile.status.ltp"), id: "ltp", color: "#78a5e3" },
  { name: t("profile.status.afk"), id: "afk", color: "#e3a878" },
  { name: t("profile.status.dnd"), id: "dnd", color: "#e37878" }
];

export function userStatusDetail(status: number): Status {
  return UserStatuses[status];
}