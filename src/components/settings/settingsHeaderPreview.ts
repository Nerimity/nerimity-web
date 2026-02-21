import { createStore } from "solid-js/store";

interface SettingsHeaderPreview {
  username?: string;
  tag?: string;
  banner?: string | null;
  bannerPoints?: number[];
  avatar?: string | null;
  avatarPoints?: number[];
}

export const [settingsHeaderPreview, setSettingsHeaderPreview] =
  createStore<SettingsHeaderPreview>({});
