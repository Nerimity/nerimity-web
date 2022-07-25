import {createStore} from 'solid-js/store';
import { RawServerMember } from '../RawData';
import useUsers, { User } from './useUsers';

export type ServerMember = Omit<RawServerMember, 'user'> & {
  userId: string
  user: User
}

const [serverMembers, setMember] = createStore<Record<string, Record<string, ServerMember>>>({});

const users = useUsers();

const set = (member: RawServerMember) => {
  users.set(member.user);
  if (!serverMembers[member.server]) {
    setMember(member.server, {});
  }
  setMember(member.server, member.user._id, {
    ...member,
    userId: member.user._id,
    get user() {
      return users.get(member.user._id);
    }
  });
}

const array = (serverId: string) => Object.values(serverMembers?.[serverId] || []);

export default function useServerMembers() {
  return {
    array,
    set
  }
}