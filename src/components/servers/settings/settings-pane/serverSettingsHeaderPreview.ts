import { createStore } from "solid-js/store";

interface ServerSettingsHeaderPreview {
  name?: string;
  avatar?: string | null;
  avatarPoints?: number[];
  banner?: string | null;
  bannerPoints?: number[];
}

export const [serverSettingsHeaderPreview, setServerSettingsHeaderPreview] =
  createStore<ServerSettingsHeaderPreview>({});
