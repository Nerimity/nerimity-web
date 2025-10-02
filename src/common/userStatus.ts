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
  { name: "Offline", id: "offline", color: "var(--Status-Offline)" },
  { name: "Online", id: "online", color: "var(--Status-Online)" },
  { name: "Looking To Play", id: "ltp", color: "var(--Status-Looking-To-Play)" },
  { name: "Away From Keyboard", id: "afk", color: "var(--Status-Away-From-Keyboard)" },
  { name: "Do Not Disturb", id: "dnd", color: "var(--Status-Do-Not-Disturb)" }
];

export function userStatusDetail(status: number): Status {
  return UserStatuses[status];
}
