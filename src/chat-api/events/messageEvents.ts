import { playMessageNotification } from "@/common/Sound";
import { useWindowProperties } from "@/common/useWindowProperties";
import { batch } from "solid-js";
import { RawMessage } from "../RawData";
import useAccount from "../store/useAccount";
import useChannels from "../store/useChannels";
import useHeader from "../store/useHeader";
import useMention from "../store/useMention";
import useMessages, { MessageSentStatus } from "../store/useMessages";
import useUsers from "../store/useUsers";



export function onMessageCreated(payload: RawMessage) {
  const header = useHeader();
  const messages = useMessages();
  const channels = useChannels();
  const mentions = useMention();
  const users = useUsers();
  const account = useAccount();
  const channel = channels.get(payload.channelId);
  const {hasFocus} = useWindowProperties();

  const accountUser = account.user();


  batch(() => {

    channel?.updateLastMessaged(payload.createdAt);

    if (accountUser?.id === payload.createdBy.id) {
      channel?.updateLastSeen(payload.createdAt + 1);
    } 
    else if (!channel || channel.recipient) {
      const user = users.get(payload.createdBy.id);
      if (!user) {
        users.set(payload.createdBy);
      }
      
    }
    const mentionCount = () => mentions.get(payload.channelId)?.count || 0;

    const isMentioned = () => payload.mentions?.find(u => u.id === accountUser?.id)

    if (!channel?.serverId || isMentioned()) {
      mentions.set({
        channelId: payload.channelId,
        userId: payload.createdBy.id,
        count: mentionCount() + 1,
        serverId: channel?.serverId
      });
    }

    messages.pushMessage(payload.channelId, payload);
  })

  // only play notifications if: 
  //   it does not have focus (has focus)
  //   channel is not selected (is selected)
  if (payload.createdBy.id !== accountUser?.id) {
    const isChannelSelected = header.details().id === "MessagePane" && header.details().channelId === payload.channelId;
    if (hasFocus() && isChannelSelected) return;
    playMessageNotification();
  }

}

export function onMessageUpdated(payload: {channelId: string, messageId: string, updated: Partial<RawMessage>}) {
  const messages = useMessages();
  messages.updateLocalMessage({...payload.updated, sentStatus: undefined}, payload.channelId, payload.messageId);
}


export function onMessageDeleted(payload: {channelId: string, messageId: string}) {
  const messages = useMessages();
  messages.locallyRemoveMessage(payload.channelId, payload.messageId);
}