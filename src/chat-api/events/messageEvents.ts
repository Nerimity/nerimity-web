import { batch } from "solid-js";
import { RawMessage } from "../RawData";
import useAccount from "../store/useAccount";
import useChannels from "../store/useChannels";
import useMention from "../store/useMention";
import useMessages, { MessageSentStatus } from "../store/useMessages";
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

    channel?.updateLastMessaged(new Date(payload.createdAt).toISOString());

    if (user()?.id === payload.createdBy.id) {
      channel?.updateLastSeen(new Date(createdAt+1).toISOString());
    } 
    else if (!channel || channel.recipient) {
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

export function onMessageUpdated(payload: {channelId: string, messageId: string, updated: Partial<RawMessage>}) {
  const messages = useMessages();
  messages.updateLocalMessage({...payload.updated, sentStatus: undefined}, payload.channelId, payload.messageId);
}


export function onMessageDeleted(payload: {channelId: string, messageId: string}) {
  const messages = useMessages();
  messages.locallyRemoveMessage(payload.channelId, payload.messageId);
}