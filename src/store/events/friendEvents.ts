import { Socket } from "socket.io-client";
import { ContextStore } from "../store";
import { FriendStatus, RawFriend } from "@/chat-api/RawData";
import { batch } from "solid-js";
import { ServerEvents } from "@/chat-api/EventNames";



const registerFriendEvents = (socket: Socket, state: ContextStore) => {
  
  const onFriendRequestSent = (payload: RawFriend) => {
    const {recipient, ...friend} = payload;
    batch(() => {
      state.users.dispatch("UPSERT_USER", recipient);
      state.friends.dispatch("SET_FRIEND", {...friend, recipientId: recipient.id});
    })
  }
  
  const onFriendRequestPending = (payload: RawFriend) => {
    const {recipient, ...friend} = payload;
    batch(() => {
      state.users.dispatch("UPSERT_USER", recipient);
      state.friends.dispatch("SET_FRIEND", {...friend, recipientId: recipient.id});
    })
  }
  
  const onFriendRequestAccepted = (payload: {friendId: string}) => {
    state.friends.dispatch("UPDATE_FRIEND_STATUS", {friendId: payload.friendId, status: FriendStatus.FRIENDS});
  }
  
  const onFriendRemoved = (payload: {friendId: string}) => {
    state.friends.dispatch("DELETE_FRIEND", payload.friendId);
  }

  socket.on(ServerEvents.FRIEND_REQUEST_SENT, onFriendRequestSent);
  socket.on(ServerEvents.FRIEND_REQUEST_PENDING, onFriendRequestPending);
  socket.on(ServerEvents.FRIEND_REQUEST_ACCEPTED, onFriendRequestAccepted);
  socket.on(ServerEvents.FRIEND_REMOVED, onFriendRemoved);
  
};



export {
  registerFriendEvents
}
