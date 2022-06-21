import { RawMessage } from "../RawData";
import useAccount from "../store/useAccount";
import useChannels from "../store/useChannels";
import useMessages from "../store/useMessages";




export function onMessageCreated(payload: RawMessage) {
  const messages = useMessages();
  const channels = useChannels();
  const {user} = useAccount();
  const channel = channels.get(payload.channel);
  channel.updateLastMessaged(payload.createdAt);

  if (user()?._id === payload.createdBy._id) {
    channel.updateLastSeen(payload.createdAt+1);
  }

  messages.pushMessage(payload.channel, payload);
}

export function onMessageDeleted(payload: {channelId: string, messageId: string}) {
  const messages = useMessages();
  messages.locallyRemoveMessage(payload.channelId, payload.messageId);
}