import { StorageKeys, useLocalStorage } from "./localStorage";

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

export const [favorites, setFavorites] = useLocalStorage<FavoritesMap>(
  StorageKeys.FAVORITE_GIFS,
  {}
);

export const favoritesStore = {
  add: (gif: FavoriteGif) => {
    const newFavorites = {
      ...favorites(),
      [gif.url]: gif
    };
    setFavorites(newFavorites);
  },
  remove: (url: string) => {
    const newFavorites = {
      ...favorites()
    };
    delete newFavorites[url];
    setFavorites(newFavorites);
  },
  isFavorite: (url: string) => {
    return !!favorites()[url];
  },
  getFavorites: () => {
    return Object.values(favorites());
  }
};
