import styles from './styles.module.scss';
import Avatar from "@/components/ui/Avatar";
import UserPresence from '@/components/user-presence/UserPresence';
import { Link, useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { createEffect, createMemo, createSignal, For, mapArray, on, onCleanup, onMount, Show } from 'solid-js';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import MemberContextMenu, { ServerMemberRoleModal } from '../member-context-menu/MemberContextMenu';
import { DrawerHeader } from '@/components/DrawerHeader';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import { css, styled } from 'solid-styled-components';
import useUsers, { avatarUrl, bannerUrl } from '@/chat-api/store/useUsers';
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
import { Banner } from '@/components/ui/Banner';
import { fetchChannelAttachments } from '@/chat-api/services/MessageService';
import { RawAttachment, RawMessage } from '@/chat-api/RawData';
import env from '@/common/env';
import { ImagePreviewModal } from '@/components/ui/ImageEmbed';
import { classNames, conditionalClass } from '@/common/classNames';
import socketClient from '@/chat-api/socketClient';
import { ServerEvents } from '@/chat-api/EventNames';
import { Markup } from '../Markup';
import { useResizeObserver } from '@/common/useResizeObserver';
import { ServerRole } from '@/chat-api/store/useServerRoles';
import { electronWindowAPI } from '@/common/Electron';
import { calculateTimeElapsedForActivityStatus } from '@/common/date';

const MemberItem = (props: { member: ServerMember }) => {
  const params = useParams<{ serverId: string }>();
  const user = () => props.member.user;
  let elementRef: undefined | HTMLDivElement;
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>(undefined);
  const [hovering, setHovering] = createSignal(false);
  const [modalPosition, setModalPosition] = createSignal<undefined | { left: number, top: number }>(undefined);
  const { isMobileWidth } = useWindowProperties();
  const { createPortal } = useCustomPortal();


  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({ x: event.clientX, y: event.clientY });
  }

  const onClick = (e: MouseEvent) => {
    if (isMobileWidth())  
      return createPortal(close => <MobileFlyout serverId={params.serverId} close={close} userId={user().id} />)
    if (modalPosition()) return setModalPosition(undefined);
    const rect = elementRef?.getBoundingClientRect()!;
    setModalPosition({ left: rect.left, top: rect.top });
  }

  return (
    <div classList={{openedMemberList: !!modalPosition()}} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} >
      {/* <div onMouseEnter={onHover} > */}
      <Show when={modalPosition()}><ProfileFlyout close={() => setModalPosition(undefined)} serverId={params.serverId} userId={user().id} left={modalPosition()!.left} top={modalPosition()!.top} /></Show>
      <MemberContextMenu position={contextPosition()} serverId={props.member.serverId} userId={props.member.userId} onClose={() => setContextPosition(undefined)} />
      <div onClick={onClick} ref={elementRef} class={styles.memberItem} oncontextmenu={onContextMenu} >
        <Avatar animate={hovering() || !!modalPosition()} size={30} user={user()} />
        <div class={styles.memberInfo}>
          <div class={styles.username} style={{ color: props.member.roleColor }} >{user().username}</div>
          <UserPresence animate={hovering() || !!modalPosition()} userId={user().id} showOffline={false} />
        </div>
      </div>
    </div>
  )
};


const Header = () => {

  return (<DrawerHeader text={`Information`} />);
}


const RightDrawer = () => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const [showAttachments, setShowAttachments] = createSignal(false);

  createEffect(on([() => params.channelId], (now, prev) => {
    setShowAttachments(false);
  }))

  return (
    <div class={styles.drawerContainer}>
      <Header />
      <Show when={!showAttachments()}><MainDrawer onShowAttachmentClick={() => setShowAttachments(true)} /></Show>
      <Show when={showAttachments()}><AttachmentDrawer onHideAttachmentClick={() => setShowAttachments(false)} /></Show>
    </div>
  )
};



