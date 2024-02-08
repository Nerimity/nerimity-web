import {createStore} from 'solid-js/store';
import { FriendStatus, RawFriend } from '../RawData';
import { acceptFriendRequest, removeFriend, addFriend } from '../services/FriendService';
import useUsers, { User } from './useUsers';



export type Friend = Omit<RawFriend, 'recipient'> & {
  recipientId: string;
  recipient: typeof recipient;
  accept: (this: Friend) => Promise<void>;
  remove: (this: Friend) => Promise<void>;
} 


const [friends, setFriends] = createStore<Record<string, Friend>>({});


const set = (friend: RawFriend) => {
  const users = useUsers();

  users.set(friend.recipient);


  const newFriend: Friend = {
    ...friend, 
    recipientId: friend.recipient.id,
    recipient,
    accept,
    remove
  }

  setFriends(friend.recipient.id, newFriend);
}

function recipient (this: Friend) {
  const users = useUsers();
  return users.get(this.recipientId);
}
async function remove(this: Friend) {
  await removeFriend({friendId: this.recipientId});
  setFriends(this.recipientId, undefined!);
}
async function accept(this: Friend) {
  await acceptFriendRequest({friendId: this.recipientId});
  setFriends(this.recipientId, 'status', FriendStatus.FRIENDS);
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
