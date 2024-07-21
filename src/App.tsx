import { lazy, onMount, Show } from "solid-js";

import { getCurrentLanguage, getLanguage } from "./locales/languages";
import { useTransContext } from "@mbarzda/solid-i18next";
import { electronWindowAPI } from "./common/Electron";
import { ElectronTitleBar } from "./components/ElectronTitleBar";
import { useMatch } from "solid-navigator";
import { useReactNativeEvent } from "./common/ReactNative";
import { registerFCM } from "./chat-api/services/UserService";

const ConnectingStatusHeader = lazy(
  () => import("@/components/connecting-status-header/ConnectingStatusHeader")
);
export default function App() {
  const [, actions] = useTransContext();
  const isAppPage = useMatch(() => "/app/*");

  useReactNativeEvent(["registerFCM"], e => {
    registerFCM(e.token)
  })

  onMount(() => {
    document.title = "Nerimity";
    setLanguage();
  });

  const setLanguage = async () => {
    const key = getCurrentLanguage();
    if (!key) return;
    if (key === "en_gb") return;
    const language = await getLanguage(key);
    if (!language) return;
    actions.addResources(key, "translation", language);
    actions.changeLanguage(key);
  };

  return (
    <>
      <Show when={electronWindowAPI()?.isElectron}>
        <ElectronTitleBar />
      </Show>
      <Show when={isAppPage()}>
        <ConnectingStatusHeader />
      </Show>
    </>
  );
}
