import {createStore} from 'solid-js/store';
import { RawInboxWithoutChannel } from '../RawData';
import useChannels, { Channel } from './useChannels';
import useMention from './useMention';
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

const mentions = useMention();

const notificationCount = () => {
  const channels = useChannels();
  let count = 0;

  const mentionsArr = mentions.array();

  for (let i = 0; i < mentionsArr.length; i++) {
    const mention = mentionsArr[i];
    const channel = channels.get(mention?.channelId!);
    if (channel?.serverId) continue;
    count += mention?.count || 0
    
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