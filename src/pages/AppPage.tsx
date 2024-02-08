import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import MainPaneHeader from "../components/main-pane-header/MainPaneHeader";

import {
  getStorageString,
  removeStorage,
  StorageKeys
} from "../common/localStorage";
import socketClient from "../chat-api/socketClient";
import RightDrawer from "@/components/right-drawer/RightDrawer";
import { useWindowProperties } from "@/common/useWindowProperties";
import { getCache, LocalCacheKey } from "@/common/localCache";
import useStore from "@/chat-api/store/useStore";
import { setContext } from "@/common/runWithContext";
import DrawerLayout, { useDrawer } from "@/components/ui/drawer/Drawer";
import { useMatch, useSearchParams, Outlet } from "solid-navigator";
import { css, styled } from "solid-styled-components";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { ConnectionErrorModal } from "@/components/connection-error-modal/ConnectionErrorModal";
import { useAppVersion } from "@/common/useAppVersion";
import { ChangelogModal } from "@/components/ChangelogModal";
import { classNames, conditionalClass } from "@/common/classNames";
import { WelcomeModal } from "@/components/welcome-modal/WelcomeModal";
import { ViewPostModal } from "@/components/PostsArea";
import { useResizeObserver } from "@/common/useResizeObserver";

const mobileMainPaneStyles = css`
  height: 100%;
  && {
    margin: 0;
    border-radius: 0px;
  }
`;

interface MainPaneContainerProps {
  hasLeftDrawer: boolean;
  hasRightDrawer: boolean;
}

const OuterMainPaneContainer = styled("div")`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const MainPaneContainer = styled("div")<MainPaneContainerProps>`
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-shrink: 0;
  border-radius: 8px;
  margin: 8px;
  ${(props) => (props.hasLeftDrawer ? "margin-left: 0;" : "")}
  ${(props) => (props.hasRightDrawer ? "margin-right: 0;" : "")}
  background: var(--pane-color);
`;

async function loadAllCache() {
  const { account } = useStore();
  const user = await getCache(LocalCacheKey.Account);
  account.setUser(user);
}

export default function AppPage() {
  const { account } = useStore();
  const [searchParams] = useSearchParams<{ postId: string }>();

  const { createPortal, closePortalById } = useCustomPortal();

  onMount(() => {
    loadAllCache();
    setContext();
    setTimeout(() => {
      socketClient.login(getStorageString(StorageKeys.USER_TOKEN, undefined));
    }, 300);
    handleChangelog();
  });

  function handleChangelog() {
    const { showChangelog } = useAppVersion();
    if (showChangelog()) {
      createPortal?.((close) => <ChangelogModal close={close} />);
    }
  }

  function handleFirstTime() {
    const isFirstTime = getStorageString(StorageKeys.FIRST_TIME, false);
    if (!isFirstTime) return;
    removeStorage(StorageKeys.FIRST_TIME);
    createPortal?.((close) => <WelcomeModal close={close} />);
  }

  createEffect(
    on(account.isAuthenticated, () => {
      handleFirstTime();
    })
  );

  createEffect(
    on(account.authenticationError, (err) => {
      if (!err) return;
      const invitesPage = useMatch(() => "/app/explore/servers/invites/*");
      if (invitesPage() && !getStorageString(StorageKeys.USER_TOKEN, undefined))
        return;
      createPortal?.((close) => <ConnectionErrorModal close={close} />);
    })
  );

  createEffect(
    on(
      () => searchParams.postId,
      (postId, oldPostId) => {
        if (!oldPostId && !postId) return;
        if (!postId) return closePortalById("post_modal");
        createPortal?.(
          (close) => <ViewPostModal close={close} />,
          "post_modal"
        );
      }
    )
  );

  onCleanup(() => {
    socketClient.socket.disconnect();
    account.setUser(null);
    account.setSocketDetails({
      socketId: null,
      socketConnected: false,
      socketAuthenticated: false,
      authenticationError: null
    });
  });

  return (
    <DrawerLayout
      Content={() => <MainPane />}
      LeftDrawer={() => <Outlet name="leftDrawer" />}
      RightDrawer={() => <Outlet name="rightDrawer" />}
    />
  );
}

function MainPane() {
  const windowProperties = useWindowProperties();
  const { hasRightDrawer, hasLeftDrawer } = useDrawer();
  const [outerPaneElement, setOuterPaneElement] = createSignal<
    HTMLDivElement | undefined
  >(undefined);

  const { width } = useResizeObserver(outerPaneElement);

  createEffect(() => {
    windowProperties.setPaneWidth(width());
  });

  return (
    <OuterMainPaneContainer ref={setOuterPaneElement}>
      <MainPaneContainer
        hasLeftDrawer={hasLeftDrawer()}
        hasRightDrawer={hasRightDrawer()}
        class={classNames(
          "main-pane-container",
          conditionalClass(
            windowProperties.isMobileWidth(),
            mobileMainPaneStyles
          )
        )}
      >
        <MainPaneHeader />
        <Outlet name="mainPane" />
      </MainPaneContainer>
    </OuterMainPaneContainer>
  );
}
