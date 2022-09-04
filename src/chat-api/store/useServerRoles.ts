import { createStore } from "solid-js/store";
import { RawServerRole } from "../RawData";

export type ServerRole = RawServerRole & {

}

// serverRoles[serverId][roleId] = Role
const [serverRoles, setServerRoles] = createStore<Record<string, Record<string, ServerRole> | undefined>>({});


const set = (serverId: string, role: RawServerRole) =>  {
  if (!serverRoles[serverId]) {
    setServerRoles(serverId, {});
  }
  setServerRoles(serverId, role.id, role)
}

const getAllByServerId = (serverId: string) => {
  return Object.values(serverRoles[serverId] || {});
}

const deleteAllByServerId = (serverId: string) => {
  setServerRoles(serverId, undefined);
}


export default function useServerRoles() {
  return {
    set,
    getAllByServerId,
    deleteAllByServerId
  }
}