import { RawInboxWithoutChannel, RawServerRole } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore, reconcile } from "solid-js/store";
import { batch } from "solid-js";

type ServerRole = {
} & RawServerRole

const [roles, setRoles] = createStore<Record<string, ServerRole>>({});


const ADD_SERVER_ROLES = (roles: ServerRole[]) => {
  batch(() => {
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      setRoles(role.id, reconcile(role));
    }
  })
}
const ADD_SERVER_ROLE = (role: ServerRole) => {
  setRoles(role.id, reconcile(role));
}


const actions = {
  ADD_SERVER_ROLES,
  ADD_SERVER_ROLE
}


export const createServerRolesStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);  

  
  return {
    dispatch,

  }

}