import {createStore} from 'solid-js/store';
import { FriendStatus, RawFriend } from '../RawData';
import useUsers, { User } from './useUsers';


const users = useUsers();

export type Friend = Omit<RawFriend, 'recipient'> & {
  recipientId: string;
  recipient: User;
} 


const [friends, setFriends] = createStore<Record<string, Friend>>({});


const set = (friend: RawFriend) => {
  users.set(friend.recipient);

  setFriends({[friend.recipient._id]: {
    ...friend, 
    recipientId: friend.recipient._id,
    get recipient() {return users.get(this.recipientId)},
  }});
}

const get = (userId: string) => friends[userId]

const deleteFriend = (userId: string) => setFriends({[userId]: undefined})


const updateStatus = (userId: string, status: FriendStatus) => {
  if (!friends[userId]) return;
  setFriends(userId, 'status', status);
}


const array = () => Object.values(friends);

export default function useFriends() {
  return {
    array,
    get,
    set,
    delete: deleteFriend,
    updateStatus
  }
}



interface Test {
  _id: string;
  recipientId: string;
  test: string
}
