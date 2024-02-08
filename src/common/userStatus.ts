
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
  { name: "Offline", id: "offline", color: "#adadad" },
  { name: "Online", id: "online", color: "#78e380" },
  { name: "Looking To Play", id: "ltp", color: "#78a5e3" },
  { name: "Away From Keyboard", id: "afk", color: "#e3a878" },
  { name: "Do Not Disturb", id: "dnd", color: "#e37878" }
];

export function userStatusDetail(status: number): Status {
  return UserStatuses[status];
}