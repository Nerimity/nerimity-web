import { useParams } from 'solid-app-router';
import { createEffect, Show } from 'solid-js';
import { FriendStatus } from '../../chat-api/RawData';
import useStore from '../../chat-api/store/useStore';
import Avatar from '../Avatar';
import CustomButton from '../CustomButton';
import UserPresence from '../UserPresence';
import styles from './styles.module.scss';

export default function ProfilePane () {
  const params = useParams();
  const { users, friends } = useStore();
  
  const user = () => users.get(params.userId);
  const friend = () => friends.get(params.userId);

  const friendExists = () => !!friend();
  const isPending = () => friendExists() && friend().status === FriendStatus.PENDING;
  const isSent = () => friendExists() && friend().status === FriendStatus.SENT;
  const isFriend = () => friendExists() && friend().status === FriendStatus.FRIENDS;

  return (
    <Show when={user()}>
      <div>
        <div class={styles.topArea}>
          <div class={styles.banner}></div>
          <div class={styles.bannerFloatingItems}>
            <Avatar hexColor={user().hexColor} size={90} />
            <div class={styles.details}>
              <div class={styles.usernameTag}>
                <span class={styles.username}>{user().username}</span>
                <span class={styles.tag}>{`:${user().tag}`}</span>
              </div>
              <UserPresence userId={user()._id} showOffline={true} />
            </div>
            {isFriend() && <CustomButton class={styles.addFriendButton} iconName='mail' label='Message' />}
            {!friendExists() && <CustomButton class={styles.addFriendButton} iconName='group_add' label='Add Friend' />}
            {isSent() && <CustomButton class={styles.addFriendButton} iconName='close' label='Pending Request' color='var(--alert-color)' />}
            {isPending() && <CustomButton class={styles.addFriendButton} iconName='done' label='Accept Request' color='var(--success-color)' />}
          </div>
        </div>
      </div>
    </Show>
  )
} 