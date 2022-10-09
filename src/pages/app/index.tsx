import styles from './styles.module.scss';
import CustomSuspense from '@/components/custom-suspense';
import { createEffect, createMemo, lazy, on, onMount, Show } from 'solid-js';
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

async function loadAllCache () {
  const {account} = useStore();
  const user = await getCache(LocalCacheKey.Account)
  account.setUser(user);
} 

export default function AppPage(props: {routeName?: string}) {
  
  onMount(() => {
    loadAllCache();
    setContext();
    setTimeout(() => {
      socketClient.login(getStorageString(StorageKeys.USER_TOKEN, undefined));
    }, 300);
  })

  const leftPane = createMemo(() => {
    switch (props.routeName) {
      case "server":
        return () => <CustomSuspense><ServerDrawer /></CustomSuspense>;    
      case "server_messages":
        return () => <CustomSuspense><ServerDrawer /></CustomSuspense>;    
      case "inbox_messages":
        return () => <CustomSuspense><InboxDrawer /></CustomSuspense>;    
      case "server_settings":
        return () => <CustomSuspense><ServerSettingsDrawer /></CustomSuspense>;    
      case "inbox":
        return () => <CustomSuspense><InboxDrawer /></CustomSuspense>;    
      default:
        return undefined;
    }
  });

  const rightPane = createMemo(() => {
    switch (props.routeName) {
      case "server_messages":
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
      LeftDrawer={leftPane}
      RightDrawer={rightPane}
    />
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
    <Header />
    {props.routeName === 'server_messages' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {props.routeName === 'inbox_messages' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {props.routeName === "server_settings" && <CustomSuspense><ServerSettingsPane/></CustomSuspense>}
    {props.routeName === 'explore_server' && <CustomSuspense><ExploreServerPane /></CustomSuspense>}
    {props.routeName === 'user_profile' && <CustomSuspense><ProfilePane /></CustomSuspense>}
  </div>
}