const AttachmentDrawer = (props: { onHideAttachmentClick(): void }) => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const { channels } = useStore();

  const [attachments, setAttachments] = createSignal<RawAttachment[]>([]);

  const incrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 0);
    channel?.update({ _count: { attachments: count + 1 } });
  }
  const decrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 1);
    channel?.update({ _count: { attachments: count - 1 } });
  }

  onMount(async () => {
    const newAttachments = await fetchChannelAttachments(params.channelId!);
    setAttachments(newAttachments);
  })

  const onMessage = (payload: { message: RawMessage }) => {
    if (payload.message.channelId !== params.channelId) return;
    const attachment = payload?.message.attachments?.[0];
    if (!attachment) return;
    setAttachments([
      { ...attachment, messageId: payload.message.id },
      ...attachments()
    ])
    incrAttachments(params.channelId);
  }
  socketClient.useSocketOn(ServerEvents.MESSAGE_CREATED, onMessage)

  const onDelete = (payload: { messageId: string, channelId: string }) => {
    if (payload.channelId !== params.channelId) return;
    setAttachments(attachments().filter(attachment => attachment.messageId !== payload.messageId))
    decrAttachments(params.channelId);
  }
  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete)

  return (
    <>
      <Button
        label="Back"
        iconName='navigate_before'
        iconSize={16}
        onClick={props.onHideAttachmentClick}
        class={css`justify-content: start;`}
        padding={5} />
      <div class={styles.attachmentList}>
        <For each={attachments()}>
          {item => (
            <AttachmentImage attachment={item} />
          )}
        </For>
      </div>
    </>
  )
}

const AttachmentImage = (props: { attachment: RawAttachment }) => {
  const { createPortal } = useCustomPortal();


  const isFile = () => props.attachment.fileId;

  const isGif = () => props.attachment.path?.endsWith(".gif")

  const url = (ignoreFocus?: boolean) => {
    let url = `${env.NERIMITY_CDN}${props.attachment.path}`;
    if (ignoreFocus) return url;
    if (isGif()) return url += "?type=webp";
    return url;
  }

  const onClicked = (attachment: RawAttachment) => {
    createPortal(close => <ImagePreviewModal close={close} url={url(true)} width={attachment.width} height={attachment.height} />)
  }

  return (
    <div class={classNames(styles.attachmentImageContainer, conditionalClass(isGif(), styles.gif))}>
      <Show when={!isFile()}>
        <img class={styles.attachmentImage}
          loading="lazy"
          onClick={() => onClicked(props.attachment)}
          src={url()}
        />
      </Show>
      <Show when={isFile()}>
        <div class={styles.fileAttachment}>
          <Icon name='insert_drive_file' color='var(--primary-color)' size={40} />
        </div>
      </Show>
    </div>
  )
}



const MainDrawer = (props: { onShowAttachmentClick(): void }) => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const { channels, servers } = useStore();


  const channel = () => channels.get(params.channelId!);

  const incrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 0);
    channel?.update({ _count: { attachments: count + 1 } });
  }

  const decrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 1);
    channel?.update({ _count: { attachments: count - 1 } });
  }

  const onMessage = (payload: { message: RawMessage }) => {
    const attachment = payload?.message.attachments?.[0];
    if (!attachment) return;
    incrAttachments(payload.message.channelId);
  }
  socketClient.useSocketOn(ServerEvents.MESSAGE_CREATED, onMessage)

  const onDelete = (payload: { messageId: string, channelId: string }) => {
    decrAttachments(payload.channelId);
  }
  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete)


  return <>
    <Show when={!channel()?.recipientId}><BannerItem /></Show>
    <Show when={channel()?.recipientId}>
      <ProfileFlyout sidePane userId={channel()?.recipientId!} close={() => { }} />
    </Show>
    <Show when={channel()}>
      <Button
        label={`Attachments (${channel()?._count?.attachments ?? "..."})`}
        customChildren={<Icon class={css`margin-left: auto;`} size={16} name='navigate_next' />}
        iconName='attach_file'
        iconSize={16}
        onClick={props.onShowAttachmentClick}
        class={css`justify-content: start;`}
        padding={5} />
    </Show>
    <Show when={params.serverId}><ServerDrawer /></Show>
  </>
}


