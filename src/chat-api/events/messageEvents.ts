import { batch } from "solid-js";
import { RawMessage } from "../RawData";
import useAccount from "../store/useAccount";
import useChannels from "../store/useChannels";
import useMention from "../store/useMention";
import useMessages from "../store/useMessages";
import useUsers from "../store/useUsers";



export function onMessageCreated(payload: RawMessage) {
  const messages = useMessages();
  const channels = useChannels();
  const mentions = useMention();
  const users = useUsers();
  const {user} = useAccount();
  const channel = channels.get(payload.channelId);

  const createdAt = new Date(payload.createdAt).getTime();


  batch(() => {

    channel?.updateLastMessaged(createdAt);

    if (user()?.id === payload.createdBy.id) {
      channel?.updateLastSeen(createdAt+1);
    }

    if (!channel || channel.recipient) {
      const user = users.get(payload.createdBy.id);
      if (!user) {
        users.set(payload.createdBy);
      }
      const mentionCount = mentions.get(payload.channelId)?.count || 1;
      mentions.set({
        channelId: payload.channelId,
        userId: payload.createdBy.id,
        count: mentionCount
      });

    }

    messages.pushMessage(payload.channelId, payload);
  })
}

export function onMessageDeleted(payload: {channelId: string, messageId: string}) {
  const messages = useMessages();
  messages.locallyRemoveMessage(payload.channelId, payload.messageId);
}