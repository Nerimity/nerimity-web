import { RawInboxWithoutChannel } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore, reconcile } from "solid-js/store";
import { batch } from "solid-js";

type Inbox = {
  recipientId: string
} & Omit<RawInboxWithoutChannel, 'recipient'>;

const [inbox, setInbox] = createStore<Record<string, Inbox>>({});


const ADD_INBOXES = (inboxes: Inbox[]) => {
  batch(() => {
    for (let i = 0; i < inboxes.length; i++) {
      const inbox = inboxes[i];
      setInbox(inbox.channelId, reconcile(inbox));
    }
  })
}

const SET_INBOX = (inbox: Inbox) => {
  setInbox(inbox.channelId, reconcile(inbox));
}

const DELETE_INBOX = (channelId: string) => {
  setInbox(channelId, undefined);
}


const actions = {
  SET_INBOX,
  ADD_INBOXES,
  DELETE_INBOX
}


export const createInboxStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);  



  const addInboxes = (inboxes: RawInboxWithoutChannel[]) => {
    batch(() => {
      state.users.dispatch("ADD_USERS", inboxes.map(({recipient}) => recipient));
      dispatch("ADD_INBOXES", inboxes.map(({recipient, ...rest}) => {
        return {...rest, recipientId: recipient.id};
      }))
    })
  }

  const addInbox = (inbox: RawInboxWithoutChannel) => {
    state.users.dispatch("UPSERT_USER", inbox.recipient);
    dispatch("SET_INBOX", {
      ...inbox,
      recipientId: inbox.recipient.id
    })
  }

  
  return {
    dispatch,
    addInboxes,
    addInbox
  }

}