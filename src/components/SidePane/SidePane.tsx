import styles from './styles.module.scss';
import Icon from '../Icon';
import Avatar from '../Avatar';
import RouterEndpoints from '../../common/RouterEndpoints';
import { classNames, conditionalClass } from '../../common/classNames';

import ContextMenuServer from '../ContextMenuServer';
import { createEffect, createSignal, For, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { Link, useLocation, useParams } from 'solid-app-router';
import { RawServer } from '../../chat-api/RawData';


export default function SidePane () {
  const [showAddServerModel, setShowAddServerModel] = createSignal(false);
  return <div class={styles.sidePane}>
    <InboxItem />
    <div class={styles.scrollable}>
      {/* <Modal show={showAddServerModel} component={() => <AddServer />} /> */}
      <ServerList />
      <Item iconName='add_box' onClick={() => setShowAddServerModel(true)}  />
    </div>
    <SettingsItem />
    <UserItem />
  </div>
}





function InboxItem() {
  const location = useLocation();
  const isSelected = location.pathname.startsWith(RouterEndpoints.INBOX());

  return <Link href={RouterEndpoints.INBOX()} class={classNames(styles.item, styles.settingsIcon, conditionalClass(isSelected, styles.selected))} >
    <Icon name='all_inbox' />
  </Link>
}
function SettingsItem() {
  return <div class={`${styles.item} ${styles.settingsIcon}`} >
    <Icon name='settings' />
  </div>
}

const UserItem = () => {
  const {account} = useStore();

  return (
    <Show when={account.user()}>
      <div class={`${styles.item} ${styles.user}`} >
        <Avatar size={35} hexColor={account.user()?.hexColor!} />
      </div>
    </Show>
  )
};


function ServerItem(props: {server: RawServer, selected?: boolean, onContextMenu?: (e: MouseEvent) => void}) {
  const { _id, defaultChannel } = props.server;

  return (
    <Link
      href={RouterEndpoints.SERVER_MESSAGES(_id, defaultChannel)}
      onContextMenu={props.onContextMenu}
      class={styles.item}
      classList={{ [styles.selected]: props.selected }}>
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


