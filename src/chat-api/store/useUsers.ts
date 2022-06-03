import {createStore} from 'solid-js/store';
import { RawUser } from '../RawData';

const [users, setUsers] = createStore<Record<string, RawUser>>({});


const set = (user: RawUser) => 
  setUsers({
    ...users,
    [user._id]: user
  });

const get = (serverId: string) => users[serverId]

const array = () => Object.values(users);

export default function useUsers() {
  return {
    array,
    get,
    set
  }
}