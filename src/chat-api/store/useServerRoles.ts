import { createStore } from "solid-js/store";
import { RawServerRole } from "../RawData";

export type ServerRole = RawServerRole & {

}

// serverRoles[serverId][roleId] = Role
const [serverRoles, setServerRoles] = createStore<Record<string, Record<string, ServerRole>>>({});


const set = (serverId: string, role: RawServerRole) =>  {
  setServerRoles(serverId, role.id, role)
}

const getAllByServerId = (serverId: string) => {
  return Object.values(serverRoles[serverId] || {});
}


export default function useServerRoles() {
  return {
    set,
    getAllByServerId
  }
}