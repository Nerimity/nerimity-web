import styles from './styles.module.scss';
import { Link, useParams } from '@nerimity/solid-router';
import { createEffect, createResource, createSignal, For, on, onMount, Show } from 'solid-js';
import { FriendStatus, RawUser } from '@/chat-api/RawData';
import { followUser, getUserDetailsRequest, unfollowUser, updatePresence, UserDetails } from '@/chat-api/services/UserService';
import useStore from '@/chat-api/store/useStore';
import { avatarUrl, User } from '@/chat-api/store/useUsers';
import { getDaysAgo } from '../../common/date';
import RouterEndpoints from '../../common/RouterEndpoints';
import { userStatusDetail, UserStatuses } from '../../common/userStatus';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import DropDown from '@/components/ui/drop-down/DropDown';
import Icon from '@/components/ui/icon/Icon';
import UserPresence from '@/components/user-presence/UserPresence';
import { styled } from 'solid-styled-components';
import Text from '../ui/Text';
import { FlexRow } from '../ui/Flexbox';
import { useWindowProperties } from '@/common/useWindowProperties';
import { addFriend } from '@/chat-api/services/FriendService';
import { useDrawer } from '../ui/drawer/Drawer';
import { PostsArea } from '../PostsArea';

const ActionButtonsContainer = styled(FlexRow)`
  align-self: center;
  margin-left: auto;
  margin-right: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButtonContainer = styled(FlexRow)`
  align-items: center;
  border-radius: 8px;
  padding: 5px;
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ActionButton = (props: {icon?: string, label: string, color?: string, onClick?: () => void}) => {
  return (
    <ActionButtonContainer gap={5} onclick={props.onClick}>
      <Icon color={props.color} size={18} name={props.icon} />
      <Text size={12} opacity={0.9}>{props.label}</Text>
    </ActionButtonContainer>
  )
}


export default function ProfilePane () {
  const params = useParams();
  const { users, friends, account, header } = useStore();
  const drawer = useDrawer();
  const {width} = useWindowProperties();
  const isMe = () => account.user()?.id === params.userId;
  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);

  createEffect(on(() => params.userId, async (userId) => {
    setUserDetails(null)
    drawer.goToMain();
    fetchUserDetails(userId)
  }))

  const fetchUserDetails = async (userId: string) => {
    const userDetails = await getUserDetailsRequest(userId);
    setUserDetails(userDetails);
  }

  const user = () => {
    const user = users.get(params.userId)
    if (user) return user;
    if (isMe()) return account.user();
    return userDetails()?.user;
  };

  const friend = () => friends.get(params.userId);
  const friendExists = () => !!friend();

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
          <div 
            class={styles.banner} 
            style={{ 
              ...(user()?.avatar ? {
                "background-image": `url(${avatarUrl(user()!) + (user()?.avatar?.endsWith(".gif") ? '?type=png' : '')})`,
              } : {
                background: user()?.hexColor
              }),
              
              filter: "brightness(70%)"
            }}
          ></div>
          <div class={styles.bannerFloatingItems}>
            <Avatar animate url={avatarUrl(user())} hexColor={user()!.hexColor} size={90} />
            <div class={styles.details}>
              <div class={styles.usernameTag}>
                <span class={styles.username}>{user()!.username}</span>
                <span class={styles.tag}>{`:${user()!.tag}`}</span>
              </div>
              <Text size={14} color="rgba(255,255,255,0.6)">{userDetails()?.user._count.following.toLocaleString()} following | {userDetails()?.user._count.followers.toLocaleString()} followers</Text>
              <Show when={!isMe()}><UserPresence userId={user()!.id} showOffline={true} /></Show>
              <Show when={isMe()}><DropDown items={DropDownItems} selectedId={presenceStatus().id} /></Show>
            </div>
            <Show when={!isMe() && width() >= 700}>
              <ActionButtons updateUserDetails={() => fetchUserDetails(params.userId)} userDetails={userDetails()} user={user()} />
            </Show>
          </div>
          <Show when={!isMe() && width() < 700}>
            <ActionButtons updateUserDetails={() => fetchUserDetails(params.userId)} userDetails={userDetails()} user={user()} />
          </Show>
        </div>
        <Show when={userDetails()}>
          <Content user={userDetails()!}  />
        </Show>
      </div>
    </Show>
  )
} 

