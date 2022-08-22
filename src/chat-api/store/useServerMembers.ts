import {createStore} from 'solid-js/store';
import { RawServerMember } from '../RawData';
import useUsers, { User } from './useUsers';

export type ServerMember = Omit<RawServerMember, 'user'> & {
  userId: string
  user: User
}

const [serverMembers, setMember] = createStore<Record<string, Record<string, ServerMember | undefined> | undefined>>({});

const users = useUsers();

const set = (member: RawServerMember) => {
  users.set(member.user);
  if (!serverMembers[member.serverId]) {
    setMember(member.serverId, {});
  }
  setMember(member.serverId, member.user.id, {
    ...member,
    userId: member.user.id,
    get user() {
      return users.get(member.user.id);
    }
  });
}

const remove = (serverId: string, userId: string) => {
  setMember(serverId, userId, undefined);
}

const removeAllServerMembers = (serverId: string) => {
  setMember(serverId, undefined);
}

const array = (serverId: string) => Object.values(serverMembers?.[serverId] || []);

export default function useServerMembers() {
  return {
    array,
    set,
    remove,
    removeAllServerMembers
  }
}