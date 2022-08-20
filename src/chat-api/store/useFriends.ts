import {createStore} from 'solid-js/store';
import { FriendStatus, RawFriend } from '../RawData';
import { acceptFriendRequest, removeFriend, addFriend } from '../services/FriendService';
import useUsers, { User } from './useUsers';


const users = useUsers();

export type Friend = Omit<RawFriend, 'recipient'> & {
  recipientId: string;
  recipient: User;
  acceptFriendRequest: (this: Friend) => Promise<void>;
  removeFriend: (this: Friend) => Promise<void>;
} 


const [friends, setFriends] = createStore<Record<string, Friend>>({});


const set = (friend: RawFriend) => {
  users.set(friend.recipient);

  setFriends({[friend.recipient.id]: {
    ...friend, 
    recipientId: friend.recipient.id,
    get recipient() {return users.get(this.recipientId)},
    async acceptFriendRequest() {
      await acceptFriendRequest({friendId: this.recipientId});
      setFriends(this.recipientId, 'status', FriendStatus.FRIENDS);
    },
    async removeFriend() {
      await removeFriend({friendId: this.recipientId});
      setFriends({[this.recipientId]: undefined})
    }
  }});
}

const get = (userId: string) => friends[userId]

const deleteFriend = (userId: string) => setFriends({[userId]: undefined})


const updateStatus = (userId: string, status: FriendStatus) => {
  if (!friends[userId]) return;
  setFriends(userId, 'status', status);
}

const sendRequest = async (username: string, tag: string) => {
  const friend = await addFriend({username, tag});
}


const array = () => Object.values(friends);

export default function useFriends() {
  return {
    array,
    get,
    set,
    delete: deleteFriend,
    updateStatus,
    sendRequest
  }
}



interface Test {
  id: string;
  recipientId: string;
  test: string
}
