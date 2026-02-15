import { createEffect, on } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { getStorageObject, setStorageObject, StorageKeys } from "./localStorage";

export interface FavoriteGif {
  url: string; 
  gifUrl: string;
  previewUrl: string;
  previewHeight: number;
  previewWidth: number;
  tags?: string[];
}

// Map of URL -> FavoriteGif
type FavoritesMap = Record<string, FavoriteGif>;

export const [favorites, setFavorites] = createStore<FavoritesMap>(
  getStorageObject(StorageKeys.FAVORITE_GIFS, {})
);

createEffect(on(
  () => JSON.stringify(favorites),
  () => setStorageObject(StorageKeys.FAVORITE_GIFS, favorites),
  { defer: true }
));

export const favoritesStore = {
  add: (gif: FavoriteGif) => {
    setFavorites(gif.url, (prev) => {
      const tags = [...(prev?.tags || [])];
      if (gif.tags) {
        for (const tag of gif.tags) {
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        }
      }
      return { ...gif, tags };
    });
  },
  remove: (url: string) => {
    setFavorites(produce((s) => {
      delete s[url];
    }));
  },
  isFavorite: (url: string) => {
    return !!favorites[url];
  },
  getFavorites: () => {
    return Object.values(favorites);
  },
};
