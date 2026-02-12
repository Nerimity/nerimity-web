import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";

const STORAGE_KEY = "nerimity_favorite_gifs";

export interface FavoriteGif {
  url: string; // The preview URL from Tenor
  dims: { width: number; height: number };
}

// Map of URL -> FavoriteGif
type FavoritesMap = Record<string, FavoriteGif>;

function getStoredFavorites(): FavoritesMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to load favorites from localStorage", e);
    return {};
  }
}

export const [favorites, setFavorites] = createStore<FavoritesMap>(
  getStoredFavorites()
);

// Subscribe to changes and update localStorage
createEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error("Failed to save favorites to localStorage", e);
  }
});

export const favoritesStore = {
  add: (gif: FavoriteGif) => {
    setFavorites(gif.url, gif);
  },
  remove: (url: string) => {
    setFavorites(url, undefined!);
  },
  isFavorite: (url: string) => {
    return !!favorites[url];
  },
  getFavorites: () => {
    return Object.values(favorites);
  },
};
