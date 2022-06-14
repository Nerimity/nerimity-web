import styles from './styles.module.scss';
import CustomSuspense from '../../components/CustomSuspense';
import { createEffect, lazy, on, onMount } from 'solid-js';
import Tabs from '../../components/Tabs';

const ServerDrawer = lazy(() => import('../../components/ServerDrawer'));
const ServerSettingsDrawer = lazy(() => import('../../components/ServerSettingsDrawer/ServerSettingsDrawer'));
const InboxDrawer = lazy(() => import('../../components/InboxDrawer/InboxDrawer'));

const ServerSettingsPane = lazy(() => import('../../components/ServerSettingsPane'));
const MessagePane = lazy(() => import('../../components/MessagePane/MessagePane'));
const ExploreServerPane = lazy(() => import('../../components/ExploreServerPane'));
const ProfilePane = lazy(() => import('../../components/ProfilePane'));


import { getStorageString, StorageKeys } from '../../common/localStorage';
import socketClient from '../../chat-api/socketClient';
import SidePane from '../../components/SidePane';
import ServerMembersDrawer from '../../components/ServerMembersDrawer';
import { useWindowProperties } from '../../common/useWindowProperties';
import { getCache, LocalCacheKey } from '../../common/localCache';
import useStore from '../../chat-api/store/useStore';

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
  return <div style={{width: `${props.width}px`}} class={styles.leftPane}>
    {props.routeName === 'server_messages' && <CustomSuspense><ServerDrawer /></CustomSuspense>}
    {props.routeName === 'server_settings' && <CustomSuspense><ServerSettingsDrawer /></CustomSuspense>}
    
    {props.routeName === 'inbox_messages' && <CustomSuspense><InboxDrawer /></CustomSuspense>}
    {props.routeName === 'inbox' && <CustomSuspense><InboxDrawer /></CustomSuspense>}
  </div>
}

function RightPane (props: {width: number}) {
  return <div style={{width: `${props.width}px`}} class={styles.rightPane}>
    <CustomSuspense><ServerMembersDrawer /></CustomSuspense>
  </div>
}