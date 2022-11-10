import styles from './styles.module.scss';
import Icon from '@/components/ui/icon/Icon';
import Avatar from '@/components/ui/Avatar';
import RouterEndpoints from '../../common/RouterEndpoints';
import { classNames, conditionalClass } from '@/common/classNames';
import ContextMenuServer from '@/components/servers/context-menu/ContextMenuServer';
import { createEffect, createSignal, For, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { Link, useLocation, useParams, useMatch } from '@nerimity/solid-router';
import { FriendStatus } from '../../chat-api/RawData';
import Modal from '@/components/ui/modal/Modal';
import AddServer from './add-server/AddServer';
import { userStatusDetail } from '../../common/userStatus';
import { Server } from '../../chat-api/store/useServers';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import { hasBit, USER_BADGES } from '@/chat-api/Bitwise';
import { updateTitleAlert } from '@/common/BrowserTitle';

export default function SidePane () {
  const createPortal = useCustomPortal();

  const showAddServerModal = () => {
    createPortal?.(close => <Modal {...close} title="Add Server" children={() => <AddServer close={close} />} />)
  }

  return <div class={styles.sidePane}>
    <InboxItem />
    <div class={styles.scrollable}>
      <ServerList />
      <Item iconName='add_box' onClick={showAddServerModal}  />
    </div>
    <ModerationItem />
    <SettingsItem />
    <UserItem />
  </div>
}

function InboxItem() {
  const {inbox, friends, servers} = useStore();
  const location = useLocation();
  const isSelected = () => location.pathname.startsWith(RouterEndpoints.INBOX());
  const notificationCount = () => inbox.notificationCount(); 
  const friendRequestCount = () => friends.array().filter(friend => friend.status === FriendStatus.PENDING).length;

  const count = () => (notificationCount() + friendRequestCount());

  createEffect(() => {
    updateTitleAlert(count() || servers.hasNotifications() ? true : false);
  })

  return (
  <Link 
      href={RouterEndpoints.INBOX()} class={
      classNames(styles.item, conditionalClass(isSelected(), styles.selected), conditionalClass(count(), styles.hasNotifications))}
    >
    <Show when={count()}><div class={styles.notificationCount}>{count()}</div></Show>
    <Icon name='all_inbox' />
  </Link>
  )
}

function ModerationItem() {
  const {account} = useStore();
  const hasModeratorPerm = () => hasBit(account.user()?.badges || 0, USER_BADGES.CREATOR.bit) || hasBit(account.user()?.badges || 0, USER_BADGES.ADMIN.bit)

  const selected = useMatch(() => "/app/moderation");

  return (
    <Show when={hasModeratorPerm()}>
      <Link href="/app/moderation" class={classNames(styles.item, conditionalClass(selected(), styles.selected))} >
        <Icon name='security' title='Moderation' />
      </Link>
    </Show>
  )
}
function SettingsItem() {
  return <div class={styles.item} >
    <Icon name='settings' title='Settings' />
  </div>
}

const UserItem = () => {
  const {account, users} = useStore();

  const userId = () =>  account.user()?.id;
  const user = () => users.get(userId()!)
  const presenceColor = () => user() && userStatusDetail(user().presence?.status || 0).color

  const isAuthenticated = account.isAuthenticated;
  const authErrorMessage = account.authenticationError;
  const isConnected = account.isConnected;

  const isAuthenticating = () => !isAuthenticated() && isConnected();
  const showConnecting = () => !authErrorMessage() && !isAuthenticated() && !isAuthenticating();
  const href = () => userId() ? RouterEndpoints.PROFILE(userId()!) : "#";
  return (
    <Link href={href()} class={`${styles.item} ${styles.user}`}  activeClass={styles.selected}>
      {account.user() && <Avatar size={35} hexColor={account.user()?.hexColor!} />}
      {!showConnecting() && <div class={styles.presence} style={{background: presenceColor()}} />}
      {showConnecting() && <Icon name='autorenew' class={styles.connectingIcon} size={24} />}
      {isAuthenticating() && <Icon name='autorenew' class={classNames(styles.connectingIcon, styles.authenticatingIcon)} size={24} />}
      {authErrorMessage() && <Icon name='error' class={styles.errorIcon} size={24} />}
    </Link>
  )
};


function ServerItem(props: {server: Server, onContextMenu?: (e: MouseEvent) => void}) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications;
  const selected = useMatch(() => RouterEndpoints.SERVER(id));

  return (
    <Link
      href={RouterEndpoints.SERVER_MESSAGES(id, defaultChannelId)}
      onContextMenu={props.onContextMenu}
      class={classNames(styles.item, conditionalClass(selected(), styles.selected), conditionalClass(hasNotifications(), styles.hasNotifications))}
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
        server={server!}
        onContextMenu={e => onContextMenu(e, server!.id)}
      />}
    </For>
  </div>
};


