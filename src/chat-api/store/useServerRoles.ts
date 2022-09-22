import { createStore } from "solid-js/store";
import { RawServerRole } from "../RawData";

export type ServerRole = RawServerRole & {
  update: (this: ServerRole, update: Partial<RawServerRole>) => void;

}

// serverRoles[serverId][roleId] = Role
const [serverRoles, setServerRoles] = createStore<Record<string, Record<string, ServerRole | undefined> | undefined>>({});


const set = (serverId: string, role: RawServerRole) =>  {
  if (!serverRoles[serverId]) {
    setServerRoles(serverId, {});
  }
  setServerRoles(serverId, role.id, {
    ...role,
    update(update) {
      setServerRoles(serverId, role.id, update)
    }
  })
}


const getAllByServerId = (serverId: string) => {
  return Object.values(serverRoles[serverId] || {}).sort((a, b) =>  b!.order - a!.order);
}

const get = (serverId: string, roleId: string) => serverRoles[serverId]?.[roleId];

const deleteAllByServerId = (serverId: string) => {
  setServerRoles(serverId, undefined);
}

const deleteRole = (serverId: string, roleId: string) => {
  setServerRoles(serverId, roleId, undefined);
}


export default function useServerRoles() {
  return {
    set,
    getAllByServerId,
    get,
    deleteRole,
    deleteAllByServerId
  }
}