import { createEffect, createSignal, lazy, on, onCleanup, onMount } from 'solid-js';
import MainPaneHeader from '../components/main-pane-header/MainPaneHeader';

const ServerDrawer = lazy(() => import('@/components/servers/drawer/ServerDrawer'));
const ServerSettingsDrawer = lazy(() => import('@/components/servers/settings/ServerSettingsDrawer'));
const InboxDrawer = lazy(() => import('@/components/inbox/drawer/InboxDrawer'));
const ServerSettingsPane = lazy(() => import('@/components/servers/settings/settings-pane/ServerSettingsPane'));
const SettingsDrawer = lazy(() => import('@/components/settings/SettingsDrawer'));
const SettingsPane = lazy(() => import('@/components/settings/SettingsPane'));
const MessagePane = lazy(() => import('@/components/message-pane/MessagePane'));
const ExploreDrawer = lazy(() => import('@/components/explore/ExploreDrawer'));
const ExploreServerPane = lazy(() => import('@/components/servers/explore-pane/ExploreServerPane'));
const ExplorePane = lazy(() => import('@/components/explore/ExplorePane'));
const ProfilePane = lazy(() => import('@/components/profile-pane/ProfilePane'));
const ModerationPane = lazy(() => import("@/components/moderation-pane/ModerationPane"));
const DashboardPane = lazy(() => import("@/components/DashboardPane"));

import { getStorageString, removeStorage, StorageKeys } from '../common/localStorage';
import socketClient from '../chat-api/socketClient';
import RightDrawer from '@/components/right-drawer/RightDrawer';
import { useWindowProperties } from '@/common/useWindowProperties';
import { getCache, LocalCacheKey } from '@/common/localCache';
import useStore from '@/chat-api/store/useStore';
import { setContext } from '@/common/runWithContext';
import DrawerLayout, { useDrawer } from '@/components/ui/drawer/Drawer';
import { Route, Routes, useSearchParams } from '@solidjs/router';
import { css, styled } from 'solid-styled-components';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import { ConnectionErrorModal } from '@/components/ConnectionErrorModal';
import { useAppVersion } from '@/common/useAppVersion';
import { ChangelogModal } from '@/components/ChangelogModal';
import { classNames, conditionalClass } from '@/common/classNames';
import { WelcomeModal } from '@/components/WelcomeModal';
import { ViewPostModal } from '@/components/PostsArea';
import { useResizeObserver } from '@/common/useResizeObserver';


const mobileMainPaneStyles = css`
  height: 100%;
  && {
    margin: 0;
    border-radius: 0px;
  }
`

interface MainPaneContainerProps {
  hasLeftDrawer: boolean,
  hasRightDrawer: boolean
}

const MainPaneContainer = styled("div") <MainPaneContainerProps>`
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-shrink: 0;
  border-radius: 8px;
  margin: 8px;
  ${props => props.hasLeftDrawer ? 'margin-left: 0;' : ''}
  ${props => props.hasRightDrawer ? 'margin-right: 0;' : ''}
  background: var(--pane-color);

`;
// border-right: solid 1px rgba(255, 255, 255, 0.1);
// border-left: solid 1px rgba(255, 255, 255, 0.1);

async function loadAllCache() {
  const { account } = useStore();
  const user = await getCache(LocalCacheKey.Account)
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
    handleChangelog()
  })

  function handleChangelog() {
    const { showChangelog } = useAppVersion();
    if (showChangelog()) {
      createPortal?.(close => <ChangelogModal close={close} />)
    }
  }

  function handleFirstTime() {
    let isFirstTime = getStorageString(StorageKeys.FIRST_TIME, false);
    if (!isFirstTime) return;
    removeStorage(StorageKeys.FIRST_TIME);
    createPortal?.(close => <WelcomeModal close={close} />)
  }

  createEffect(on(account.isAuthenticated, () => {
    handleFirstTime();
  }))


  createEffect(on(account.authenticationError, (err) => {
    if (!err) return;
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) return;
    createPortal?.(close => <ConnectionErrorModal close={close} />)
  }))

  createEffect(on(() => searchParams.postId, (postId, oldPostId) => {
    if (!oldPostId && !postId) return;
    if (!postId) return closePortalById("post_modal");
    createPortal?.((close) => <ViewPostModal close={close} />, "post_modal")
  }))

  onCleanup(() => {
    socketClient.socket.disconnect();
    account.setUser(null);
    account.setSocketDetails({
      socketId: null,
      socketConnected: false,
      socketAuthenticated: false,
      authenticationError: null,
    })
  })

  const LeftPane = (
    <Routes>
      <Route path="/servers/:serverId/settings/:path/*" component={ServerSettingsDrawer} />
      <Route path="/explore/*" component={ExploreDrawer} />
      <Route path="/servers/:serverId/:channelId/*" component={ServerDrawer} />
      <Route path="/inbox/:channelId?/*" component={InboxDrawer} />
      <Route path="/*" component={InboxDrawer} />
      <Route path="/settings/*" component={SettingsDrawer} />
    </Routes>
  )

  const RightPane = (
    <Routes>
      <Route path="/servers/:serverId/:channelId?/*" component={RightDrawer} />
      <Route path="/inbox/:channelId?/*" component={RightDrawer} />
    </Routes>
  )

  return (
    <DrawerLayout
      Content={() => <MainPane />}
      LeftDrawer={LeftPane}
      RightDrawer={RightPane}
    />
  )
}

function MainPane() {
  const windowProperties = useWindowProperties();
  const { hasRightDrawer, hasLeftDrawer } = useDrawer();
  const [mainPaneElement, setMainPaneElement] = createSignal<HTMLDivElement | undefined>(undefined);

  const [width] = useResizeObserver(mainPaneElement)

  createEffect(() => {
    windowProperties.setPaneWidth(width());
  })




  return (
    <MainPaneContainer hasLeftDrawer={hasLeftDrawer()} hasRightDrawer={hasRightDrawer()} class={classNames("main-pane-container", conditionalClass(windowProperties.isMobileWidth(), mobileMainPaneStyles))} ref={setMainPaneElement}>
      <MainPaneHeader />
      <Routes>
        <Route path="/settings/*" component={SettingsPane} />
        <Route path="/servers/:serverId/settings/*" component={ServerSettingsPane} />
        <Route path="/explore/*" component={ExplorePane} />
        <Route path="/servers/:serverId/:channelId" component={() => <MessagePane mainPaneEl={mainPaneElement()!} />} />
        <Route path="/inbox/:channelId" component={() => <MessagePane mainPaneEl={mainPaneElement()!} />} />
        <Route path="/profile/:userId" component={ProfilePane} />
        <Route path="/moderation/*" component={ModerationPane} />
        <Route path="/explore/servers/invites/:inviteId" component={ExploreServerPane} />
        <Route path="/*" component={DashboardPane} />
      </Routes>
    </MainPaneContainer>
  )
}
