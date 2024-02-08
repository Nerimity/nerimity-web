import { createSignal } from "solid-js";
import { StorageKeys, getStorageString, setStorageString } from "./localStorage";
import { createStore, reconcile } from "solid-js/store";



const [lastSelected, set] = createStore(getLocalStorageLastSelectedServerChannelIds());


export function getLastSelectedChannelId (serverId: string, defaultChannelId?: string) {
  return lastSelected[serverId] || defaultChannelId;
}

function getLocalStorageLastSelectedServerChannelIds() {
  const stringEntries = getStorageString(StorageKeys.LAST_SELECTED_SERVER_CHANNELS, null);
  if (!stringEntries) return {};
  const obj = Object.fromEntries(JSON.parse(stringEntries));
  return obj || {};
}

export function setLastSelectedServerChannelId(serverId: string, channelId: string) {
  const stringObjEntries = getStorageString(StorageKeys.LAST_SELECTED_SERVER_CHANNELS, "[]");
  const entries: [string, string][] = JSON.parse(stringObjEntries);
  const index = entries.findIndex(([entryServerId]) => serverId === entryServerId);
  if (index >= 0) {
    entries[index] = [serverId, channelId];
  } else {
    entries.unshift([serverId, channelId]);
  }
  set(reconcile(Object.fromEntries(entries)))
  setStorageString(StorageKeys.LAST_SELECTED_SERVER_CHANNELS, JSON.stringify(entries.slice(0, 20)))
}