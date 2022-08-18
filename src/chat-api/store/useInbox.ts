import {createStore} from 'solid-js/store';
import { RawInboxWithoutChannel } from '../RawData';
import useChannels, { Channel } from './useChannels';
import useUsers from './useUsers';


export type Inbox = RawInboxWithoutChannel & {
  channel: Channel,
}


const [inbox, setInbox] = createStore<Record<string, Inbox>>({});


const set = (item: RawInboxWithoutChannel) => {
  const channels = useChannels();
  const channel = channels.get(item.channelId)!;
  const user = useUsers();
  user.set(item.recipient);
  channel.setRecipientId(item.recipient.id);
  channel.recipient?.setInboxChannelId(item.channelId);
  setInbox({[item.channelId]: {
    ...item,
    get channel() {
      return channels.get(item.channelId)!
    },
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