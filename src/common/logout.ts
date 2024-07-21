import { clearCache } from "./localCache";
import { reactNativeAPI } from "./ReactNative";

export const logout = async () => {
  reactNativeAPI()?.logout();
  await clearCache();
  localStorage.clear();
  location.href = "/";
};
