import { Socket } from "socket.io-client";
import { ContextStore } from "../store";
import { ServerEvents } from "@/chat-api/EventNames";
import { ActivityStatus } from "@/chat-api/RawData";
import { UserStatus } from "../createUsersStore";
import { StorageKeys, getStorageObject } from "@/common/localStorage";
import { ProgramWithAction, electronWindowAPI } from "@/common/Electron";

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
      handleLoggedInUserPresenceUpdate(payload, state);
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

  const handleLoggedInUserPresenceUpdate = (payload: UserPresenceUpdatePayload, state: ContextStore) => {
    if (payload.status === undefined) return;
    const user = state.users.get(payload.userId);
    const wasOffline = !user?.presence?.status && payload.status !== UserStatus.OFFLINE;
    if (!wasOffline) return;
  
    const programs = getStorageObject<ProgramWithAction[]>(StorageKeys.PROGRAM_ACTIVITY_STATUS, [])
    electronWindowAPI()?.restartActivityStatus(programs);
  }

  socket.on(ServerEvents.USER_PRESENCE_UPDATE, onUserPresenceUpdate)


};



export {
  registerUserEvents
}
