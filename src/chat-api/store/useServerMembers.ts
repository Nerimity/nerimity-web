import {createStore} from 'solid-js/store';
import { RawServer, RawServerMember } from '../RawData';
import useUsers from './useUsers';

export type ServerMember = Omit<RawServerMember, 'user'> & {
  user: string
}

const [serverMembers, setMember] = createStore<Record<string, Record<string, ServerMember>>>({});

const users = useUsers();

const set = (member: RawServerMember) => {
  users.set(member.user);
  if (!serverMembers[member.server]) {
    setMember(member.server, {});
  }
  setMember(member.server, member.user._id, {...member, user: member.user._id});
}

const array = (serverId: string) => Object.values(serverMembers?.[serverId] || []);

export default function useServerMembers() {
  return {
    array,
    set
  }
}