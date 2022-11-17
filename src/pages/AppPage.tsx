import { createEffect, lazy, on, onCleanup, onMount} from 'solid-js';
import Header from '../components/header/Header';

const ServerDrawer = lazy(() => import('@/components/servers/drawer/ServerDrawer'));
const ServerSettingsDrawer = lazy(() => import('@/components/servers/settings/drawer/ServerSettingsDrawer'));
const InboxDrawer = lazy(() => import('@/components/inbox/drawer/InboxDrawer'));
const ServerSettingsPane = lazy(() => import('@/components/servers/settings/settings-pane/ServerSettingsPane'));
const MessagePane = lazy(() => import('@/components/message-pane/MessagePane'));
const ExploreServerPane = lazy(() => import('@/components/servers/explore-pane/ExploreServerPane'));
const ProfilePane = lazy(() => import('@/components/profile-pane/ProfilePane'));
const ModerationPane = lazy( () => import("@/components/moderation-pane/ModerationPane"));
const DashboardPane = lazy( () => import("@/components/DashboardPane"));

import { getStorageString, StorageKeys } from '../common/localStorage';
import socketClient from '../chat-api/socketClient';
import ServerMembersDrawer from '@/components/servers/drawer/members/ServerMembersDrawer';
import { useWindowProperties } from '@/common/useWindowProperties';
import { getCache, LocalCacheKey } from '@/common/localCache';
import useStore from '@/chat-api/store/useStore';
import { setContext } from '@/common/runWithContext';
import DrawerLayout from '@/components/ui/drawer/Drawer';
import { Route, Routes } from '@nerimity/solid-router';
import { styled } from 'solid-styled-components';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import { ConnectionErrorModal } from '@/components/ConnectionErrorModal';
import { useAppVersion } from '@/common/useAppVersion';
import { ChangelogModal } from '@/components/ChangelogModal';

const MainPaneContainer = styled("div")`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  flex-shrink: 0;
  overflow: hidden;
  border-right: solid 1px rgba(255, 255, 255, 0.1);
  border-left: solid 1px rgba(255, 255, 255, 0.1);
`;

async function loadAllCache () {
  const {account} = useStore();
  const user = await getCache(LocalCacheKey.Account)
  account.setUser(user);
} 

export default function AppPage() {
  const {account} = useStore();

  const createPortal = useCustomPortal();

  onMount(() => {
    loadAllCache();
    setContext();
    setTimeout(() => {
      socketClient.login(getStorageString(StorageKeys.USER_TOKEN, undefined));
    }, 300);
    handleChangelog()
  })

  function handleChangelog () {
    const {showChangelog} = useAppVersion();
    if (showChangelog()) {
      createPortal?.(close => <ChangelogModal close={close}/>)
    }
  }


  createEffect(on(account.authenticationError, (err) => {
    if (!err) return;
    if (!getStorageString(StorageKeys.USER_TOKEN, null)) return;
    createPortal?.(close => <ConnectionErrorModal close={close} />)
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
      <Route path="/servers/:serverId/settings/:path/*" component={ServerSettingsDrawer}  />
      <Route path="/servers/:serverId/:channelId/*" component={ServerDrawer}  />
      <Route path="/inbox/:channelId?/*" component={InboxDrawer}  />
    </Routes>
  )

  const RightPane = (
    <Routes>
      <Route path="/servers/:serverId/*" component={ServerMembersDrawer} />
    </Routes>
  )

  return (
    <DrawerLayout
      Content={() => <MainPane/>}
      LeftDrawer={LeftPane}
      RightDrawer={RightPane}
    />
  )
}

function MainPane () {
  const windowProperties = useWindowProperties();
  let mainPaneElement: HTMLDivElement | undefined;

  createEffect(on(windowProperties.width, () => {
    if (!mainPaneElement) return;
    windowProperties.setPaneWidth(mainPaneElement.clientWidth);
  }))

  return (
    <MainPaneContainer class="main-pane-container" ref={mainPaneElement}>
      <Header />
        <Routes>
        <Route path="/servers/:serverId/settings/*" component={ServerSettingsPane} />
        <Route path="/servers/:serverId/:channelId" component={MessagePane} />
        <Route path="/inbox/:channelId" component={MessagePane} />
        <Route path="/profile/:userId" component={ProfilePane} />
        <Route path="/moderation/*" component={ModerationPane} />
        <Route path="/explore/servers/invites/:inviteId" component={ExploreServerPane} />
        <Route path="/*" component={DashboardPane} />
      </Routes>
    </MainPaneContainer>
  )
}
