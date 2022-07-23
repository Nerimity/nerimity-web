import styles from './styles.module.scss';
import Icon from '../Icon';
import Avatar from '../Avatar';
import RouterEndpoints from '../../common/RouterEndpoints';
import { classNames, conditionalClass } from '../../common/classNames';

import ContextMenuServer from '../ContextMenuServer';
import { createEffect, createSignal, For, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { Link, useLocation, useParams } from 'solid-app-router';
import { FriendStatus, RawServer } from '../../chat-api/RawData';
import Modal from '../Modal';
import AddServer from '../AddServer';
import { userStatusDetail } from '../../common/userStatus';
import { Server } from '../../chat-api/store/useServers';


export default function SidePane () {
  const [showAddServerModel, setShowAddServerModel] = createSignal(false);
  return <div class={styles.sidePane}>
    <InboxItem />
    <div class={styles.scrollable}>
      <Modal show={showAddServerModel()} component={() => <AddServer />} />
      <ServerList />
      <Item iconName='add_box' onClick={() => setShowAddServerModel(true)}  />
    </div>
    <SettingsItem />
    <UserItem />
  </div>
}





function InboxItem() {
  const {inbox, friends} = useStore();
  const location = useLocation();
  const isSelected = location.pathname.startsWith(RouterEndpoints.INBOX());
  const notificationCount = () => inbox.notificationCount(); 
  const friendRequestCount = () => friends.array().filter(friend => friend.status === FriendStatus.PENDING).length;

  const count = () => (notificationCount() + friendRequestCount());

  return (
  <Link 
      href={RouterEndpoints.INBOX()} class={
      classNames(styles.item, styles.settingsIcon, conditionalClass(isSelected, styles.selected), conditionalClass(count(), styles.hasNotifications))}
    >
    <Show when={count()}><div class={styles.notificationCount}>{count()}</div></Show>
    <Icon name='all_inbox' />
  </Link>
  )
}
function SettingsItem() {
  return <div class={`${styles.item} ${styles.settingsIcon}`} >
    <Icon name='settings' />
  </div>
}

const UserItem = () => {
  const params = useParams();
  const {account, users} = useStore();

  const userId = () =>  account.user()?._id;
  const user = () => users.get(userId()!)

  const isSelected = () => userId() === params.userId;

  const presenceColor = () => user() && userStatusDetail(user().presence?.status || 0).color


  return (
    <Link href={userId() ? RouterEndpoints.PROFILE(userId()!) : "#"}>
      <div class={`${styles.item} ${styles.user} ${conditionalClass(isSelected(), styles.selected)}`} >
        {account.user() && <Avatar size={35} hexColor={account.user()?.hexColor!} />}
        {presenceColor() && <div class={styles.presence} style={{background: presenceColor()}} />}
        {!presenceColor() && <Icon name='autorenew' class={styles.connectingIcon} size={24} />}
      </div>
    </Link>
  )
};


function ServerItem(props: {server: Server, selected?: boolean, onContextMenu?: (e: MouseEvent) => void}) {
  const { _id, defaultChannel } = props.server;

  const hasNotifications = () => props.server.hasNotifications;

  return (
    <Link
      href={RouterEndpoints.SERVER_MESSAGES(_id, defaultChannel)}
      onContextMenu={props.onContextMenu}
      class={classNames(styles.item, conditionalClass(props.selected, styles.selected), conditionalClass(hasNotifications(), styles.hasNotifications))}
      >
        <Avatar size={35} hexColor={props.server.hexColor} />
    </Link>
  )
}

function Item(props: {iconName: string, selected?: boolean, onClick?: () => void}) {
  return <div class={classNames(styles.item, conditionalClass(props.selected, styles.selected))} onClick={props.onClick} >
    <Icon name={props.iconName} size={40} />
  </div>
}


const  ServerList = () => {
  const params = useParams();
  
  const {servers} = useStore();

  const [contextPosition, setContextPosition] = createSignal<{x: number, y: number} | undefined>();
  const [contextServerId, setContextServerId] = createSignal<string | undefined>();


  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({x: event.clientX, y: event.clientY});
  }


  return <div class={styles.serverList}>
    <ContextMenuServer position={contextPosition()} onClose={() => setContextPosition(undefined)} serverId={contextServerId()} />
    <For each={servers.array()}>
      {server => <ServerItem 
        selected={ server._id === params.serverId }
        server={server}
        onContextMenu={e => onContextMenu(e, server._id)}
      />}
    </For>

  </div>
};


