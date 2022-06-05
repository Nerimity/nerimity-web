import useUsers, { UserStatus } from "../store/useUsers";

export function onUserPresenceUpdate(payload: {status: UserStatus, userId: string}) {
  const users = useUsers();
  users.setPresence(payload.userId, {status: payload.status})
}