const ActionButtons = (props: { updateUserDetails(): void, userDetails?: UserDetails | null, user?: RawUser | null}) => {
  const params = useParams<{userId: string}>();
  const { friends , users} = useStore();

  const friend = () => friends.get(params.userId);
  const friendExists = () => !!friend();
  const isPending = () => friendExists() && friend().status === FriendStatus.PENDING;
  const isSent = () => friendExists() && friend().status === FriendStatus.SENT;
  const isFriend = () => friendExists() && friend().status === FriendStatus.FRIENDS;

  const acceptClicked = () => {
    friend().acceptFriendRequest();
  }
  
  const removeClicked = () => {
    friend().removeFriend();
  }
  
  const addClicked = () => {
    if (!props.user) return;
    addFriend({
      username: props.user.username,
      tag: props.user.tag
    })
  }

  const onMessageClicked = () => {
    users.openDM(params.userId);
  }

  const followClick = async () => {
    await followUser(params.userId);
    props.updateUserDetails();
  }

  const unfollowClick = async () => {
    await unfollowUser(params.userId);
    props.updateUserDetails();
  }

  const isFollowing = () => props.userDetails?.user.followers.length;

  return (
    <ActionButtonsContainer gap={3}>
      {!isFollowing() &&<ActionButton icon='add_circle' label='Follow' onClick={followClick}  color='var(--primary-color)' />}
      {isFollowing() &&<ActionButton icon='add_circle' label='Unfollow' onClick={unfollowClick}  color='var(--alert-color)' />}
      {isFriend() && <ActionButton icon='person_add_disabled' label='Remove Friend' color='var(--alert-color)' onClick={removeClicked} />}
      {!friendExists() && <ActionButton icon='group_add' label='Add Friend' color='var(--primary-color)' onClick={addClicked} />}
      {isSent() && <ActionButton icon='close' label='Pending Request' color='var(--alert-color)' onClick={removeClicked} />}
      {isPending() && <ActionButton icon='done' label='Accept Request' color='var(--success-color)' onClick={acceptClicked}  />}
      <ActionButton icon='block' label='Block (WIP)' color='var(--alert-color)'/>
      <ActionButton icon='flag' label='Report (WIP)' color='var(--alert-color)'/>
      <ActionButton icon='mail' label='Message' color='var(--primary-color)' onClick={onMessageClicked} />
    </ActionButtonsContainer>
  )
}


function Content (props: {user: UserDetails}) {
  return (
    <div class={styles.content}>
      <PostsContainer user={props.user} />
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
                  <Avatar url={user().avatarUrl()} hexColor={user().hexColor} size={20} />
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

function PostsContainer (props: {user: UserDetails}) {
  const [currentPage, setCurrentPage] = createSignal(0); // posts | with replies | liked

  const postCount = () => props.user.user._count.posts.toLocaleString();
  const likeCount  = () => props.user.user._count.likedPosts.toLocaleString();
  return (
    <div class={styles.bioArea}>
      <FlexRow gap={5} style={{"margin-bottom": "10px"}}>
        <Button padding={5} textSize={14} iconSize={14} margin={0} primary={currentPage() === 0} onClick={() => setCurrentPage(0)}  label='Posts' />
        <Button padding={5} textSize={14} iconSize={14} margin={0} primary={currentPage() === 1} onClick={() => setCurrentPage(1)} label={`Posts and replies (${postCount()})`} />
        <Button padding={5} textSize={14} iconSize={14} margin={0} primary={currentPage() === 2} onClick={() => setCurrentPage(2)} label={`Liked posts (${likeCount()})`} />
      </FlexRow>
      <Show when={props.user}>
        <PostsArea showLiked={currentPage() === 2} showReplies={currentPage() === 1} style={{width: "100%"}} userId={props.user.user.id}/>
      </Show>
    </div>
  )
}