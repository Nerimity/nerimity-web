import { set, get } from "idb-keyval";


export enum LocalCacheKey {
  Account = "account",
}

export function saveCache(name: LocalCacheKey, data: any) {
  set(name, JSON.parse(JSON.stringify(data)));
}

export function getCache(name: LocalCacheKey) {
  return get(name);
}