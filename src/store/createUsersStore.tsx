import { ActivityStatus, RawUser } from "@/chat-api/RawData";
import { StoreContext } from "./store";
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

const ADD_USERS = (users: User[], state: () => StoreContext) => {
  batch(() => {
    for (let index = 0; index < users.length; index++) {
      const user = users[index];
      state().users.dispatch("ADD_USER", user);
    }
  })
}

const UPDATE_USER = (payload: {id: string, user: Partial<User>}) => {
  setUsers(payload.id, payload.user);
}

const UPDATE_USER_PRESENCE = (payload: {id: string, update: Partial<Presence>}) => {
  if (!users[payload.id]) return;
  setUsers(payload.id, "presence", payload.update);
}

const actions = {
  ADD_USER,
  ADD_USERS,
  UPDATE_USER,
  UPDATE_USER_PRESENCE
}


export const createUsersStore = (state: () => StoreContext) => {  
  const dispatch = createDispatcher(actions, state);
  
  const getUser = (id: string) => users[id];
  

  
  return {
    dispatch,
    get: getUser
  }

}