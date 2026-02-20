import style from "./Voiceheader.module.css";
import useStore from "@/chat-api/store/useStore";
import { cn, conditionalClass } from "@/common/classNames";
import Button from "@/components/ui/Button";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  Show
} from "solid-js";
import { ScreenShareModal } from "../ScreenShareModal";
import { WebcamModal } from "../WebcamModal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { useWindowProperties } from "@/common/useWindowProperties";
import Icon from "@/components/ui/icon/Icon";
import Avatar from "@/components/ui/Avatar";
import { CustomLink } from "@/components/ui/CustomLink";
import MemberContextMenu from "@/components/member-context-menu/MemberContextMenu";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useParams } from "solid-navigator";
import { VoiceUser } from "@/chat-api/store/useVoiceUsers";
import { t } from "@nerimity/i18lite";

const [showParticipants, setShowParticipants] = createSignal(true);

export function VoiceHeader(props: { channelId?: string }) {
  let headerRef: HTMLDivElement | undefined;
  createEffect(() => {
    if (!showParticipants() && headerRef) {
      headerRef.style.height = "";
      headerRef.style.minHeight = "";
    }
  });
  const { voiceUsers, account } = useStore();

  const [selectedUserId, setSelectedUserId] = createSignal<null | string>(null);

  const channelVoiceUsers = () =>
    voiceUsers.getVoiceUsersByChannelId(props.channelId!);
  const videoStreamingUsers = () =>
    channelVoiceUsers().filter((v) => voiceUsers.videoEnabled(v.userId));

  createEffect(
    on(videoStreamingUsers, (now, prev) => {
      if (!now?.length) setSelectedUserId(null);
      if (!prev?.length && now.length) {
        setSelectedUserId(now[0]!.userId);
      }
    })
  );

  const selectedVoiceUser = () => {
    if (!selectedUserId()) return null;
    return videoStreamingUsers().find((v) => v.userId === selectedUserId());
  };

  const isSomeoneVideoStreaming = () =>
    channelVoiceUsers().find((v) => voiceUsers.videoEnabled(v.userId));

  return (
    <Show when={channelVoiceUsers().length}>
      <div
        ref={headerRef}
        class={cn(
          style.headerVoiceParticipants,
          conditionalClass(isSomeoneVideoStreaming(), style.videoStream),
          conditionalClass(!showParticipants(), style.miniView)
        )}
      >
        <Show when={showParticipants()}>
          <div class={style.top}>
            <VoiceParticipants
              onClick={setSelectedUserId}
              selectedUserId={selectedUserId()}
              channelId={props.channelId!}
              size={isSomeoneVideoStreaming() ? "small" : undefined}
            />
            <Show when={isSomeoneVideoStreaming()}>
              <VideoStream
                mediaStream={
                  voiceUsers.videoEnabled(selectedVoiceUser()?.userId!)!
                }
                mute={selectedVoiceUser()?.userId === account.user()?.id}
              />
            </Show>
          </div>
        </Show>
        <VoiceActions channelId={props.channelId!} />
      </div>
    </Show>
  );
}

function VideoStream(props: { mediaStream: MediaStream; mute?: boolean }) {
  let videoEl: HTMLVideoElement | undefined;

  const [muted, setMuted] = createSignal(false);

  const mediaStream = createMemo(() => props.mediaStream);

  createEffect(() => {
    if (!videoEl) return;
    videoEl.srcObject = mediaStream();
  });

  return (
    <div class={style.videoContainer}>
      <video ref={videoEl} autoplay muted={props.mute || muted()} />
      <div class={style.videoOverlay}>
        <Show when={!props.mute}>
          <div class={style.volumeSlider}>
            <Button
              iconName={muted() ? "volume_off" : "volume_up"}
              iconSize={18}
              padding={6}
              color={muted() ? "var(--alert-color)" : "var(--primary-color)"}
              margin={0}
              onClick={() => setMuted(!muted())}
            />
            <input
              type="range"
              min={0}
              value={muted() ? 0 : videoEl!.volume}
              max={1}
              step={0.01}
              onInput={(e) => {
                videoEl!.volume = parseFloat(e.target.value);
                setMuted(false);
              }}
            />
          </div>
        </Show>
        <Button
          iconName="fullscreen"
          iconSize={18}
          title={t("mainPaneHeader.voice.fullscreen")}
          padding={6}
          margin={0}
          onClick={() => videoEl?.requestFullscreen({ navigationUI: "hide" })}
        />
      </div>
    </div>
  );
}

