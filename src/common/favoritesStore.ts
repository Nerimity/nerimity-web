import { makePersisted } from "@solid-primitives/storage";
import { createStore, produce } from "solid-js/store";

const STORAGE_KEY = "nerimity_favorite_gifs";

export interface FavoriteGif {
  url: string; 
  gifUrl: string;
  previewUrl: string;
  previewHeight: number;
  previewWidth: number;
}

// Map of URL -> FavoriteGif
type FavoritesMap = Record<string, FavoriteGif>;

export const [favorites, setFavorites] = makePersisted(
  createStore<FavoritesMap>({}),
  { name: STORAGE_KEY }
);

export const favoritesStore = {
  add: (gif: FavoriteGif) => {
    setFavorites(gif.url, gif);
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
