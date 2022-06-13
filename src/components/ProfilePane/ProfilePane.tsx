import { useParams } from 'solid-app-router';
import { createEffect, createSignal, on, onMount, Show } from 'solid-js';
import { FriendStatus } from '../../chat-api/RawData';
import useStore from '../../chat-api/store/useStore';
import RouterEndpoints from '../../common/RouterEndpoints';
import { userStatusDetail, UserStatuses } from '../../common/userStatus';
import Avatar from '../Avatar';
import CustomButton from '../CustomButton';
import DropDown from '../DropDown';
import UserPresence from '../UserPresence';
import styles from './styles.module.scss';

export default function ProfilePane () {
  const params = useParams();
  const { users, friends, account, tabs } = useStore();
  
  const user = () => users.get(params.userId);
  const friend = () => friends.get(params.userId);
  

  const isMe = () => account.user()?._id === params.userId;

  const friendExists = () => !!friend();
  const isPending = () => friendExists() && friend().status === FriendStatus.PENDING;
  const isSent = () => friendExists() && friend().status === FriendStatus.SENT;
  const isFriend = () => friendExists() && friend().status === FriendStatus.FRIENDS;


  createEffect(on(user, () => {
    if (!user()) return;
    tabs.openTab({
      subName: "Profile",
      title: user().username,
      iconName: 'person',
      path: RouterEndpoints.PROFILE(params.userId),
    })
  }))


  const DropDownItems = UserStatuses.map((item, i) => {
    return {
      circleColor: item.color,
      id: item.id,
      label: item.name,
      onClick: (item: any) => {
        account.updatePresence(i);
      }
    }
  })

  const presenceStatus = () => userStatusDetail(user().presence?.status || 0);

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
              <Show when={!isMe()}><UserPresence userId={user()._id} showOffline={true} /></Show>
              <Show when={isMe()}><DropDown items={DropDownItems} selectedId={presenceStatus().id} /></Show>
            </div>
            <Show when={!isMe()}>
              {isFriend() && <CustomButton class={styles.addFriendButton} iconName='mail' label='Message' />}
              {!friendExists() && <CustomButton class={styles.addFriendButton} iconName='group_add' label='Add Friend' />}
              {isSent() && <CustomButton class={styles.addFriendButton} iconName='close' label='Pending Request' color='var(--alert-color)' />}
              {isPending() && <CustomButton class={styles.addFriendButton} iconName='done' label='Accept Request' color='var(--success-color)' />}
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
} 