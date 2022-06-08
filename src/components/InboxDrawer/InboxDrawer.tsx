import styles from './styles.module.scss';
import { Icon } from '../Icon/Icon';
import { getStorageNumber, setStorageNumber, StorageKeys } from '../../common/localStorage';
import InboxDrawerFriends from '../InboxDrawerFriends/InboxDrawerFriends';
import { classNames, conditionalClass } from '../../common/classNames';
import FriendItem from '../InboxDrawerFriendItem/InboxDrawerFriendItem';
import { createSignal, For, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { FriendStatus } from '../../chat-api/RawData';

function Header (props: {selectedIndex: number, onTabClick: (index: number) => void}) {
  const {friends} = useStore();

  const friendRequests = () =>  friends.array().filter(friend => friend.status === FriendStatus.PENDING);

  return (
    <div class={styles.header}>
      <HeaderItem
        name='Inbox'
        iconName='inbox'
        selected={props.selectedIndex === 0}
        onClick={() => props.onTabClick(0)}

      />
      <HeaderItem
        name='Friends'
        iconName='group'
        selected={props.selectedIndex === 1}
        notificationCount={friendRequests().length}
        onClick={() => props.onTabClick(1)}
    />
    </div>
  )
}

function HeaderItem (props: {name: string, iconName: string, selected: boolean, onClick: () => void, notificationCount?: number}) {
  return (
    <div class={classNames(styles.headerItem,  conditionalClass(props.selected, styles.selected))} onClick={props.onClick}>
      <Icon class={styles.headerIcon} name={props.iconName} size={18} />
      {props.name}
      {!!props.notificationCount && <div class={styles.notificationCount}>{props.notificationCount}</div>}
    </div>
  )
}



const InboxDrawer = () => {
  const [selectedIndex, setSelectedIndex] = createSignal(getStorageNumber(StorageKeys.INBOX_DRAWER_SELECTED_INDEX, 0));
  
  const onTabClick = (index: number) => {
    setStorageNumber(StorageKeys.INBOX_DRAWER_SELECTED_INDEX, index);
    setSelectedIndex(index);
  }


  return (
    <div class={styles.inboxDrawer}>
      <Header selectedIndex={selectedIndex()} onTabClick={onTabClick} />
      {selectedIndex() === 0 && <InboxDrawerTab/>}
      {selectedIndex() === 1 && <InboxDrawerFriends /> }
    </div>
  )
};


const InboxDrawerTab = () => {
  const {inbox} = useStore();
  return <div>
    <For each={inbox.array()}>
      {inboxItem => <FriendItem user={inboxItem.channel.recipient}  />}
    </For>
  </div>
};





export default InboxDrawer;