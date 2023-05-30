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
import socketClient from "../socketClient";



export function onMessageCreated(payload: {socketId: string, message: RawMessage}) {
  if (socketClient.id() === payload.socketId) return;
  const header = useHeader();
  const messages = useMessages();
  const channels = useChannels();
  const mentions = useMention();
  const users = useUsers();
  const account = useAccount();
  const channel = channels.get(payload.message.channelId);
  const {hasFocus} = useWindowProperties();

  const accountUser = account.user();


  batch(() => {

    channel?.updateLastMessaged(payload.message.createdAt);

    if (accountUser?.id === payload.message.createdBy.id) {
      channel?.updateLastSeen(payload.message.createdAt + 1);
    } 
    else if (!channel || channel.recipient) {
      const user = users.get(payload.message.createdBy.id);
      if (!user) {
        users.set(payload.message.createdBy);
      }
      
    }
    const mentionCount = () => mentions.get(payload.message.channelId)?.count || 0;

    const isMentioned = () => payload.message.mentions?.find(u => u.id === accountUser?.id)

    if (!channel?.serverId || isMentioned()) {
      mentions.set({
        channelId: payload.message.channelId,
        userId: payload.message.createdBy.id,
        count: mentionCount() + 1,
        serverId: channel?.serverId
      });
    }

    messages.pushMessage(payload.message.channelId, payload.message);
  })

  // only play notifications if: 
  //   it does not have focus (has focus)
  //   channel is not selected (is selected)
  if (payload.message.createdBy.id !== accountUser?.id) {
    const isChannelSelected = header.details().id === "MessagePane" && header.details().channelId === payload.message.channelId;
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


interface ReactionAddedPayload {
  messageId: string,
  channelId: string,
  count: number
  reactedByUserId: string,
  emojiId?: string,
  name: string,
  gif?: boolean,
}

export function onMessageReactionAdded(payload: ReactionAddedPayload) {
  const messages = useMessages();
  const account = useAccount();
  const reactedByMe = account.user()?.id === payload.reactedByUserId;
  messages.updateMessageReaction(payload.channelId, payload.messageId, {
    count: payload.count,
    name: payload.name,
    emojiId: payload.emojiId,
    gif: payload.gif,
    ...(reactedByMe? { reacted: true } : undefined)
  })
}