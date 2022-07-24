import styles from './styles.module.scss';
import CustomSuspense from '@/components/custom-suspense';
import { createEffect, lazy, on, onMount, Show } from 'solid-js';
import Tabs from '../../components/Tabs';

const ServerDrawer = lazy(() => import('@/components/servers/drawer'));
const ServerSettingsDrawer = lazy(() => import('@/components/servers/settings/drawer'));
const InboxDrawer = lazy(() => import('@/components/inbox/drawer'));

const ServerSettingsPane = lazy(() => import('@/components/servers/settings/settings-pane'));
const MessagePane = lazy(() => import('@/components/message-pane'));
const ExploreServerPane = lazy(() => import('@/components/servers/explore-pane'));
const ProfilePane = lazy(() => import('@/components/profile-pane'));


import { getStorageString, StorageKeys } from '../../common/localStorage';
import socketClient from '../../chat-api/socketClient';
import SidePane from '@/components/side-pane';
import ServerMembersDrawer from '@/components/servers/drawer/members';
import { useWindowProperties } from '@/common/useWindowProperties';
import { getCache, LocalCacheKey } from '@/common/localCache';
import useStore from '@/chat-api/store/useStore';

async function loadAllCache () {
  const {account} = useStore();
  const user = await getCache(LocalCacheKey.Account)
  account.setUser(user);
} 
const DRAWER_WIDTH = 240;


export default function AppPage(props: {routeName?: string}) {
  
  onMount(() => {
    loadAllCache()
    setTimeout(() => {
      socketClient.login(getStorageString(StorageKeys.USER_TOKEN, undefined));
    }, 1000);
  })


  return (
    <div class={styles.appPage}>
      <SidePane />
      <LeftPane width={DRAWER_WIDTH} routeName={props.routeName} />
      <MainPane routeName={props.routeName}/>
      {props.routeName === "server_messages" && <RightPane width={DRAWER_WIDTH}/>}
      {props.routeName === "server_settings" && <RightPane width={DRAWER_WIDTH}/>}
    </div>
  )
}

function MainPane (props: {routeName?: string}) {
  const windowProperties = useWindowProperties();
  let mainPaneElement: HTMLDivElement | undefined;


  createEffect(on(windowProperties.width, () => {
    if (!mainPaneElement) return;
    windowProperties.setPaneWidth(mainPaneElement.clientWidth);
  }))
  


  return <div class={styles.mainPane} ref={mainPaneElement}>
    <Tabs />
    {props.routeName === 'server_messages' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {props.routeName === 'inbox_messages' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {props.routeName === "server_settings" && <CustomSuspense><ServerSettingsPane/></CustomSuspense>}
    {props.routeName === 'explore_server' && <CustomSuspense><ExploreServerPane /></CustomSuspense>}
    {props.routeName === 'user_profile' && <CustomSuspense><ProfilePane /></CustomSuspense>}
  </div>
}

function LeftPane (props: {width: number, routeName?: string}) {

  const leftPanes = {
    server_messages: <CustomSuspense><ServerDrawer /></CustomSuspense>,
    inbox_messages: <CustomSuspense><InboxDrawer /></CustomSuspense>,
    server_settings: <CustomSuspense><ServerSettingsDrawer /></CustomSuspense>,
    inbox: <CustomSuspense><InboxDrawer /></CustomSuspense>,
  }

  const CurrentPane = () => props.routeName && (leftPanes as any)[props.routeName];

  return (
    <Show when={CurrentPane()}>
      <div style={{width: `${props.width}px`}} class={styles.leftPane}>
        <CurrentPane />
      </div>
    </Show>
  )
}

function RightPane (props: {width: number}) {
  return <div style={{width: `${props.width}px`}} class={styles.rightPane}>
    <CustomSuspense><ServerMembersDrawer /></CustomSuspense>
  </div>
}