function VoiceParticipants(props: {
  channelId: string;
  selectedUserId?: string | null;
  size?: "small";
  onClick: (userId: string) => void;
}) {
  const { voiceUsers } = useStore();

  const channelVoiceUsers = () =>
    voiceUsers.getVoiceUsersByChannelId(props.channelId!);

  return (
    <div class={style.voiceParticipants}>
      <For each={channelVoiceUsers()}>
        {(voiceUser) => (
          <VoiceParticipantItem
            onClick={() => props.onClick(voiceUser.userId)}
            selected={voiceUser.userId === props.selectedUserId}
            voiceUser={voiceUser!}
            size={props.size}
          />
        )}
      </For>
    </div>
  );
}

function VoiceParticipantItem(props: {
  voiceUser: VoiceUser;
  selected: boolean;
  size?: "small";
  onClick: () => void;
}) {
  const { createRegisteredPortal } = useCustomPortal();
  const { voiceUsers, account } = useStore();
  const params = useParams<{ serverId?: string; channelId?: string }>();
  const [contextPosition, setContextPosition] = createSignal<null | {
    x: number;
    y: number;
  }>(null);

  const showProfileFlyout = (event: MouseEvent) => {
    event.preventDefault();
    const el = event.target as HTMLElement;
    const rect = el?.getBoundingClientRect()!;
    const pos = {
      left: rect.left + 40,
      top: rect.top,
      anchor: "left"
    } as const;

    createRegisteredPortal(
      "ProfileFlyout",
      {
        triggerEl: el,
        position: pos,
        serverId: params.serverId,
        close: close,
        userId: props.voiceUser.userId
      },
      "profile-pane-flyout-" + props.voiceUser.userId,
      true
    );
  };

  const isMuted = () => {
    return !voiceUsers.micEnabled(props.voiceUser.userId);
  };

  const connected = () => props.voiceUser.connectionStatus === "CONNECTED";

  const isVideoStreaming = () =>
    voiceUsers.videoEnabled(props.voiceUser.userId);

  const isInCall = () =>
    voiceUsers.currentUser()?.channelId === props.voiceUser.channelId;
  const talking = () => props.voiceUser.voiceActivity;
  const user = () => props.voiceUser.user()!;

  const onClick = (event: MouseEvent) => {
    if (props.size !== "small") return showProfileFlyout(event);
    event.preventDefault();
    if (!props.selected) {
      props.onClick();
      return;
    }
    showProfileFlyout(event);
  };
  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const isSelf = () => user().id === account.user()?.id;

  return (
    <>
      <MemberContextMenu
        position={contextPosition()}
        serverId={params.serverId}
        userId={user().id}
        onClose={() => {
          setContextPosition(null);
        }}
      />
      <CustomLink
        onContextMenu={onContextMenu}
        onClick={onClick}
        href={RouterEndpoints.PROFILE(user().id)}
        class={cn(
          "trigger-profile-flyout",
          style.voiceParticipantItem,
          !connected() && !isSelf() && isInCall() ? style.disconnected : null,
          conditionalClass(props.selected, style.selected)
        )}
      >
        <Avatar
          user={user()}
          size={props.size === "small" ? 40 : 60}
          voiceIndicator
          animate={talking()}
        />
        <Show when={isMuted() && isInCall()}>
          <Icon class={style.muteIcon} name="mic_off" color="white" size={16} />
        </Show>
        <Show when={isVideoStreaming()}>
          <Icon
            class={style.videoStreamIcon}
            name="monitor"
            color="white"
            size={16}
          />
        </Show>
      </CustomLink>
    </>
  );
}

