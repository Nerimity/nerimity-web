import { userLogout } from "@/chat-api/services/UserService";
import { clearCache } from "./localCache";
import { reactNativeAPI } from "./ReactNative";

export const logout = async (redirect = true, keepCache = false) => {
  reactNativeAPI()?.logout();

  userLogout();

  if (!keepCache) {
    await clearCache();
    localStorage.clear();
  }
  localStorage.removeItem("userToken");
  if (redirect) {
    location.href = "/";
  }
};
