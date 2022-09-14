import { update } from 'idb-keyval';
import { mapArray } from 'solid-js';
import {createStore, reconcile} from 'solid-js/store';
import { RawServerMember } from '../RawData';
import { ServerRole } from './useServerRoles';
import useServers from './useServers';
import useStore from './useStore';
import useUsers, { User } from './useUsers';


export type ServerMember = Omit<RawServerMember, 'user'> & {
  userId: string
  user: User
  update: (this: ServerMember, update: Partial<ServerMember>) => void;
  roles: () => (ServerRole | undefined)[] ;
  hasRole:  (this: ServerMember, roleId: string) => boolean;
}

const [serverMembers, setMember] = createStore<Record<string, Record<string, ServerMember | undefined> | undefined>>({});

const users = useUsers();

const set = (member: RawServerMember) => {
  users.set(member.user);
  if (!serverMembers[member.serverId]) {
    setMember(member.serverId, {});
  }
  setMember(member.serverId, {[member.user.id]: {
    ...member,
    userId: member.user.id,
    get user() {
      return users.get(member.user.id);
    },
    update(updated) {
      setMember(this.serverId, this.userId, updated);
    },
    get roles(){
      const roleIds = () => this.roleIds;
      return mapArray(roleIds, id => {
        const {serverRoles} = useStore();
        return serverRoles.get(member.serverId, id);
      })
    },
    hasRole(roleId) {
      const servers = useServers();
      const server = servers.get(member.serverId);
      if (server?.defaultRoleId === roleId) return true;
      return this.roleIds.includes(roleId);
    }
  }});
}

const remove = (serverId: string, userId: string) => {
  setMember(serverId, userId, undefined);
}

const removeAllServerMembers = (serverId: string) => {
  setMember(serverId, undefined);
}

const array = (serverId: string) => Object.values(serverMembers?.[serverId] || []);
const get = (serverId: string, userId: string) => serverMembers[serverId]?.[userId];

export default function useServerMembers() {
  return {
    array,
    set,
    remove,
    removeAllServerMembers,
    get
  }
}