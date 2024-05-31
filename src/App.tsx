import { onMount, lazy, Show, createEffect, createMemo, on } from "solid-js";
import env from "./common/env";
import RouterEndpoints from "./common/RouterEndpoints";
import { A, Route, Router, useMatch, useNavigate, useParams } from "solid-navigator";
import { getCurrentLanguage, getLanguage } from "./locales/languages";
import { useTransContext } from "@mbarzda/solid-i18next";
import { electronWindowAPI } from "./common/Electron";
import { ElectronTitleBar } from "./components/ElectronTitleBar";
import { useWindowProperties } from "./common/useWindowProperties";
import styles from "./App.module.scss";
import { ConnectingStatusHeader } from "./components/connecting-status-header/ConnectingStatusHeader";
import useStore from "./chat-api/store/useStore";
import useAccount from "./chat-api/store/useAccount";
import { useCustomPortal } from "./components/ui/custom-portal/CustomPortal";
import { WarnedModal } from "./components/warned-modal/WarnedModal";



export default function App() {
  const [, actions] = useTransContext();
  useServerRedirect();
  useUserNotices();
  onMount(() => {
    document.title = env.APP_NAME;
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
      <ConnectingStatusHeader/>
    </>
  );
}


function useServerRedirect() {
  const navigate = useNavigate();
  const {servers, account} = useStore();

  const serverRoute = useMatch(() => "/app/servers/:serverId/*");
  const serverId = createMemo(() => serverRoute()?.params.serverId);
  const server = () => serverId() ? servers.get(serverId()!) : undefined;

  createEffect(on([server, account.isAuthenticated], () => {
    if (!serverRoute()) return;
    if (server()) return;
    if (!account.isAuthenticated()) return;
    navigate(RouterEndpoints.INBOX());
  }));
}

function useUserNotices() {
  const account = useAccount();
  const {createPortal} = useCustomPortal();
  const notices = () => account?.user()?.notices || [];

  const firstNotice = createMemo(() => notices()[0]);
  createEffect(on(() => notices().length, () => {

    if (!firstNotice()) return;
      
    createPortal((close) => <WarnedModal id={firstNotice()?.id} reason={firstNotice()?.content} by={{username: firstNotice()?.createdBy.username!}} close={close} />, "user-notice");

  }));
}