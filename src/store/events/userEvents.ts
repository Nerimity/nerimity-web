import { Socket } from "socket.io-client";
import { ContextStore } from "../store";
import { ServerEvents } from "@/chat-api/EventNames";
import { ActivityStatus, FriendStatus, RawServerSettings, RawUser, RawUserConnection } from "@/chat-api/RawData";
import { UserStatus } from "../createUsersStore";
import { StorageKeys, getStorageObject } from "@/common/localStorage";
import { ProgramWithAction, electronWindowAPI } from "@/common/Electron";
import { batch } from "solid-js";

interface UserPresenceUpdatePayload { 
  userId: string; 
  status?: UserStatus;
  custom?: string; 
  activity?: ActivityStatus
}

const registerUserEvents = (socket: Socket, state: ContextStore) => {

  const onUserPresenceUpdate = (payload: UserPresenceUpdatePayload) => {

    const loggedInUser = state.account.getLoggedInUser();
    const isLoggedInUser = loggedInUser?.id === payload.userId;
  
    if (isLoggedInUser) {
      handleLoggedInUserPresenceUpdate(payload);
    }
  
    state.users.dispatch("UPDATE_USER_PRESENCE", {
      id: payload.userId,
      update: {
        ...(payload.status !== undefined ? {status: payload.status} : undefined), 
        ...(payload.custom !== undefined ? {custom: payload.custom} : undefined),
        ...(payload.activity !== undefined ? {activity: payload.activity} : undefined)
      }
    })
  }

  const handleLoggedInUserPresenceUpdate = (payload: UserPresenceUpdatePayload) => {
    if (payload.status === undefined) return;
    const user = state.users.get(payload.userId);
    const wasOffline = !user?.presence?.status && payload.status !== UserStatus.OFFLINE;
    if (!wasOffline) return;
  
    const programs = getStorageObject<ProgramWithAction[]>(StorageKeys.PROGRAM_ACTIVITY_STATUS, [])
    electronWindowAPI()?.restartActivityStatus(programs);
  }

  const onUserUpdated = (payload: Partial<RawUser>) => {
    state.users.dispatch("UPDATE_USER", {
      id: payload.id!,
      user: payload
    });
  }

  const onUserServerSettingsUpdate = (payload: {serverId: string, updated: Partial<RawServerSettings>}) => {
    state.account.dispatch("UPDATE_SERVER_SETTINGS", {
      serverId: payload.serverId,
      updated: payload.updated
    })
  }


  const onUserConnectionAdded = (payload: {connection: RawUserConnection}) => {
    state.account.dispatch("ADD_CONNECTION", payload.connection);
  }

  const onUserConnectionRemoved = (payload: {connectionId: string}) => {
    state.account.dispatch("REMOVE_CONNECTION", payload.connectionId);
  }


  const onUserBlocked = (payload: {user: RawUser}) => {
    batch(() => {
      state.users.dispatch("UPDATE_USER", {
        id: payload.user.id,
        user: payload.user
      })
      state.friends.dispatch("ADD_FRIEND", {
        createdAt: Date.now(),
        recipientId: payload.user.id,
        userId: state.account.getLoggedInUser()?.id!,
        status: FriendStatus.BLOCKED,
      })
    })
  }

  const onUserUnblocked = (payload: {userId: string}) => {
    state.friends.dispatch("DELETE_FRIEND", payload.userId);
  }




  socket.on(ServerEvents.USER_UPDATED, onUserUpdated);
  socket.on(ServerEvents.USER_PRESENCE_UPDATE, onUserPresenceUpdate)
  socket.on(ServerEvents.USER_SERVER_SETTINGS_UPDATE, onUserServerSettingsUpdate)
  socket.on(ServerEvents.USER_CONNECTION_ADDED, onUserConnectionAdded)
  socket.on(ServerEvents.USER_CONNECTION_REMOVED, onUserConnectionRemoved)
  socket.on(ServerEvents.USER_BLOCKED, onUserBlocked)
  socket.on(ServerEvents.USER_UNBLOCKED, onUserUnblocked)

};



export {
  registerUserEvents
}
