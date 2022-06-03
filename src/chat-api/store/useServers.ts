import {createStore} from 'solid-js/store';
import { RawServer } from '../RawData';

const [servers, setServers] = createStore<Record<string, RawServer>>({});


const set = (server: RawServer) => 
  setServers({
    ...servers,
    [server._id]: server
  });

const get = (serverId: string) => servers[serverId]

const array = () => Object.values(servers);

export default function useServers() {
  return {
    array,
    get,
    set
  }
}