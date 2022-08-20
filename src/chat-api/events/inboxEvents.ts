import { RawChannel, RawInboxWithoutChannel } from "../RawData";
import useChannels from "../store/useChannels";
import useInbox from "../store/useInbox";


export const onInboxOpened = (payload: RawInboxWithoutChannel & {channel: RawChannel}) => {
  const channels = useChannels();
  const inbox = useInbox();
  channels.set(payload.channel);
  inbox.set({...payload, channelId: payload.channel.id});
}