import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/icon/Icon';
import useStore from '@/chat-api/store/useStore';
import UserPresence from '@/components/user-presence/UserPresence';
import { useDrawer } from '../ui/drawer/Drawer';
import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { useWindowProperties } from '@/common/useWindowProperties';
import { postJoinVoice } from '@/chat-api/services/VoiceService';
import socketClient from '@/chat-api/socketClient';
import { useParams } from '@solidjs/router';
import Button from '../ui/Button';
import { ChannelIcon } from '../servers/drawer/ServerDrawer';
import { VoiceUser } from '@/chat-api/store/useVoiceUsers';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import { RawNotification, getUserNotificationsRequest } from '@/chat-api/services/UserService';
import { FriendStatus, RawMessage, RawServer } from '@/chat-api/RawData';
import MessageItem from '../message-pane/message-item/MessageItem';
import { Message } from '@/chat-api/store/useMessages';
import { useResizeObserver } from '@/common/useResizeObserver';
import Text from '../ui/Text';
import { CustomLink } from '../ui/CustomLink';
import RouterEndpoints from '@/common/RouterEndpoints';
import { ScreenShareModal } from './ScreenShareModal';
import { CHANNEL_PERMISSIONS, ROLE_PERMISSIONS, hasBit } from '@/chat-api/Bitwise';




export default function MainPaneHeader() {
  const { servers, channels, users, header, voiceUsers, serverMembers, account, mentions, tickets, friends } = useStore();
  const { toggleLeftDrawer, toggleRightDrawer, hasRightDrawer, currentPage } = useDrawer();
  const { isMobileWidth } = useWindowProperties();
  const [hovered, setHovered] = createSignal(false);

  const server = () => servers.get(header.details().serverId!);
  const user = () => users.get(header.details().userId!);

  const channel = () => channels.get(header.details().channelId!!);

  const details = () => {
    let subName = null;
    let title = null;
    if (server()) {
      subName = server()?.name;
    }
    if (user()) {
      title = user().username;
    }

    if (header.details().title) {
      title = header.details().title;
    }

    if (header.details().subName) {
      subName = header.details().subName;
    }
    return { subName, title };
  }

  const onCallClick = async () => {
    if (voiceUsers.currentVoiceChannelId() === channel()?.id) return;
    channel()?.joinCall();
  }


  const [mentionListPosition, setMentionListPosition] = createSignal<boolean>(false);
  const onMentionButtonClick = (event: MouseEvent) => {
    setMentionListPosition(!mentionListPosition());
  }

  const canCall = () => {
    if (!header.details().channelId) return;
    if (!channel()?.serverId) return true;

    const hasChannelGotCallPermission = hasBit(channel()?.permissions || 0, CHANNEL_PERMISSIONS.JOIN_VOICE.bit);
    if (hasChannelGotCallPermission) return true;
    const member =  serverMembers.get(channel()?.serverId!, account.user()?.id!);
    const isAdmin = member?.amIServerCreator() || member?.hasPermission(ROLE_PERMISSIONS.ADMIN);
    return isAdmin;
  }

  const notificationCount = createMemo(() => {
    const friendRequestCount = friends.array().filter(friend => friend.status === FriendStatus.PENDING).length;

    const ticketNotifications = tickets.hasModerationTicketNotification() || tickets.hasTicketNotification();
  
    const mentionsCount = mentions.array().reduce((count, mention) => {
      return count + (mention?.count || 0)
    }, 0);

    return friendRequestCount + mentionsCount + (ticketNotifications ? 1 : 0);
  })

  return (
    <>
      <div onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)} class={classNames(styles.header, conditionalClass(isMobileWidth(), styles.isMobile))}>
        <Show when={isMobileWidth()}>
          <div class={styles.toggleLeftDrawerContainer}>
            <Show when={notificationCount()}>
              <div class={styles.notificationCounter}>{notificationCount()}</div>
            </Show>
            <Button iconName='menu' margin={[0, 8, 0, 5]} onClick={toggleLeftDrawer} />
          </div>
        </Show>
        {header.details().iconName && <Icon name={header.details().iconName} class={classNames(styles.icon, conditionalClass(server() || user(), styles.hasAvatar))} />}
        {server() && <Avatar animate={hovered()} size={25} server={server()} />}
        {user() && <Avatar animate={hovered()} size={25} user={user()} />}
        <div class={styles.details}>
          <div class={styles.title}>{details().title}</div>
          {details().subName && <div class={styles.subTitle}>{details().subName}</div>}
          {user() && <UserPresence userId={user()?.id} showOffline={true} animate={hovered()} />}
        </div>
        <div class={styles.rightIcons}>
          <Show when={canCall()}>
            <Button margin={3} iconName='call' onClick={onCallClick} />
          </Show>
            <Button margin={3} iconName='alternate_email' onClick={onMentionButtonClick} class="mentionListIcon" />
          <Show when={hasRightDrawer() && isMobileWidth()}>
            <Button margin={3} iconName='group' onClick={toggleRightDrawer} />
          </Show>
        </div>
      </div>
      <Show when={mentionListPosition()}>
        <MentionListPopup close={() => setMentionListPosition(false)} />
      </Show>
      <VoiceHeader channelId={header.details().channelId} />
    </>
  )
}

