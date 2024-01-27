import { ActivityStatus, RawPresence, RawUser } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";


export enum UserStatus {
  OFFLINE = 0,
  ONLINE = 1,
  LTP = 2, // Looking To Play
  AFK = 3, // Away from keyboard
  DND = 4, // Do not disturb
}

export interface Presence {
  custom?: string | null;
  status: UserStatus;
  activity?: ActivityStatus
}


type User = {
  presence?: Presence
} & RawUser;

const [users, setUsers] = createStore<Record<string, User>>({});

const ADD_USER = (user: User) => {
  setUsers(user.id, reconcile(user));
  return true;
}

const ADD_USERS = (users: User[]) => {
  batch(() => {
    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      setUsers(user.id, reconcile(user));
    }
  })
}

const UPDATE_USER = (payload: {id: string, user: Partial<User>}) => {
  if (!users[payload.id]) return;
  setUsers(payload.id, payload.user);
}

const UPDATE_USER_PRESENCE = (payload: {id: string, update: Partial<Presence>}) => {
  if (!users[payload.id]) return;
  setUsers(payload.id, "presence", payload.update);
}

const SET_ALL_USER_PRESENCES = (presences: RawPresence[]) => {
  batch(() => {
    for (let index = 0; index < presences.length; index++) {
      const {userId, ...presence} = presences[index];
      if (!users[userId]) continue;
      setUsers(userId, "presence", reconcile(presence));
    }
  })
  
}

const actions = {
  ADD_USER,
  ADD_USERS,
  UPDATE_USER,
  UPDATE_USER_PRESENCE,
  SET_ALL_USER_PRESENCES
}


export const createUsersStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);
  
  const getUser = (id: string) => users[id];
  
  return {
    dispatch,
    get: getUser
  }

}