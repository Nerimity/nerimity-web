import styles from './styles.module.scss';
import Avatar from "@/components/ui/Avatar";
import UserPresence from '@/components/user-presence/UserPresence';
import { Link, useParams } from '@nerimity/solid-router';
import useStore from '@/chat-api/store/useStore';
import { createEffect, createMemo, createSignal, For, mapArray, on, onCleanup, onMount, Show } from 'solid-js';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import MemberContextMenu, { ServerMemberRoleModal } from '../../../member-context-menu/MemberContextMenu';
import { DrawerHeader } from '@/components/DrawerHeader';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import { css, styled } from 'solid-styled-components';
import useUsers, { avatarUrl } from '@/chat-api/store/useUsers';
import Text from '@/components/ui/Text';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import { getUserDetailsRequest, UserDetails } from '@/chat-api/services/UserService';
import { PostItem } from '@/components/PostsArea';
import Icon from '@/components/ui/icon/Icon';
import { JSX } from 'solid-js';
import { useWindowProperties } from '@/common/useWindowProperties';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import RouterEndpoints from '@/common/RouterEndpoints';
import { CustomLink } from '@/components/ui/CustomLink';

const MemberItem = (props: { member: ServerMember }) => {
  const params = useParams<{ serverId: string }>();
  const user = () => props.member.user;
  let elementRef: undefined | HTMLAnchorElement;
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>(undefined);
  const [hoveringRect, setHoveringRect] = createSignal<undefined | { left: number, top: number }>(undefined);
  const { isMobileWidth } = useWindowProperties();
  const { createPortal } = useCustomPortal();


  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({ x: event.clientX, y: event.clientY });
  }

  const onHover = () => {
    if (isMobileWidth()) return;
    const rect = elementRef?.getBoundingClientRect()!;
    setHoveringRect({ left: rect.left, top: rect.top });
  }
  const onClick = (e: MouseEvent) => {
    if (isMobileWidth()) e.preventDefault();
    createPortal(close => <MobileFlyout serverId={params.serverId} close={close} userId={user().id} />)
  }

  return (
    <div onMouseEnter={onHover} onMouseLeave={() => setHoveringRect(undefined)} >
      <Show when={hoveringRect()}><ProfileFlyout serverId={params.serverId} userId={user().id} left={hoveringRect()!.left} top={hoveringRect()!.top} /></Show>
      <MemberContextMenu position={contextPosition()} serverId={props.member.serverId} userId={props.member.userId} onClose={() => setContextPosition(undefined)} />
      <CustomLink onClick={onClick} href={RouterEndpoints.PROFILE(props.member.userId)}  ref={elementRef} class={styles.memberItem} oncontextmenu={onContextMenu} >
        <Avatar animate={!!hoveringRect()} size={30} user={user()} />
        <div class={styles.memberInfo}>
          <div class={styles.username} style={{ color: props.member.roleColor() }} >{user().username}</div>
          <UserPresence userId={user().id} showOffline={false} />
        </div>
      </CustomLink>
    </div>
  )
};


const Header = () => {
  const params = useParams();
  const { serverMembers } = useStore();

  const members = () => serverMembers.array(params.serverId);
  return (<DrawerHeader text={`Members (${members().length})`} />);
}


const ServerMembersDrawer = () => {
  const params = useParams();
  const { servers, serverMembers, serverRoles } = useStore();
  const server = () => servers.get(params.serverId!);


  const roles = () => serverRoles.getAllByServerId(params.serverId);

  const members = () => serverMembers.array(params.serverId);

  const roleMembers = mapArray(roles, role => {

    const membersInThisRole = () => members().filter(member => {
      if (!member?.user.presence?.status) return false;
      if (server()?.defaultRoleId === role!.id && !member?.unhiddenRole()) return true;
      if (member?.unhiddenRole()?.id === role!.id) return true;
    });

    return { role, members: createMemo(() => membersInThisRole()) }
  })

  const offlineMembers = createMemo(() => members().filter(member => !member?.user.presence?.status))


  return (
    <div class={styles.drawerContainer}>
      <Header />
      <For each={roleMembers()}>
        {item => (
          <Show when={!item.role!.hideRole && item.members().length}>
            <div class={styles.roleItem}>
              <div class={styles.roleName}>{item.role!.name} ({item.members().length})</div>
              <For each={item.members()}>
                {member => <MemberItem member={member!} />}
              </For>
            </div>
          </Show>
        )}
      </For>

      {/* Offline */}
      <div class={styles.roleItem}>
        <div class={styles.roleName}>Offline ({offlineMembers().length})</div>
        <For each={offlineMembers()}>
          {member => <MemberItem member={member!} />}
        </For>
      </div>
    </div>
  )
};




const FlyoutContainer = styled(FlexColumn)`
  position: fixed;
  border-radius: 8px;
  width: 300px;
  padding: 10px;
  background-color: rgba(40, 40, 40, 0.6);
  backdrop-filter: blur(20px);
  border: solid 1px rgba(255, 255, 255, 0.2);
  overflow: auto;
  z-index: 100111111111110;
`
const BannerContainer = styled("div")`
  filter: brightness(70%);
  height: 70px;
  width: 100%;
  border-radius: 8px;
  flex-shrink: 0;

  position: relative;
  filter: brightness(70%);
  
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    backdrop-filter: blur(50px);
    z-index: 111111;
    inset: 0;
  }
`;

const FlyoutDetailsContainer = styled(FlexRow)`
  position: relative;
  margin-left: 10px;
  z-index: 111111111;
  margin-top: -18px;
  margin-bottom: 10px;
`;
const FlyoutOtherDetailsContainer = styled(FlexColumn)`
  margin-top: 20px;
`;

const flyoutAvatarStyles = css`
  margin-right: 5px;
`;

