import { batch } from "solid-js";
import { RawMessage } from "../RawData";
import useAccount from "../store/useAccount";
import useChannels from "../store/useChannels";
import useMessages from "../store/useMessages";




export function onMessageCreated(payload: RawMessage) {
  const messages = useMessages();
  const channels = useChannels();
  const {user} = useAccount();
  const channel = channels.get(payload.channel);


  batch(() => {
    channel.updateLastMessaged(payload.createdAt);

    if (user()?._id === payload.createdBy._id) {
      channel.updateLastSeen(payload.createdAt+1);
    }

    if (channel.recipient) {
      const mentionCount = (channel.recipient.mentionCount || 0) + 1;
      channel.recipient.updateMentionCount(mentionCount);
    }

    messages.pushMessage(payload.channel, payload);
  })
}

export function onMessageDeleted(payload: {channelId: string, messageId: string}) {
  const messages = useMessages();
  messages.locallyRemoveMessage(payload.channelId, payload.messageId);
}