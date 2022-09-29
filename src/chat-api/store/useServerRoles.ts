import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import { RawServerRole } from "../RawData";
import useServers from "./useServers";

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

const addNewRole = (serverId: string, role: RawServerRole) =>  {
  const servers = useServers();
  const server = servers.get(serverId);

  const roles = getAllByServerId(serverId);

  batch(() => {
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const newOrder = roles.length - i;
      if (server?.defaultRoleId === role?.id) continue;
      setServerRoles(serverId, role?.id!, 'order', newOrder + 1)
      
    }
    set(serverId, role);
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
  const serverRoles = getAllByServerId(serverId);
  batch(() => {
    for (let i = 0; i < serverRoles.length; i++) {
      const role = serverRoles[i];
      const newOrder = serverRoles.length - i;
      setServerRoles(serverId, role?.id!, 'order', newOrder);
    }
  })

  
}


export default function useServerRoles() {
  return {
    set,
    addNewRole,
    getAllByServerId,
    get,
    deleteRole,
    deleteAllByServerId
  }
}