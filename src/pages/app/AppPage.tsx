import styles from './styles.module.scss';
import { createEffect, lazy, on, onCleanup, onMount} from 'solid-js';
import Header from '../../components/header/Header';

const ServerDrawer = lazy(() => import('@/components/servers/drawer/ServerDrawer'));
const ServerSettingsDrawer = lazy(() => import('@/components/servers/settings/drawer/ServerSettingsDrawer'));
const InboxDrawer = lazy(() => import('@/components/inbox/drawer/InboxDrawer'));
const ServerSettingsPane = lazy(() => import('@/components/servers/settings/settings-pane/ServerSettingsPane'));
const MessagePane = lazy(() => import('@/components/message-pane/MessagePane'));
const ExploreServerPane = lazy(() => import('@/components/servers/explore-pane/ExploreServerPane'));
const ProfilePane = lazy(() => import('@/components/profile-pane/ProfilePane'));
const ModerationPane = lazy( () => import("@/components/moderation-pane/ModerationPane"))

import { getStorageString, StorageKeys } from '../../common/localStorage';
import socketClient from '../../chat-api/socketClient';
import ServerMembersDrawer from '@/components/servers/drawer/members/ServerMembersDrawer';
import { useWindowProperties } from '@/common/useWindowProperties';
import { getCache, LocalCacheKey } from '@/common/localCache';
import useStore from '@/chat-api/store/useStore';
import { setContext } from '@/common/runWithContext';
import DrawerLayout from '@/components/ui/drawer/Drawer';
import { Route, Routes } from '@nerimity/solid-router';

async function loadAllCache () {
  const {account} = useStore();
  const user = await getCache(LocalCacheKey.Account)
  account.setUser(user);
} 

export default function AppPage() {
  onMount(() => {
    loadAllCache();
    setContext();
    setTimeout(() => {
      socketClient.login(getStorageString(StorageKeys.USER_TOKEN, undefined));
    }, 300);
  })

  onCleanup(() => {
    socketClient.socket.disconnect();
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

  return <div class={styles.mainPane} ref={mainPaneElement}>
    <Header />
      <Routes>
      <Route path="/servers/:serverId/settings/*" component={ServerSettingsPane} />
      <Route path="/servers/:serverId/:channelId" component={MessagePane} />
      <Route path="/inbox/:channelId" component={MessagePane} />
      <Route path="/profile/:userId" component={ProfilePane} />
      <Route path="/moderation/*" component={ModerationPane} />
      <Route path="/explore/servers/invites/:inviteId" component={ExploreServerPane} />
    </Routes>
  </div>
}
