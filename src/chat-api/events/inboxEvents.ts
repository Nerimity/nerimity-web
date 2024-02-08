import { batch } from "solid-js";
import { RawChannel, RawInboxWithoutChannel } from "../RawData";
import useChannels from "../store/useChannels";
import useInbox from "../store/useInbox";


export const onInboxOpened = (payload: RawInboxWithoutChannel & {channel: RawChannel}) => {
  const channels = useChannels();
  const inbox = useInbox();
  batch(() => {
    channels.set({...payload.channel, lastSeen: payload.lastSeen});
    inbox.set({...payload, channelId: payload.channel.id});
  })
}
export const onInboxClosed = (payload: {channelId: string}) => {
  const channels = useChannels();
  const inbox = useInbox();
  const channel = channels.get(payload.channelId);
  batch(() => {
    inbox.removeInbox(payload.channelId);
    channel?.recipient()?.setInboxChannelId(undefined);
    channels.deleteChannel(payload.channelId)

  })
}