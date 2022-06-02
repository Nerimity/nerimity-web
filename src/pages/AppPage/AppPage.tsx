import styles from './styles.module.scss';
import CustomSuspense from '../../components/CustomSuspense';
import { lazy, onMount } from 'solid-js';
// import { client } from '../../common/client';
// import SidePane from '../../components/SidePane/SidePane';
// import Tabs from '../../components/Tabs/Tabs';

// const ServerDrawer = lazy(() => import('../../components/ServerDrawer/ServerDrawer'));
// const InboxDrawer = lazy(() => import('../../components/InboxDrawer/InboxDrawer'));
// const ServerMembersDrawer = lazy(() => import('../../components/ServerMembersDrawer/ServerMembersDrawer'));

// const ServerSettingsPane = lazy(() => import('../../components/ServerSettingsPane/ServerSettingsPane'));
// const MessagePane = lazy(() => import('../../components/MessagePane/MessagePane'));
// const ExploreServerPane = lazy(() => import('../../components/ExploreServerPane/ExploreServerPane'));
// const ServerSettingsDrawer = lazy(() => import('../../components/ServerSettingsDrawer/ServerSettingsDrawer'));

import { getStorageString, StorageKeys } from '../../common/localStorage';
import socketClient from '../../chat-api/socketClient';

const DRAWER_WIDTH = 240;


export default function AppPage(props: {routeName?: string}) {
  
  onMount(() => {
    socketClient.login(getStorageString(StorageKeys.USER_TOKEN, undefined));
  })


  return (
    <div class={styles.appPage}>
      {/* <SidePane /> */}
      <LeftPane width={DRAWER_WIDTH} routeName={props.routeName} />
      <MainPane routeName={props.routeName}/>
      {props.routeName === "server_messages" && <RightPane width={DRAWER_WIDTH}/>}
      {props.routeName === "server_settings" && <RightPane width={DRAWER_WIDTH}/>}
    </div>
  )
}

function MainPane (props: {routeName?: string}) {
  let mainPaneElement: HTMLDivElement | undefined;


  onMount(() => {
    // const mainPaneWidth = mainPaneElement?.clientWidth || 0;
    // store.windowPropertyStore.updateMainPaneWidth(mainPaneWidth);
    // const destroy = reaction(() => store.windowPropertyStore.width, () => {
    //   const mainPaneWidth = mainPaneElement?.clientWidth || 0;
    //   store.windowPropertyStore.updateMainPaneWidth(mainPaneWidth);
    // })
    // return destroy;
  })

  return <div class={styles.mainPane} ref={mainPaneElement}>
    {/* <Tabs />
    {props.routeName === "server_settings" && <CustomSuspense><ServerSettingsPane/></CustomSuspense>}
    {props.routeName === 'server_messages' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {props.routeName === 'inbox_messages' && <CustomSuspense><MessagePane /></CustomSuspense>}
    {props.routeName === 'explore_server' && <CustomSuspense><ExploreServerPane /></CustomSuspense>} */}
  </div>
}

function LeftPane (props: {width: number, routeName?: string}) {
  return <div style={{width: `${props.width}px`}} class={styles.leftPane}>
    {/* {props.routeName === 'server_settings' && <CustomSuspense><ServerSettingsDrawer /></CustomSuspense>}
    {props.routeName === 'server_messages' && <CustomSuspense><ServerDrawer /></CustomSuspense>}
    {props.routeName === 'inbox_messages' && <CustomSuspense><InboxDrawer /></CustomSuspense>}
    {props.routeName === 'inbox' && <CustomSuspense><InboxDrawer /></CustomSuspense>} */}
  </div>
}

function RightPane (props: {width: number}) {
  return <div style={{width: `${props.width}px`}} class={styles.rightPane}>
    {/* <CustomSuspense><ServerMembersDrawer /></CustomSuspense> */}
  </div>
}