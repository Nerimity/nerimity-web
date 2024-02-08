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
import { createDesktopNotification } from "@/common/desktopNotification";
import useServerMembers from "../store/useServerMembers";
import { ROLE_PERMISSIONS } from "../Bitwise";



export function onMessageCreated(payload: {socketId: string, message: RawMessage}) {
  if (socketClient.id() === payload.socketId) return;
  const header = useHeader();
  const messages = useMessages();
  const channels = useChannels();
  const mentions = useMention();
  const members = useServerMembers();
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
    else if (!channel || channel.recipient()) {
      const user = users.get(payload.message.createdBy.id);
      if (!user) {
        users.set(payload.message.createdBy);
      }
      
    }

    const mentionCount = () => mentions.get(payload.message.channelId)?.count || 0;

    const isMentioned = () => {
      const everyoneMentioned = payload.message.content?.includes("[@:e]");
      if (everyoneMentioned && channel?.serverId) {
        const member = members.get(channel.serverId, payload.message.createdBy.id);
        const hasPerm = member?.isServerCreator() || member?.hasPermission(ROLE_PERMISSIONS.MENTION_EVERYONE);
        if (hasPerm) return true;
      }
      const mention = payload.message.mentions?.find(u => u.id === accountUser?.id);
      if (mention) return true;
      const quoteMention = payload.message.quotedMessages?.find(m => m.createdBy?.id === accountUser?.id);
      return quoteMention;
    };
    
    if (payload.message.createdBy.id !== accountUser?.id) {
  
      if (!channel?.serverId || isMentioned()) {
        mentions.set({
          channelId: payload.message.channelId,
          userId: payload.message.createdBy.id,
          count: mentionCount() + 1,
          serverId: channel?.serverId
        });
      }
    }

    messages.pushMessage(payload.message.channelId, payload.message);
  });

  // only play notifications if: 
  //   it does not have focus (has focus)
  //   channel is not selected (is selected)
  if (payload.message.createdBy.id !== accountUser?.id) {
    const isChannelSelected = header.details().id === "MessagePane" && header.details().channelId === payload.message.channelId;
    if (hasFocus() && isChannelSelected) return;
    playMessageNotification({message: payload.message, serverId: channel?.serverId});
    createDesktopNotification(payload.message);
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
    emojiId: payload.emojiId || null,
    gif: payload.gif,
    ...(reactedByMe? { reacted: true } : undefined)
  });
}
interface ReactionRemovedPayload {
  messageId: string,
  channelId: string,
  count: number
  reactionRemovedByUserId: string,
  emojiId?: string,
  name: string,
}

export function onMessageReactionRemoved(payload: ReactionRemovedPayload) {
  const messages = useMessages();
  const account = useAccount();
  const reactionRemovedByMe = account.user()?.id === payload.reactionRemovedByUserId;
  messages.updateMessageReaction(payload.channelId, payload.messageId, {
    count: payload.count,
    name: payload.name,
    emojiId: payload.emojiId,
    ...(reactionRemovedByMe ? { reacted: false } : undefined)
  });
}