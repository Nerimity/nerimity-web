import { RawChannel, RawInboxWithoutChannel } from "@/chat-api/RawData";
import { ContextStore } from "./store";
import { createDispatcher } from "./createDispatcher";
import { createStore, reconcile } from "solid-js/store";
import { batch } from "solid-js";

export type Channel = {
  recipientId?: string;
  lastSeen?: number;
  callJoinedAt?: number;
} & Omit<RawChannel, 'recipient'>

const [channels, setChannels] = createStore<Record<string, Channel>>({});


const ADD_CHANNELS = (channels: Channel[]) => {
  batch(() => {
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      setChannels(channel.id, reconcile(channel));
    }
  })
}

const SET_CHANNEL = (channel: Channel) => {
  setChannels(channel.id, reconcile(channel));
}

const DELETE_CHANNEL = (channelId: string) => {
  setChannels(channelId, undefined);
}


const actions = {
  SET_CHANNEL,
  ADD_CHANNELS,
  DELETE_CHANNEL
}


export const createChannelsStore = (state: ContextStore) => {  
  const dispatch = createDispatcher(actions, state);  

  const getChannel = (channelId: string) => {
    return channels[channelId];
  }

  return {
    dispatch,
    get: getChannel,
  }
}