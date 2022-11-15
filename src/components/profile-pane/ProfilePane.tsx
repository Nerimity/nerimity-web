import { Link, useParams } from '@nerimity/solid-router';
import { createEffect, createResource, createSignal, For, on, onMount, Show } from 'solid-js';
import { FriendStatus } from '@/chat-api/RawData';
import { getUserDetailsRequest, updatePresence, UserDetails } from '@/chat-api/services/UserService';
import useStore from '@/chat-api/store/useStore';
import { User } from '@/chat-api/store/useUsers';
import { getDaysAgo } from '../../common/date';
import RouterEndpoints from '../../common/RouterEndpoints';
import { userStatusDetail, UserStatuses } from '../../common/userStatus';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import DropDown from '@/components/ui/drop-down/DropDown';
import Icon from '@/components/ui/icon/Icon';
import UserPresence from '@/components/user-presence/UserPresence';
import styles from './styles.module.scss';

export default function ProfilePane () {
  const params = useParams();
  const { users, friends, account, header } = useStore();
  
  const isMe = () => account.user()?.id === params.userId;

  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);

  createEffect(on(() => params.userId, async (userId) => {
    setUserDetails(null)
    const userDetails = await getUserDetailsRequest(userId);
    setUserDetails(userDetails);
  }))


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
    header.updateHeader({
      subName: "Profile",
      title: user()!.username,
      iconName: 'person',
    })
  }))


  const DropDownItems = UserStatuses.map((item, i) => {
    return {
      circleColor: item.color,
      id: item.id,
      label: item.name,
      onClick: () => {
        updatePresence(i);
      }
    }
  })

  const presenceStatus = () => userStatusDetail((user() as User)?.presence?.status || 0)
  

  return (
    <Show when={user()}>
      <div class={styles.profilePane}>
        <div class={styles.topArea}>
          <div class={styles.banner} style={{background: user()?.hexColor, filter: "brightness(70%)"}}></div>
          <div class={styles.bannerFloatingItems}>
            <Avatar hexColor={user()!.hexColor} size={90} />
            <div class={styles.details}>
              <div class={styles.usernameTag}>
                <span class={styles.username}>{user()!.username}</span>
                <span class={styles.tag}>{`:${user()!.tag}`}</span>
              </div>
              <Show when={!isMe()}><UserPresence userId={user()!.id} showOffline={true} /></Show>
              <Show when={isMe()}><DropDown items={DropDownItems} selectedId={presenceStatus().id} /></Show>
            </div>
            <Show when={!isMe()}>
              {isFriend() && <Button class={styles.addFriendButton} iconName='mail' label='Message' />}
              {!friendExists() && <Button class={styles.addFriendButton} iconName='group_add' label='Add Friend' />}
              {isSent() && <Button class={styles.addFriendButton} iconName='close' label='Pending Request' color='var(--alert-color)' />}
              {isPending() && <Button class={styles.addFriendButton} iconName='done' label='Accept Request' color='var(--success-color)' />}
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
      <BioArea user={props.user} />
      <SideBar user={props.user} />
    </div>
  )
}




function SideBar (props: {user: UserDetails}) {
  const joinedAt = getDaysAgo(props.user.user.joinedAt!);

  
  return (
    <div class={styles.sidePane}>
      <UserBioItem icon='event' label='Joined' value={joinedAt} />
      <div class={styles.separator}/>
      <MutualFriendList mutualFriendIds={props.user.mutualFriendIds} />
      <MutualServerList mutualServerIds={props.user.mutualServerIds} />
    </div>
  )
}

function MutualFriendList(props: {mutualFriendIds: string[]}) {
  const {users} = useStore();
  return (
    <div class={styles.block}>
      <div class={styles.title}><Icon name='group' size={18} class={styles.icon} />Mutual Friends</div>
      <div class={styles.list}>
        <For each={props.mutualFriendIds}>
          {(id: string) => {
            const user = () => users.get(id);
            return (
              <Show when={user()}>
                <Link href={RouterEndpoints.PROFILE(user().id)} class={styles.item}>
                  <Avatar hexColor={user().hexColor} size={20} />
                  <div class={styles.name}>{user().username}</div>
                </Link>
              </Show>
            )
          }}
        </For>
      </div>
    </div>
  )
}
function MutualServerList(props: {mutualServerIds: string[]}) {
  const {servers} = useStore();
  return (
    <div class={styles.block}>
      <div class={styles.title}><Icon name='dns' size={18} class={styles.icon} />Mutual Servers</div>
      <div class={styles.list}>
        <For each={props.mutualServerIds}>
          {(id: string) => {
            const server = () => servers.get(id);
            return (
              <Show when={server()}>
                <Link href={RouterEndpoints.SERVER_MESSAGES(server()!.id, server()!.defaultChannelId)} class={styles.item}>
                  <Avatar hexColor={server()!.hexColor} size={20} />
                  <div class={styles.name}>{server()!.name}</div>
                </Link>
              </Show>
            )
          }}
        </For>
      </div>
    </div>
  )
}



function UserBioItem (props: {icon: string, label: string, value: string}) {
  return (
    <div class={styles.userBioItem}>
      <Icon name={props.icon} size={18} />
      <div class={styles.label} >{props.label}</div>
      <div class={styles.value} >{props.value}</div>
    </div>
  );
}

function BioArea (props: {user: UserDetails}) {
  return <div class={styles.bioArea}>HTML Bio not implemented yet.</div>
}