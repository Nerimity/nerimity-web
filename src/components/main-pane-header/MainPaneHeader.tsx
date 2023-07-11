import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/icon/Icon';
import useStore from '@/chat-api/store/useStore';
import UserPresence from '@/components/user-presence/UserPresence';
import { useDrawer } from '../ui/drawer/Drawer';
import { createEffect, createSignal, For, Show } from 'solid-js';
import { useWindowProperties } from '@/common/useWindowProperties';
import { postJoinVoice } from '@/chat-api/services/VoiceService';
import socketClient from '@/chat-api/socketClient';
import { useParams } from '@solidjs/router';
import Button from '../ui/Button';
import { ChannelIcon } from '../servers/drawer/ServerDrawer';
import { VoiceUser } from '@/chat-api/store/useVoiceUsers';




export default function MainPaneHeader() {
  const { servers, channels, users, header, voiceUsers } = useStore();
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


  return (
    <>
      <div onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)} class={classNames(styles.header, conditionalClass(isMobileWidth(), styles.isMobile))}>
        <Show when={isMobileWidth()}>
          <div class={styles.drawerIcon} onClick={toggleLeftDrawer}><Icon name='menu' /></div>
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
          <Show when={header.details().channelId}>
            <div class={styles.drawerIcon} onClick={onCallClick}><Icon name='call' /></div>
          </Show>
          <Show when={hasRightDrawer() && isMobileWidth()}>
            <div class={styles.drawerIcon} onClick={toggleRightDrawer}><Icon name='group' /></div>
          </Show>
        </div>
      </div>
      <VoiceHeader channelId={header.details().channelId} />
    </>
  )
}

const [showParticipants, setShowParticipants] = createSignal(true);

function VoiceHeader(props: { channelId?: string }) {
  const { voiceUsers } = useStore();

  const channelVoiceUsers = () => Object.values(voiceUsers.getVoiceInChannel(props.channelId!) || {});


  return (
    <Show when={channelVoiceUsers().length}>
      <div class={styles.headerVoiceParticipants}>
        <Show when={showParticipants()}>
          <VoiceParticipants channelId={props.channelId!} />
        </Show>
        <VoiceActions channelId={props.channelId!} />
      </div>
    </Show>
  )
}


function VoiceParticipants(props: { channelId: string }) {
  const { voiceUsers } = useStore();

  const channelVoiceUsers = () => Object.values(voiceUsers.getVoiceInChannel(props.channelId!) || {})

  return (
    <div class={styles.voiceParticipants}>
      <For each={channelVoiceUsers()}>
        {voiceUser => (
            <VoiceParticipantItem voiceUser={voiceUser!}/>
        )}
      </For>
    </div>
  )
}


function VoiceParticipantItem(props: {voiceUser: VoiceUser}) {
  const {voiceUsers} = useStore();

  const isMuted = () => {
    return !voiceUsers.micEnabled(props.voiceUser.channelId, props.voiceUser.userId);
  }
  const isInCall = () => voiceUsers.currentVoiceChannelId() === props.voiceUser.channelId;
  return (
    <div class={styles.voiceParticipantItem}>
      <Avatar user={props.voiceUser?.user!} size={60} />
      <Show when={isMuted() && isInCall()}>
        <Icon class={styles.muteIcon} name='mic_off' color='white' size={16} />
      </Show>
    </div>
  )
}


function VoiceActions(props: { channelId: string }) {
  const { voiceUsers, channels } = useStore();

  const channel = () => channels.get(props.channelId);

  const onCallClick = async () => {
    channel()?.joinCall();
  }

  const onCallEndClick = async () => {
    channel()?.leaveCall();
  }

  const isInCall = () => voiceUsers.currentVoiceChannelId() === props.channelId;


  return (
    <div class={styles.voiceActions}>
        <Show when={showParticipants()}><Button iconName='expand_less' color='rgba(255,255,255,0.6)' onClick={() => setShowParticipants(false)}  /></Show>
        <Show when={!showParticipants()}><Button iconName='expand_more' color='rgba(255,255,255,0.6)' onClick={() => setShowParticipants(true)}  /></Show>
      <Show when={!isInCall()}>
        <Button iconName='call' color='var(--success-color)' onClick={onCallClick}  label='Join' />
      </Show>
      <Show when={isInCall()}>
        <VoiceMicActions channelId={props.channelId} />
        <Button iconName='call_end' color='var(--alert-color)' onClick={onCallEndClick} label='Leave' />
      </Show>
    </div>
  )
}

function VoiceMicActions(props: { channelId: string }) {
  const { voiceUsers: {isLocalMicMuted, toggleMic} } = useStore();

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