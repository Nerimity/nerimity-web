import { FriendStatus, RawFriend } from "../RawData"
import useFriends from "../store/useFriends"


const friends = useFriends();

export const onFriendRequestSent = (payload: RawFriend) => {
  friends.set(payload);
}

export const onFriendRequestPending = (payload: RawFriend) => {
  friends.set(payload);
}

export const onFriendRequestAccepted = (payload: {friendId: string}) => {
  friends.updateStatus(payload.friendId, FriendStatus.FRIENDS);
}

export const onFriendRemoved = (payload: {friendId: string}) => {
  friends.delete(payload.friendId);
}