import { Socket } from "socket.io-client";
import { ContextStore } from "../store";
import { RawChannel, RawInboxWithoutChannel } from "@/chat-api/RawData";
import { batch } from "solid-js";
import { ServerEvents } from "@/chat-api/EventNames";



const registerInboxEvents = (socket: Socket, state: ContextStore) => {
  
  const onInboxOpened = (payload: RawInboxWithoutChannel & {channel: RawChannel}) => {
    const {channel, recipient} = payload;
    batch(() => {
      state.channels.dispatch("SET_CHANNEL", {
        ...channel,
        lastSeen: payload.lastSeen,
      })
      state.inbox.addInbox(payload);
      state.users.dispatch("UPDATE_USER", {id: recipient.id, user: {inboxChannelId: channel.id} })
    })
  }
  const onInboxClosed = (payload: {channelId: string}) => {

    const channel = state.channels.get(payload.channelId)!

    batch(() => {
      state.inbox.dispatch("DELETE_INBOX", payload.channelId);
      if (channel.recipientId) {
        state.users.dispatch("UPDATE_USER", {id: channel.recipientId, user: {inboxChannelId: undefined} })
      }
      state.channels.dispatch("DELETE_CHANNEL", payload.channelId);
    })
    
  }

  socket.on(ServerEvents.INBOX_OPENED, onInboxOpened);
  socket.on(ServerEvents.INBOX_CLOSED, onInboxClosed);
  
};



export {
  registerInboxEvents
}