const BannerItem = () => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const { servers, channels } = useStore();

  const server = () => servers.get(params.serverId!);

  const channel = () => channels.get(params.channelId!)?.recipient;

  const bannerData = () => server() || channel() as { hexColor: string, banner?: string; };

  return (
    <Show when={bannerData()?.banner}>
      <Banner class={css`margin-left: 5px; margin-right: 5px;`} margin={0} brightness={100} hexColor={bannerData()?.hexColor} url={bannerUrl(bannerData()!)} />
    </Show>
  )
}


const ServerDrawer = () => {
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
    <Show when={server()} keyed={server()?.id}>
      <Text style={{ "margin-left": "10px" }}>Members ({members().length})</Text>
      <For each={roleMembers()}>
        {item => (
          <Show when={!item.role!.hideRole && item.members().length}>
            <RoleItem members={item.members()} roleName={item.role?.name!} />
          </Show>
        )}
      </For>

      {/* Offline */}
      <RoleItem members={offlineMembers()} roleName="Offline" />

    </Show>
  )
}

function RoleItem(props: { roleName: string, members: ServerMember[] }) {
  const [expanded, setExpanded] = createSignal(props.members.length <= 20);
  return (
    <div class={styles.roleItem}>
      <div class={styles.roleTitle} onclick={() => setExpanded(!expanded())}>
        <div class={styles.roleName}>{props.roleName} ({props.members.length}) </div>
        <Button class={styles.roleExpandButton} padding={5} margin={0} iconName={expanded() ? 'expand_more' : 'expand_less'} iconSize={12} />
      </div>
      <Show when={expanded()}>
        <For each={props.members}>
          {member => <MemberItem member={member!} />}
        </For>
      </Show>
    </div>
  )
}



const FlyoutContainer = styled(FlexRow)`
  position: fixed;
  z-index: 100111111111110;
  gap: 10px;
  width: 350px;
  align-items: flex-start;
`

const FlyoutInner = styled(FlexColumn) <{ mobile?: boolean, sidePane?: boolean }>`
  border-radius: 8px;
  padding: 5px;
  background-color: rgba(40, 40, 40, 0.8);
  backdrop-filter: blur(20px);
  border: solid 1px rgba(255, 255, 255, 0.2);
  overflow: auto;
  width: 300px;
  max-height: 600px;

  ${props => props.mobile ? `
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
    border-left: none;
    border-right: none;
    max-height: initial;
  ` : ''}
  ${props => props.sidePane ? `
    border-radius: 0;
    padding: 0;
    padding: 5px;
    background-color: transparent;
    backdrop-filter: none;
    border: none;
    padding-top: 0;
    max-height: initial;
  ` : ''}
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
  overflow: hidden;
`;

const flyoutAvatarStyles = css`
  margin-right: 5px;
`;

const RolesContainer = styled(FlexRow)`
  margin-bottom: 5px;
  flex-wrap: wrap;
`;

const RoleContainer = styled(FlexRow) <{ selectable?: boolean }>`
  background-color: rgba(80, 80, 80, 0.6);
  border-radius: 6px;
  padding: 5px;
  ${props => props.selectable ? `
    cursor: pointer;
    width: 14px;
    align-items: center;
    justify-content: center;
    background-color: rgba(80, 80, 80, 0.8);
    &:hover {
      background-color: #5a5a5a;
    }
  ` : ''}
`;

const BioContainer = styled("div")`
  border-radius: 6px;
  max-height: 300px;
  margin-bottom: 5px;
  flex-shrink: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  white-space: pre-line;
  line-height: 14px;
`;

