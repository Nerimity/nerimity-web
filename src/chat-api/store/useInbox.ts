import {createStore} from 'solid-js/store';
import { RawInboxWithoutChannel, RawServer, RawServerMember } from '../RawData';
import useChannels, { Channel } from './useChannels';
import useUsers from './useUsers';

const channels = useChannels();

type Inbox = Omit<RawInboxWithoutChannel, 'channel'> & {
  channelId: string
  channel: Channel,
}


const [inbox, setInbox] = createStore<Record<string, Inbox>>({});


const set = (item: RawInboxWithoutChannel) => {
  channels.get(item.channel).recipient?.setInboxChannelId(item.channel);
  setInbox({[item.channel]: {
    ...item,
    channelId: item.channel,
    get channel() {return channels.get(this.channelId)},
  }});
}
const get = (userId: string) => {
  return inbox[userId];
}

const array = () => Object.values(inbox);

export default function useInbox() {
  return {
    array,
    get,
    set
  }
}