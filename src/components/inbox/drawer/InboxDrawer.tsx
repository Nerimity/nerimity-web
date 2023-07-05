import styles from './styles.module.scss';
import Icon from '@/components/ui/icon/Icon';
import { getStorageNumber, setStorageNumber, StorageKeys } from '@/common/localStorage';
import InboxDrawerFriends from './friends/InboxDrawerFriends';
import { classNames, conditionalClass } from '@/common/classNames';
import FriendItem from './friends/friend-item/InboxDrawerFriendItem';
import { createEffect, createSignal, For } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { FriendStatus } from '@/chat-api/RawData';
import Modal from '@/components/ui/Modal';
import { useParams } from '@solidjs/router';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import AddFriendModal from './add-friend/AddFriendModal';
import { DrawerHeader } from '@/components/DrawerHeader';
import { useTransContext } from '@nerimity/solid-i18next';

function Header(props: { selectedIndex: number, onTabClick: (index: number) => void }) {
  const { friends, inbox } = useStore();
  const [t] = useTransContext();

  const friendRequests = () => friends.array().filter(friend => friend.status === FriendStatus.PENDING);

  return (
    <div class={styles.header}>
      <HeaderItem
        name={t('inbox.drawer.inboxButton')}
        iconName='inbox'
        selected={props.selectedIndex === 0}
        notificationCount={inbox.notificationCount()}
        onClick={() => props.onTabClick(0)}

      />
      <HeaderItem
        name={t('inbox.drawer.friendsButton')}
        iconName='group'
        selected={props.selectedIndex === 1}
        notificationCount={friendRequests().length}
        onClick={() => props.onTabClick(1)}
      />
    </div>
  )
}

function HeaderItem(props: { name: string, iconName: string, selected: boolean, onClick: () => void, notificationCount?: number }) {
  return (
    <div class={classNames(styles.headerItem, conditionalClass(props.selected, styles.selected))} onClick={props.onClick}>
      <Icon class={styles.headerIcon} name={props.iconName} size={18} />
      {props.name}
      {!!props.notificationCount && <div class={styles.notificationCount}>{props.notificationCount}</div>}
    </div>
  )
}



const InboxDrawer = () => {
  const [t] = useTransContext();

  const [selectedIndex, setSelectedIndex] = createSignal(getStorageNumber(StorageKeys.INBOX_DRAWER_SELECTED_INDEX, 0));
  const params = useParams();

  const { createPortal } = useCustomPortal();

  const { users, account } = useStore();

  const onTabClick = (index: number) => {
    setStorageNumber(StorageKeys.INBOX_DRAWER_SELECTED_INDEX, index);
    setSelectedIndex(index);
  }

  const loggedInUser = () => users.get(account.user()?.id!);

  const onSavedNotesClick = () => {
    loggedInUser().openDM();
  }

  const isSavedNotesSelected = () => {
    return loggedInUser()?.inboxChannelId && loggedInUser()?.inboxChannelId === params.channelId;
  };

  const showAddFriendModel = () => {
    createPortal?.(close => <AddFriendModal close={close} />)
  }


  return (
    <div class={styles.inboxDrawer}>
      <Header selectedIndex={selectedIndex()} onTabClick={onTabClick} />
      <div class={styles.list}>
        {selectedIndex() === 0 && <InboxDrawerTab />}
        {selectedIndex() === 1 && <InboxDrawerFriends />}
      </div>

      <div class={styles.items}>
        <div class={classNames(styles.item, conditionalClass(isSavedNotesSelected(), styles.selected))} onClick={onSavedNotesClick}>
          <Icon name='note_alt' size={24} />
          <div>{t('inbox.drawer.savedNotesButton')}</div>
        </div>
        <div class={styles.item} onClick={showAddFriendModel}>
          <Icon name='group_add' size={24} />
          <div>{t('inbox.drawer.addFriendButton')}</div>
        </div>
      </div>
    </div>
  )
};


const InboxDrawerTab = () => {
  const { inbox, mentions, channels, users } = useStore();


  const mentionUserArray = () => mentions.array().filter(m => {
    const channel = channels.get(m?.channelId!);
    return !channel?.serverId
  }).map(m => users.get(m?.userId!))

  const array = () => {
    const users = mentionUserArray();
    const inboxArray = inbox.array().sort((a, b) => {
      const aTime = a.channel.lastMessagedAt!;
      const bTime = b.channel.lastMessagedAt!;
      return bTime - aTime;
    });



    for (let i = 0; i < inboxArray.length; i++) {
      const inboxItem = inboxArray[i];
      const alreadyExists = users.find(u => u?.id === inboxItem.channel.recipient?.id);
      if (!alreadyExists) {
        users.push(inboxItem.channel.recipient!);
      }
    }
    return users;
  }

  return <>
    <For each={array()}>
      {user => <FriendItem user={user} isInboxTab />}
    </For>
  </>
};





export default InboxDrawer;