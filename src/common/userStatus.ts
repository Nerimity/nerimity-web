
interface Status {
  name: string;
  id: string;
}


// OFFLINE = 0,
// ONLINE = 1,
// LTP = 2, // Looking To Play
// AFK = 3, // Away from keyboard
// DND = 4, // Do not disturb

const STATUSES: Status[] = [
  { name: 'Offline', id: 'offline' },
  { name: 'Online', id: 'online' },
  { name: 'Looking To Play', id: 'ltp' },
  { name: 'Away From Keyboard', id: 'afk' },
  { name: 'Do Not Disturb', id: 'dnd' },
]


export function userStatusDetail(status: number): Status {
  return STATUSES[status];
}