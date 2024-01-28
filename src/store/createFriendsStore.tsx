import { FriendStatus, RawFriend } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore, reconcile } from "solid-js/store";
import { batch } from "solid-js";


type Friend = {
  recipientId: string;
} & Omit<RawFriend, 'recipient'>;

const [friends, setFriends] = createStore<Record<string, Friend>>({});

const SET_FRIENDS = (friends: Friend[]) => {
  batch(() => {
    for (let i = 0; i < friends.length; i++) {
      const friend = friends[i];
      setFriends(friend.recipientId, reconcile(friend));
    }
  })
}

const SET_FRIEND = (friend: Friend) => {
  setFriends(friend.recipientId, reconcile(friend));
}

const DELETE_FRIEND = (friendId: string) => {
  setFriends(friendId, undefined);
}

const UPDATE_FRIEND_STATUS = (payload: {friendId: string, status: FriendStatus}) => {
  setFriends(payload.friendId, "status", payload.status);
}

const actions = {
  SET_FRIENDS,
  DELETE_FRIEND,
  UPDATE_FRIEND_STATUS,
  SET_FRIEND
}


export const createFriendsStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);

  const setFriends = async (friends: RawFriend[]) => {
    dispatch("SET_FRIENDS", friends.map(({recipient, ...rest}) => {
      return {...rest, recipientId: recipient.id};
    }))
  }
  
  
  return {
    dispatch,
    setFriends
  }

}