const MentionListPopup = (props: { close: () => void }) => {
  const { isMobileWidth } = useWindowProperties();
  const [elementRef, setElementRef] = createSignal<undefined | HTMLDivElement>(undefined);
  const { width } = useResizeObserver(elementRef);
  const [notifications, setNotifications] = createSignal<RawNotification[] | null>(null);

  onMount(async () => {
    const notifications = await getUserNotificationsRequest();
    setNotifications(notifications);
    document.addEventListener("click", onDocClick);
    onCleanup(() => {
      document.removeEventListener("click", onDocClick);
    })
  })

  const onDocClick = (event: any) => {
    if (event.target.closest(`.mentionListIcon`)) return;
    if (!event.target.closest(`.${styles.mentionListContainer}`)) props.close();
  }



  return (
    <div ref={setElementRef} class={classNames(styles.mentionListContainer, conditionalClass(isMobileWidth(), styles.mobile))}>
      <Show when={notifications() && !notifications()?.length}>
        <div class={styles.noMentions}>
          <Icon name='alternate_email' size={40} />
          <Text>No Mentions</Text>
        </div>
      </Show>
      <Show when={notifications()}>
        <For each={notifications()}>
          {notification => (
            <div>
              <MentionServerHeader serverId={notification.server.id} />
              <MessageItem message={notification.message} hideFloating />
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}

const MentionServerHeader = (props: { serverId: string }) => {
  const { servers } = useStore();
  const server = () => servers.get(props.serverId);
  return (
    <div class={styles.mentionServerHeader}>
      <Avatar server={server()} size={30} />
      <Text>{server()!.name}</Text>
    </div>
  )
}

const [showParticipants, setShowParticipants] = createSignal(true);

function VoiceHeader(props: { channelId?: string }) {
  const { voiceUsers, account } = useStore();

  const [selectedUserId, setSelectedUserId] = createSignal<null | string>(null);

  const channelVoiceUsers = () => voiceUsers.getVoiceUsers(props.channelId!)
  const videoStreamingUsers = () => channelVoiceUsers().filter(v => v.videoStream);

  createEffect(on(videoStreamingUsers, (now, prev) => {
    if (!now?.length) setSelectedUserId(null);
    if (!prev?.length && now.length) {
      setSelectedUserId(now[0].userId)
    }
  }))

  const selectedVoiceUser = () => {
    if (!selectedUserId()) return null;
    return videoStreamingUsers().find(v => v.userId === selectedUserId())
  }


  const isSomeoneVideoStreaming = () => voiceUsers.videoEnabled(props.channelId!, account.user()?.id!) || channelVoiceUsers().find(v => v?.videoStream)

  return (
    <Show when={channelVoiceUsers().length}>
      <div class={classNames(styles.headerVoiceParticipants, conditionalClass(isSomeoneVideoStreaming(), styles.videoStream), conditionalClass(!showParticipants(), styles.miniView))}>
        <Show when={showParticipants()}>
          <div class={styles.top}>
            <VoiceParticipants onClick={setSelectedUserId} selectedUserId={selectedUserId()} channelId={props.channelId!} size={isSomeoneVideoStreaming() ? 'small' : undefined} />
            <Show when={isSomeoneVideoStreaming()}>
              <div class={styles.videoContainer}>
                <VideoStream mediaStream={selectedVoiceUser()?.videoStream!} mute={selectedVoiceUser()?.userId === account.user()?.id} />
              </div>
            </Show>
          </div>
        </Show>
        <VoiceActions channelId={props.channelId!} />
      </div>
    </Show>
  )
}

function VideoStream(props: { mediaStream: MediaStream, mute?: boolean }) {
  let videoEl: HTMLVideoElement | undefined = undefined;

  createEffect(() => {
    if (!videoEl) return;
    videoEl.srcObject = props.mediaStream
  })

  return (
    <video ref={videoEl} autoplay muted={props.mute} />
  )
}


function VoiceParticipants(props: { channelId: string, selectedUserId?: string | null; size?: "small", onClick: (userId: string) => void; }) {
  const { voiceUsers } = useStore();

  const channelVoiceUsers = () => voiceUsers.getVoiceUsers(props.channelId!)

  return (
    <div class={styles.voiceParticipants}>
      <For each={channelVoiceUsers()}>
        {voiceUser => (
          <VoiceParticipantItem onClick={() => props.onClick(voiceUser.userId)} selected={voiceUser.userId === props.selectedUserId} voiceUser={voiceUser!} size={props.size} />
        )}
      </For>
    </div>
  )
}


function VoiceParticipantItem(props: { voiceUser: VoiceUser, selected: boolean; size?: "small", onClick: () => void; }) {
  const { voiceUsers } = useStore();

  const isMuted = () => {
    return !voiceUsers.micEnabled(props.voiceUser.channelId, props.voiceUser.userId);
  }

  const isVideoStreaming = () => voiceUsers.videoEnabled(props.voiceUser.channelId, props.voiceUser.userId);

  const isInCall = () => voiceUsers.currentVoiceChannelId() === props.voiceUser.channelId;
  const talking = () => props.voiceUser.voiceActivity;
  const user = () => props.voiceUser.user!;

  const onClick = (event: MouseEvent) => {
    if (props.size !== "small") return;
    if (!props.selected) {
      props.onClick();
      event.preventDefault();
    }
  }

  return (
    <CustomLink onClick={onClick} href={RouterEndpoints.PROFILE(user().id)} class={classNames(styles.voiceParticipantItem, conditionalClass(props.selected, styles.selected))}>
      <Avatar user={user()}  size={props.size === "small" ? 40 : 60} voiceIndicator animate={talking() } />
      <Show when={isMuted() && isInCall()}>
        <Icon class={styles.muteIcon} name='mic_off' color='white' size={16} />
      </Show>
      <Show when={isVideoStreaming()}>
        <Icon class={styles.videoStreamIcon} name='monitor' color='white' size={16} />
      </Show>
    </CustomLink>
  )
}


function VoiceActions(props: { channelId: string }) {
  const { voiceUsers, channels } = useStore();
  const { createPortal } = useCustomPortal();
  const {isMobileAgent} = useWindowProperties()

  const channel = () => channels.get(props.channelId);

  const onCallClick = async () => {
    channel()?.joinCall();
  }

  const onCallEndClick = async () => {
    channel()?.leaveCall();
  }

  const isInCall = () => voiceUsers.currentVoiceChannelId() === props.channelId;


  const onScreenShareClick = () => {
    createPortal(close => <ScreenShareModal close={close} />)
  }

  const onStopScreenShareClick = () => {
    voiceUsers.setVideoStream(null);
  }

  return (
    <div class={styles.voiceActions}>
      <Show when={showParticipants()}><Button iconName='expand_less' color='rgba(255,255,255,0.6)' onClick={() => setShowParticipants(false)} /></Show>
      <Show when={!showParticipants()}><Button iconName='expand_more' color='rgba(255,255,255,0.6)' onClick={() => setShowParticipants(true)} /></Show>
      <Show when={!isInCall()}>
        <Button iconName='call' color='var(--success-color)' onClick={onCallClick} label='Join' />
      </Show>
      <Show when={isInCall()}>
        <Show when={!voiceUsers.localStreams.videoStream && !isMobileAgent()}>
          <Button iconName='monitor' onClick={onScreenShareClick} />
        </Show>
        <Show when={voiceUsers.localStreams.videoStream}>
          <Button iconName='desktop_access_disabled' onClick={onStopScreenShareClick}  color='var(--alert-color)'  />
        </Show>
        <VoiceMicActions channelId={props.channelId} />
        <Button iconName='call_end' color='var(--alert-color)' onClick={onCallEndClick} label='Leave' />
      </Show>
    </div>
  )
}

function VoiceMicActions(props: { channelId: string }) {
  const { voiceUsers: { isLocalMicMuted, toggleMic } } = useStore();

  return (
    <>
      <Show when={isLocalMicMuted()}>
        <Button iconName='mic_off' color='var(--alert-color)' label='Muted' onClick={toggleMic} />
      </Show>
      <Show when={!isLocalMicMuted()}>
        <Button iconName='mic' color='var(--success-color)' onClick={toggleMic} />
      </Show>
    </>
  )
}