function VoiceActions(props: { channelId: string }) {
  const { voiceUsers, channels } = useStore();
  const { createPortal } = useCustomPortal();
  const { isMobileAgent } = useWindowProperties();

  const currentVoiceUser = () => voiceUsers.currentUser();

  const channel = () => channels.get(props.channelId);

  const onCallClick = async () => {
    channel()?.joinCall();
  };

  const onCallEndClick = async () => {
    channel()?.leaveCall();
  };

  const isInCall = () =>
    voiceUsers.currentUser()?.channelId === props.channelId;

  const onScreenShareClick = () => {
    createPortal((close) => <ScreenShareModal close={close} />);
  };

  const onWebCamClick = () => {
    return createPortal((close) => <WebcamModal close={close} />);
  };

  const onStopScreenShareClick = () => {
    voiceUsers.setVideoStream(null);
  };

  return (
    <div class={style.voiceActions}>
      <Show when={showParticipants()}>
        <Button
          iconName="keyboard_arrow_up"
          color="rgba(255,255,255,0.6)"
          onClick={() => setShowParticipants(false)}
        />
      </Show>
      <Show when={!showParticipants()}>
        <Button
          iconName="keyboard_arrow_down"
          color="rgba(255,255,255,0.6)"
          onClick={() => setShowParticipants(true)}
        />
      </Show>
      <Show when={!isInCall()}>
        <Button
          iconName="call"
          color="var(--success-color)"
          onClick={onCallClick}
          label={t("mainPaneHeader.voice.join")}
        />
      </Show>
      <Show when={isInCall()}>
        <Show when={!currentVoiceUser()?.videoStream && !isMobileAgent()}>
          <Button iconName="monitor" onClick={onScreenShareClick} />
        </Show>
        <Show when={!currentVoiceUser()?.videoStream}>
          <Button iconName="videocam" onClick={onWebCamClick} />
        </Show>
        <Show when={currentVoiceUser()?.videoStream}>
          <Button
            iconName="desktop_access_disabled"
            onClick={onStopScreenShareClick}
            color="var(--alert-color)"
          />
        </Show>
        <VoiceDeafenActions />
        <VoiceMicActions />
        <Button
          iconName="call_end"
          color="var(--alert-color)"
          onClick={onCallEndClick}
          label={t("mainPaneHeader.voice.leave")}
        />
      </Show>
    </div>
  );
}

function VoiceMicActions() {
  const {
    voiceUsers: { isLocalMicMuted, toggleMic, deafened }
  } = useStore();

  return (
    <Show when={!deafened.enabled}>
      <Show when={isLocalMicMuted()}>
        <Button
          iconName="mic_off"
          color="var(--alert-color)"
          label={t("mainPaneHeader.voice.muted")}
          onClick={toggleMic}
        />
      </Show>
      <Show when={!isLocalMicMuted()}>
        <Button
          iconName="mic"
          color="var(--success-color)"
          onClick={toggleMic}
        />
      </Show>
    </Show>
  );
}
function VoiceDeafenActions() {
  const { voiceUsers } = useStore();

  const isDeafened = () => voiceUsers.deafened.enabled;

  return (
    <>
      <Show when={isDeafened()}>
        <Button
          iconName="headset_off"
          color="var(--alert-color)"
          label={t("mainPaneHeader.voice.deafened")}
          onClick={voiceUsers.toggleDeafen}
        />
      </Show>
      <Show when={!isDeafened()}>
        <Button
          iconName="headset_mic"
          color="var(--primary-color)"
          onClick={voiceUsers.toggleDeafen}
        />
      </Show>
    </>
  );
}