const ProfileFlyout = (props: { sidePane?: boolean; mobile?: boolean; close?(): void, userId: string, serverId?: string, left?: number, top?: number }) => {
  const { createPortal } = useCustomPortal();
  const { users, account, serverMembers, posts } = useStore();
  const [details, setDetails] = createSignal<UserDetails | undefined>(undefined);
  const [hover, setHover] = createSignal(false);
  const { height } = useWindowProperties();
  const isMe = () => account.user()?.id === props.userId;
  const { isMobileWidth } = useWindowProperties();
  
  const isMobileWidthMemo = createMemo(() => isMobileWidth())
  createEffect(on(isMobileWidthMemo, (input, prevInput) => {
    props.close?.();
  }, {defer: true}))


  const user = () => {
    if (details()) return details()?.user
    if (isMe()) return account.user();
    const user = users.get(props.userId)
    if (user) return user;
  };

  const member = () => props.serverId && serverMembers.get(props.serverId, props.userId);

  createEffect(on(() => props.userId, async() => {
    setDetails(undefined);
    const details = await getUserDetailsRequest(props.userId);
    setDetails(details)
    if (!details.latestPost) return;
    posts.pushPost(details.latestPost)
  }))

  const latestPost = () => posts.cachedPost(details()?.latestPost?.id!);


  const followingCount = () => details()?.user._count.following.toLocaleString()
  const followersCount = () => details()?.user._count.followers.toLocaleString()


  const [flyoutRef, setFlyoutRef] = createSignal<HTMLDivElement | undefined>(undefined);
  const { height: flyoutHeight } = useResizeObserver(flyoutRef);


  createEffect(() => {
    if (!flyoutRef()) return;
    if (props.mobile) return;
    let newTop = props.top!;
    if ((flyoutHeight() + props.top!) > height()) newTop = height() - flyoutHeight() - (electronWindowAPI()?.isElectron ? 35 : 0);
    flyoutRef()!.style.top = newTop + "px";
  })


  onMount(() => {
    document.addEventListener("mousedown", onBackgroundClick)
    onCleanup(() => {
      document.removeEventListener("mousedown", onBackgroundClick)
    })
  })
  const onBackgroundClick = (event: MouseEvent) => {
    if (props.mobile) return;
    if (event.target instanceof Element) {
      if (event.target.closest(`.${FlyoutContainer.class({})}`)) return;
      if (event.target.closest(`.openedMemberList`)) return;
      props.close?.()
      
    };
  }


  const style = () => ({
    left: (props.left! - 350) + "px",
    ...(props.mobile ? {
      top: 'initial',
      bottom: "0",
      left: "0",
      right: "0",
      width: "initial",
      "align-items": "initial",
      "max-height": "70%",
      height: 'initial'
    } : undefined),
    ...(props.sidePane ? {
      position: 'relative',
      width: "initial",
      height: 'initial',
      "z-index": 1
    } : undefined)
  })

  const showRoleModal = () => {
    createPortal?.(close => <Modal maxHeight={500} maxWidth={350} close={close} title="Edit Roles" children={() => <ServerMemberRoleModal userId={member()?.userId!} serverId={member()?.serverId!} />} />)
  }

  const ShowFullProfileButton = () => (
    <Link href={RouterEndpoints.PROFILE(props.userId)} style={{ "text-decoration": 'none', display: 'flex', "margin-top": 'auto' }}>
      <Button onClick={props.close} iconName='person' label='View full profile' margin={0} class={css`margin-top: 5px;flex: 1;`} />
    </Link>
  )



  const ProfileArea = () => (
    <>
      <Banner maxHeight={200} margin={0} animate={!props.sidePane ? true : hover()} hexColor={user()?.hexColor} url={bannerUrl(user()!)} />
      <FlyoutDetailsContainer>
        <CustomLink href={RouterEndpoints.PROFILE(props.userId)}>
          <Avatar animate class={flyoutAvatarStyles} user={user()!} size={60} />
        </CustomLink>
        <FlyoutOtherDetailsContainer>
          <span>
            <CustomLink decoration style={{ color: 'white' }} href={RouterEndpoints.PROFILE(props.userId)}>
              <Text style={{ "overflow-wrap": "anywhere" }}>{user()!.username}</Text>
              <Text color='rgba(255,255,255,0.6)'>:{user()!.tag}</Text>
            </CustomLink>
          </span>
          <UserPresence hideActivity animate userId={props.userId} showOffline />
          <Text size={12} opacity={0.6}>{followingCount()} Following | {followersCount()} Followers</Text>
        </FlyoutOtherDetailsContainer>
      </FlyoutDetailsContainer>

      <Show when={member()}>
        <FlyoutTitle style={{ "margin-bottom": "5px" }} icon='leaderboard' title='Roles' />
        <RolesContainer gap={2}>
          <For each={member()?.roles()!}>
            {role => (<RoleContainer><Text color={role?.hexColor} size={12}>{role?.name}</Text></RoleContainer>)}
          </For>
          <RoleContainer onclick={showRoleModal} selectable><Icon name='add' size={14} /></RoleContainer>
        </RolesContainer>
      </Show>

      <UserActivity userId={props.userId} />

      <Show when={details()?.profile?.bio}>
        <FlyoutTitle icon='info' title='Bio' />
        <BioContainer>
          <Text size={12} color='rgba(255,255,255,0.7)'><Markup text={details()?.profile?.bio!} /></Text>
        </BioContainer>
      </Show>


    </>
  );

  const PostArea = () => (
    <>
      <FlyoutTitle style={{ "margin-bottom": "5px" }} icon='chat' title='Latest Post' />
      <PostItem post={latestPost()!} />
    </>
  )

  return (
    <Show when={details()}>
      <FlyoutContainer onMouseEnter={() => setHover(true)} onMouseLeave={(() => setHover(false))} ref={setFlyoutRef} class="modal" style={style()}>
        <FlyoutInner sidePane={props.sidePane} style={{ width: 'initial', flex: 1 }}>
          <ProfileArea />
          <Show when={latestPost()}>
            <PostArea />
          </Show>
          <ShowFullProfileButton />
        </FlyoutInner>
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
  let mouseDownTarget: HTMLDivElement | null = null;

  const onBackgroundClick = (event: MouseEvent) => {
    if (mouseDownTarget?.closest(".modal")) return;
    props.close?.()
  }


  return (
    <BackgroundContainer onclick={onBackgroundClick} onMouseDown={e => mouseDownTarget = e.target as any}>
      <ProfileFlyout mobile close={props.close} serverId={props.serverId} userId={props.userId} />
    </BackgroundContainer>
  )
}


function FlyoutTitle(props: { style?: JSX.CSSProperties, icon: string, title: string }) {
  return (
    <FlexRow gap={5} style={{ ...{ "align-items": 'center', "font-weight": "bold" }, ...props.style }}>
      <Icon color='var(--primary-color)' name={props.icon} size={14} />
      <Text size={13}>{props.title}</Text>
    </FlexRow>
  )
}



const UserActivity = (props: {userId: string}) => {
  const {users} = useStore();
  const user = () => users.get(props.userId);
  const activity = () => user()?.presence?.activity;
  const [playedFor, setPlayedFor] = createSignal("");

  createEffect(on(activity, () => {
    if (!activity()) return;

    setPlayedFor(calculateTimeElapsedForActivityStatus(activity()?.startedAt!));
    const intervalId = setInterval(() => {
      setPlayedFor(calculateTimeElapsedForActivityStatus(activity()?.startedAt!));
    }, 1000)

    onCleanup(() => {
      clearInterval(intervalId);
      
    })
  }))

  return (
    <Show when={activity()}>
      <FlexRow gap={6} class={css`margin-top: 4px; margin-bottom: 4px;`}>
        <Icon class={css`margin-top: 2px;`} name='games' size={14} color='var(--primary-color)' />
        <FlexColumn>
          <FlexRow gap={4}>
            <Text size={13}>{activity()?.action}</Text>
            <Text size={13} opacity={0.6}>{activity()?.name}</Text>
          </FlexRow>
          <Text size={13}>For {playedFor()}</Text>
        </FlexColumn>
      </FlexRow>


    </Show>
  )

}



export default RightDrawer;


