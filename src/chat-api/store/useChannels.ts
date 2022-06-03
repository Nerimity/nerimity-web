import {createStore} from 'solid-js/store';
import { RawChannel } from '../RawData';
import useUsers from './useUsers';

export type Channel = Omit<RawChannel, 'recipients'> & {
  recipients?: string[]
}


const [channels, setChannels] = createStore<Record<string, Channel>>({});

const users = useUsers();

const set = (channel: RawChannel) => {
  const recipientIds = channel.recipients?.map(recipient => {
    users.set(recipient);
    return recipient._id
  });
  setChannels({
    ...channels,
    [channel._id]: {...channel, recipients: recipientIds}
  });
}

const get = (channelId: string) => channels[channelId]

const array = () => Object.values(channels);

const getChannelsByServerId = (serverId: string) => array().filter(channel => channel.server === serverId);

export default function useChannels() {
  return {
    array,
    getChannelsByServerId,
    get,
    set
  }
}