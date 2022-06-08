import { RawChannel, RawInboxWithoutChannel } from "../RawData";
import useChannels from "../store/useChannels";
import useInbox from "../store/useInbox";

const channels = useChannels();
const inbox = useInbox();

export const onInboxOpened = (payload: RawInboxWithoutChannel & {channel: RawChannel}) => {
  channels.set(payload.channel);
  inbox.set({...payload, channel: payload.channel._id});
}