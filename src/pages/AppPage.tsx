import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import MainPaneHeader from "../components/main-pane-header/MainPaneHeader";

import {
  getStorageString,
  removeStorage,
  StorageKeys,
} from "../common/localStorage";
import socketClient from "../chat-api/socketClient";
import RightDrawer from "@/components/right-drawer/RightDrawer";
import { useWindowProperties } from "@/common/useWindowProperties";
import { getCache, LocalCacheKey } from "@/common/localCache";
import useStore from "@/chat-api/store/useStore";
import { setContext } from "@/common/runWithContext";
import DrawerLayout, { useDrawer } from "@/components/ui/drawer/Drawer";
import {
  useMatch,
  useSearchParams,
  Outlet,
  useNavigate,
  useLocation,
} from "solid-navigator";
import { css, styled } from "solid-styled-components";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { ConnectionErrorModal } from "@/components/connection-error-modal/ConnectionErrorModal";
import { useAppVersion } from "@/common/useAppVersion";
import { ChangelogModal } from "@/components/ChangelogModal";
import { classNames, conditionalClass } from "@/common/classNames";
import { WelcomeModal } from "@/components/welcome-modal/WelcomeModal";
import { ViewPostModal } from "@/components/PostsArea";
import { useResizeObserver } from "@/common/useResizeObserver";
import RouterEndpoints from "@/common/RouterEndpoints";
import useAccount from "@/chat-api/store/useAccount";
import { WarnedModal } from "@/components/warned-modal/WarnedModal";
import { useReactNativeEvent } from "@/common/ReactNative";
import { registerFCM } from "@/chat-api/services/UserService";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import MobileBottomPane from "@/components/ui/MobileBottomPane";
import { QuickTravel } from "@/components/QuickTravel";
import { applyCustomCss } from "@/common/customCss";
import {
  CustomScrollbar,
  CustomScrollbarProvider,
} from "@/components/custom-scrollbar/CustomScrollbar";

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

  &[data-is-mobile-agent="false"] {
    &:-webkit-scrollbar {
      display: none;
    }

    scrollbar-width: none; /* Firefox */
  }
`;

async function loadAllCache() {
  const { account } = useStore();
  const user = await getCache(LocalCacheKey.Account);
  account.setUser({ ...user, notices: [] });
}

export default function AppPage() {
  const { account, users } = useStore();
  const [searchParams] = useSearchParams<{ postId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useQuickTravel();

  const { createPortal, closePortalById } = useCustomPortal();

  navigate(location.pathname + location.search, {
    replace: true,
  });

  useReactNativeEvent(["registerFCM", "openChannel"], (e) => {
    if (e.type === "registerFCM") {
      registerFCM(e.token);
    }
    if (e.type === "openChannel") {
      const { userId, channelId, serverId } = e;
      if (serverId) {
        navigate(RouterEndpoints.SERVER_MESSAGES(serverId, channelId));
        return;
      }
      const user = users.get(userId);
      if (user) {
        user?.openDM();
        emitDrawerGoToMain();
      }
    }
  });

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
      authenticationError: null,
    });
  });

  return (
    <DrawerLayout
      Content={() => <MainPane />}
      LeftDrawer={() => <Outlet name="leftDrawer" />}
      RightDrawer={() => <Outlet name="rightDrawer" />}
    >
      <MobileBottomPane />
    </DrawerLayout>
  );
}

function MainPane() {
  const windowProperties = useWindowProperties();
  const { hasRightDrawer, hasLeftDrawer } = useDrawer();
  const [outerPaneElement, setOuterPaneElement] = createSignal<
    HTMLDivElement | undefined
  >(undefined);

  const [mainPaneEl, setMainPaneEl] = createSignal<HTMLDivElement | undefined>(
    undefined
  );

  const { width } = useResizeObserver(outerPaneElement);

  useServerRedirect();
  useUserNotices();
  applyCustomCss();

  createEffect(() => {
    windowProperties.setPaneWidth(width());
  });

  const isMobileWithOrHasRightDrawer = () => {
    return windowProperties.isMobileWidth() || hasRightDrawer();
  };

  return (
    <OuterMainPaneContainer ref={setOuterPaneElement}>
      <CustomScrollbarProvider>
        <MainPaneContainer
          data-is-mobile-agent={windowProperties.isMobileAgent()}
          ref={setMainPaneEl}
          style={{ background: windowProperties.paneBackgroundColor() }}
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
          <Show when={!windowProperties.isMobileAgent()}>
            <CustomScrollbar
              scrollElement={mainPaneEl()}
              class={css`
                position: absolute;
                right: ${isMobileWithOrHasRightDrawer() ? "2px" : "10px"};
                bottom: ${windowProperties.isMobileWidth() ? "4px" : "14px"};
                top: ${windowProperties.isMobileWidth() ? "50px" : "58px"};
              `}
            />
          </Show>
        </MainPaneContainer>
      </CustomScrollbarProvider>
    </OuterMainPaneContainer>
  );
}

function useServerRedirect() {
  const navigate = useNavigate();
  const { servers, account } = useStore();

  const serverRoute = useMatch(() => "/app/servers/:serverId/*");
  const serverId = createMemo(() => serverRoute()?.params.serverId);
  const server = () => (serverId() ? servers.get(serverId()!) : undefined);

  createEffect(
    on([server, account.isAuthenticated], () => {
      if (!serverRoute()) return;
      if (server()) return;
      if (!account.isAuthenticated()) return;
      navigate(RouterEndpoints.INBOX());
    })
  );
}

function useUserNotices() {
  const account = useAccount();
  const { createPortal } = useCustomPortal();
  const notices = () => account?.user()?.notices || [];

  const firstNotice = createMemo(() => notices()[0]);
  createEffect(
    on(
      () => notices().length,
      () => {
        if (!firstNotice()) return;

        createPortal(
          (close) => (
            <WarnedModal
              id={firstNotice()?.id}
              reason={firstNotice()?.content}
              by={{ username: firstNotice()?.createdBy.username! }}
              close={close}
            />
          ),
          "user-notice"
        );
      }
    )
  );
}

function useQuickTravel() {
  const { createPortal } = useCustomPortal();
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.ctrlKey) return;
    if (event.key === " ") {
      createPortal((close) => <QuickTravel close={close} />, "quick-travel");
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });
}
