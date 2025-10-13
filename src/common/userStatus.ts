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
  { name: "Offline", id: "offline", color: "var(--status-offline)" },
  { name: "Online", id: "online", color: "var(--status-online)" },
  {
    name: "Looking To Play",
    id: "ltp",
    color: "var(--status-looking-to-play)",
  },
  {
    name: "Away From Keyboard",
    id: "afk",
    color: "var(--status-away-from-keyboard)",
  },
  { name: "Do Not Disturb", id: "dnd", color: "var(--status-do-not-disturb)" },
];

export function userStatusDetail(status: number) {
  return UserStatuses[status] || (UserStatuses[0] as Status);
}
