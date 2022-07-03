import {createStore} from 'solid-js/store';
import { RawInboxWithoutChannel } from '../RawData';
import useChannels, { Channel } from './useChannels';
import useUsers from './useUsers';


export type Inbox = Omit<RawInboxWithoutChannel, 'channel'> & {
  channelId: string
  channel: Channel,
}


const [inbox, setInbox] = createStore<Record<string, Inbox>>({});


const set = (item: RawInboxWithoutChannel) => {
  const channels = useChannels();
  const channel = channels.get(item.channel);
  const user = useUsers();
  user.set(item.recipient);
  channel.setRecipientId(item.recipient._id);
  channel.recipient?.setInboxChannelId(item.channel);
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

const notificationCount = () => {
  let count = 0;
  for (const item of array()) {
    const user = item.channel.recipient;
    if (user?.mentionCount) {
      count += user.mentionCount;
    }
  }
  return count;
}

export default function useInbox() {
  return {
    array,
    get,
    set,
    notificationCount
  }
}