import { RawFriend } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore } from "solid-js/store";


type Friend = {
  recipientId: string;
} & Omit<RawFriend, 'recipient'>;

const [friends, setFriends] = createStore<Record<string, Friend>>({});


const actions = {

}


export const createFriendsStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);
  
  
  return {
    dispatch
  }

}