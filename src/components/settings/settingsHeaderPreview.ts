import { createStore } from "solid-js/store";

interface SettingsHeaderPreview {
  username?: string;
  tag?: string;
  banner?: string;
  bannerPoints?: number[];
  avatar?: any;
  avatarPoints?: number[];
}

export const [settingsHeaderPreview, setSettingsHeaderPreview] =
  createStore<SettingsHeaderPreview>({});
