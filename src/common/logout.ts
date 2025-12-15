import { clearCache } from "./localCache";
import { reactNativeAPI } from "./ReactNative";

export const logout = async (redirect = true) => {
  reactNativeAPI()?.logout();
  await clearCache();
  localStorage.clear();
  if (redirect) {
    location.href = "/";
  }
};
