import styles from './styles.module.scss';
import CustomSuspense from '@/components/custom-suspense';
import { createEffect, createMemo, lazy, on, onCleanup, onMount, Show } from 'solid-js';
import Header from '../../components/header';

const ServerDrawer = lazy(() => import('@/components/servers/drawer'));
const ServerSettingsDrawer = lazy(() => import('@/components/servers/settings/drawer'));
const InboxDrawer = lazy(() => import('@/components/inbox/drawer'));

const ServerSettingsPane = lazy(() => import('@/components/servers/settings/settings-pane'));
const MessagePane = lazy(() => import('@/components/message-pane'));
const ExploreServerPane = lazy(() => import('@/components/servers/explore-pane'));
const ProfilePane = lazy(() => import('@/components/profile-pane'));


import { getStorageString, StorageKeys } from '../../common/localStorage';
import socketClient from '../../chat-api/socketClient';
import ServerMembersDrawer from '@/components/servers/drawer/members';
import { useWindowProperties } from '@/common/useWindowProperties';
import { getCache, LocalCacheKey } from '@/common/localCache';
import useStore from '@/chat-api/store/useStore';
import { setContext } from '@/common/runWithContext';
import DrawerLayout from '@/components/ui/drawer';
import { useNamedRoute } from 'solid-named-router';

async function loadAllCache () {
  const {account} = useStore();
  const user = await getCache(LocalCacheKey.Account)
  account.setUser(user);
} 

export default function AppPage(props: {routeName?: string}) {
  const namedRoute = useNamedRoute();

  
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
  
  const leftPane = createMemo(() => {
    switch (namedRoute.name) {
      case "server":
        return () => <CustomSuspense><ServerDrawer /></CustomSuspense>;      
      case "inbox":
        return () => <CustomSuspense><InboxDrawer /></CustomSuspense>;    
      case "server_settings":
        return () => <CustomSuspense><ServerSettingsDrawer /></CustomSuspense>;    
      default:
        return undefined;
    }
  });

  const rightPane = createMemo(() => {
    const namedRoute = useNamedRoute();

    switch (namedRoute.name) {
      case "server":
        return () => <CustomSuspense><ServerMembersDrawer /></CustomSuspense>;    
      case "server_settings":
        return () => <CustomSuspense><ServerMembersDrawer /></CustomSuspense>;      
      default:
        return undefined;
    }
  });

  return (
    <DrawerLayout
      Content={() => <MainPane routeName={props.routeName}/>}
      LeftDrawer={leftPane()}
      RightDrawer={rightPane()}
    />
  )
}

function MainPane (props: {routeName?: string}) {
  const windowProperties = useWindowProperties();
  let mainPaneElement: HTMLDivElement | undefined;
  const namedRoute = useNamedRoute();



  createEffect(on(windowProperties.width, () => {
    if (!mainPaneElement) return;
    windowProperties.setPaneWidth(mainPaneElement.clientWidth);
  }))
  


  return <div class={styles.mainPane} ref={mainPaneElement}>
    <Header />
    {namedRoute.name === 'server' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {namedRoute.name === 'inbox' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {namedRoute.name === "server_settings" && <CustomSuspense><ServerSettingsPane/></CustomSuspense>}
    {namedRoute.name === 'explore_server' && <CustomSuspense><ExploreServerPane /></CustomSuspense>}
    {namedRoute.name === 'user_profile' && <CustomSuspense><ProfilePane /></CustomSuspense>}
  </div>
}
