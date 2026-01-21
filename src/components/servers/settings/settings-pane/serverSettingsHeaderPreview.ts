import { createStore } from "solid-js/store";

interface ServerSettingsHeaderPreview {
  name?: string;
  avatar?: string;
  avatarPoints?: number[];
  banner?: string;
  bannerPoints?: number[];
}

export const [serverSettingsHeaderPreview, setServerSettingsHeaderPreview] =
  createStore<ServerSettingsHeaderPreview>({});