const RolesContainer = styled(FlexRow)`
  margin-bottom: 10px;
  flex-wrap: wrap;
`;

const RoleContainer = styled(FlexRow) <{ selectable?: boolean }>`
  background-color: rgba(80, 80, 80, 0.6);
  border-radius: 8px;
  padding: 3px;
  ${props => props.selectable ? `
    cursor: pointer;
    &:hover {
      background-color: rgba(80, 80, 80, 0.8);
    }
  ` : ''}
`;

const ProfileFlyout = (props: { close?(): void, userId: string, serverId: string, left?: number, top?: number }) => {
  const { createPortal } = useCustomPortal();
  const { users, serverMembers, posts } = useStore();
  const [details, setDetails] = createSignal<UserDetails | undefined>(undefined);
  const { isMobileWidth, height } = useWindowProperties();

  const user = () => users.get(props.userId);
  const member = () => serverMembers.get(props.serverId, props.userId);

  onMount(() => {
    const timeoutId = window.setTimeout(async () => {
      const details = await getUserDetailsRequest(props.userId);
      setDetails(details)
      if (!details.latestPost) return;
      posts.pushPost(details.latestPost)
    }, isMobileWidth() ? 0 : 500);
    onCleanup(() => {
      window.clearTimeout(timeoutId);
    })
  })

  const latestPost = () => posts.cachedPost(details()?.latestPost?.id!);


  const followingCount = () => details()?.user._count.following.toLocaleString()
  const followersCount = () => details()?.user._count.followers.toLocaleString()


  const [flyoutRef, setFlyoutRef] = createSignal<HTMLDivElement | undefined>(undefined);


  createEffect(() => {
    if (!flyoutRef()) return;
    if (isMobileWidth()) return;
    const flyoutHeight = flyoutRef()!.getBoundingClientRect().height;
    let newTop = props.top!;
    if ((flyoutHeight + props.top!) > height()) newTop =  height() - flyoutHeight;
    flyoutRef()!.style.top = newTop + "px";
  })


  const style = () => ({
    left: (props.left! - 320) + "px",
    ...(isMobileWidth() ? {
      top: 'initial',
      bottom: "10px",
      left: "10px",
      right: "10px",
      width: "initial",
      "max-height": "70%",
      height: 'initial'
    } : undefined)
  })

  const showRoleModal = () => {
    createPortal?.(close => <Modal maxHeight={500} maxWidth={350} close={close} title="Edit Roles" children={() => <ServerMemberRoleModal userId={member()?.userId!} serverId={member()?.serverId!} />} />)
  }

  return (
    <Show when={details()}>
      <FlyoutContainer ref={setFlyoutRef} class="modal" style={style()}>
      <BannerContainer
         style={{
            ...(user()?.avatar ? {
              "background-image": `url(${avatarUrl(user()!) + (user()?.avatar?.endsWith(".gif") ? '?type=png' : '')})`,
            } : {
              background: user()?.hexColor
            }),
            
          }}
         />
        <FlyoutDetailsContainer>
          <Avatar animate  class={flyoutAvatarStyles} user={user()} size={60} />
          <FlyoutOtherDetailsContainer>
            <span>
              <Text style={{ "overflow-wrap": "anywhere"}}>{user().username}</Text>
              <Text color='rgba(255,255,255,0.6)'>:{user().tag}</Text>
            </span>
            <Text size={12} opacity={0.6}>{followingCount()} Following | {followersCount()} Followers</Text>
            <UserPresence userId={props.userId} showOffline />
          </FlyoutOtherDetailsContainer>
        </FlyoutDetailsContainer>
        <Show when={member()}>
          <FlyoutTitle style={{ "margin-bottom": "5px" }} icon='leaderboard' title='Roles' />
          <RolesContainer gap={3}>
            <For each={member()?.roles()!}>
              {role => (<RoleContainer><Text color={role?.hexColor} size={14}>{role?.name}</Text></RoleContainer>)}
            </For>
            <RoleContainer onclick={showRoleModal} selectable><Icon name='add' size={14} /></RoleContainer>
          </RolesContainer>
        </Show>
        <Show when={latestPost()}>
          <FlyoutTitle style={{ "margin-bottom": "5px" }} icon='chat' title='Latest Post' />
          <PostItem post={latestPost()!} />
        </Show>
        <Link href={RouterEndpoints.PROFILE(props.userId)} style={{ "text-decoration": 'none', display: 'flex' }}>
          <Button onClick={props.close} iconName='person' label='View full profile' margin={0} class={css`margin-top: 5px;flex: 1;`} />
        </Link>
      </FlyoutContainer>
    </Show>
  )
}

const BackgroundContainer = styled("div")`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1111;
`;
function MobileFlyout(props: { userId: string, serverId: string, close: () => void }) {
  const { isMobileWidth } = useWindowProperties();
  let mouseDownTarget: HTMLDivElement | null = null;

  const onBackgroundClick = (event: MouseEvent) => {
    if (mouseDownTarget?.closest(".modal")) return;
    props.close?.()
  }

  createEffect(() => {
    if (!isMobileWidth()) props.close();
  })

  return (
    <BackgroundContainer onclick={onBackgroundClick} onMouseDown={e => mouseDownTarget = e.target as any}>
      <ProfileFlyout close={props.close} serverId={props.serverId} userId={props.userId} />
    </BackgroundContainer>
  )
}


function FlyoutTitle(props: { style?: JSX.CSSProperties, icon: string, title: string }) {
  return (
    <FlexRow gap={5} style={{ ...{ "align-items": 'center' }, ...props.style }}>
      <Icon color='var(--primary-color)' name={props.icon} size={14} />
      <Text>{props.title}</Text>
    </FlexRow>
  )
}



export default ServerMembersDrawer;


