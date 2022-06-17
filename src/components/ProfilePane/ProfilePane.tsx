import { Link, useParams } from 'solid-app-router';
import { createEffect, createResource, createSignal, For, on, onMount, Show } from 'solid-js';
import { FriendStatus } from '../../chat-api/RawData';
import { getUserDetailsRequest, UserDetails } from '../../chat-api/services/UserService';
import useStore from '../../chat-api/store/useStore';
import { User } from '../../chat-api/store/useUsers';
import RouterEndpoints from '../../common/RouterEndpoints';
import { userStatusDetail, UserStatuses } from '../../common/userStatus';
import Avatar from '../Avatar';
import CustomButton from '../CustomButton';
import DropDown from '../DropDown';
import Icon from '../Icon';
import UserPresence from '../UserPresence';
import styles from './styles.module.scss';

export default function ProfilePane () {
  const params = useParams();
  const { users, friends, account, tabs } = useStore();
  
  const isMe = () => account.user()?._id === params.userId;

  const [userDetails] = createResource(() => params.userId, getUserDetailsRequest);
 


  const user = () => {
    const user = users.get(params.userId)
    if (user) return user;
    if (isMe()) return account.user();
  };

  const friend = () => friends.get(params.userId);
  


  const friendExists = () => !!friend();
  const isPending = () => friendExists() && friend().status === FriendStatus.PENDING;
  const isSent = () => friendExists() && friend().status === FriendStatus.SENT;
  const isFriend = () => friendExists() && friend().status === FriendStatus.FRIENDS;


  createEffect(on(user, () => {
    if (!user()) return;
    tabs.openTab({
      subName: "Profile",
      title: user()!.username,
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

  const presenceStatus = () => userStatusDetail((user() as User)?.presence?.status || 0)
  

  return (
    <Show when={user()}>
      <div class={styles.profilePane}>
        <div class={styles.topArea}>
          <div class={styles.banner}></div>
          <div class={styles.bannerFloatingItems}>
            <Avatar hexColor={user()!.hexColor} size={90} />
            <div class={styles.details}>
              <div class={styles.usernameTag}>
                <span class={styles.username}>{user()!.username}</span>
                <span class={styles.tag}>{`:${user()!.tag}`}</span>
              </div>
              <Show when={!isMe()}><UserPresence userId={user()!._id} showOffline={true} /></Show>
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
        <Show when={userDetails()}>
          <Content user={userDetails()!}  />
        </Show>
      </div>
    </Show>
  )
} 

function Content (props: {user: UserDetails}) {
  return (
    <div class={styles.content}>
      <SideBar user={props.user} />
      WIP
    </div>
  )
}

function SideBar (props: {user: UserDetails}) {
  return (
    <div class={styles.sidePane}>
      <MutualFriendList mutualFriendIds={props.user.mutualFriendIds} />
      <MutualServerList mutualServerIds={props.user.mutualServerIds} />
    </div>
  )
}

function MutualFriendList(props: {mutualFriendIds: string[]}) {
  const {users} = useStore();
  return (
    <>
      <div class={styles.title}><Icon name='group' size={14} class={styles.icon} />Mutual Friends</div>
      <div class={styles.list}>
        <For each={props.mutualFriendIds}>
          {(id: string) => {
            const user = users.get(id);
            return (
              <Link href={RouterEndpoints.PROFILE(user._id)} class={styles.item}>
                <Avatar hexColor={user.hexColor} size={30} />
                <div class={styles.name}>{user.username}</div>
              </Link>
            )
          }}
        </For>
      </div>
    </>
  )
}
function MutualServerList(props: {mutualServerIds: string[]}) {
  const {servers} = useStore();
  return (
    <>
      <div class={styles.title}><Icon name='dns' size={14} class={styles.icon} />Mutual Servers</div>
      <div class={styles.list}>
        <For each={props.mutualServerIds}>
          {(id: string) => {
            const server = servers.get(id);
            return (
              <Link href={RouterEndpoints.SERVER_MESSAGES(server._id, server.defaultChannel)} class={styles.item}>
                <Avatar hexColor={server.hexColor} size={30} />
                <div class={styles.name}>{server.name}</div>
              </Link>
            )
          }}
        </For>
      </div>
    </>
  )
}
