import styles from "./styles.module.scss";
import { classNames, conditionalClass } from "@/common/classNames";
import { formatTimestamp, millisecondsToHhMmSs, timeElapsed, timeSince } from "@/common/date";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/icon/Icon";
import { MessageType, RawAttachment, RawEmbed, RawMessage, RawMessageReaction, RawUser } from "@/chat-api/RawData";
import { Message, MessageSentStatus } from "@/chat-api/store/useMessages";
import { addMessageReaction, deleteMessage, fetchMessageReactedUsers, removeMessageReaction } from "@/chat-api/services/MessageService";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useNavigate, useParams } from "solid-navigator";
import useStore from "@/chat-api/store/useStore";
import { createEffect, createSignal, For, Match, on, onCleanup, onMount, Show, Switch } from "solid-js";
import { Markup } from "@/components/Markup";
import Modal from "@/components/ui/modal/Modal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Text from "@/components/ui/Text";
import { css, styled } from "solid-styled-components";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import Button from "@/components/ui/Button";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ImageEmbed, ImagePreviewModal, clamp, clampImageSize } from "@/components/ui/ImageEmbed";
import { CustomLink } from "@/components/ui/CustomLink";
import { MentionUser } from "@/components/markup/MentionUser";
import { Emoji } from "@/components/markup/Emoji";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import env from "@/common/env";
import { useWindowProperties } from "@/common/useWindowProperties";
import { DangerousLinkModal } from "@/components/ui/DangerousLinkModal";
import { useResizeObserver } from "@/common/useResizeObserver";
import { ServerWithMemberCount, joinPublicServer, joinServerByInviteCode, serverDetailsByInviteCode } from "@/chat-api/services/ServerService";
import { ServerVerifiedIcon } from "@/components/servers/ServerVerifiedIcon";
import { getFile, googleApiInitialized, initializeGoogleDrive } from "@/common/driveAPI";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ProfileFlyout } from "@/components/floating-profile/FloatingProfile";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import { classList } from "solid-js/web";
import {Emoji as RoleEmoji} from "@/components/ui/Emoji";
import { prettyBytes } from "@/common/prettyBytes";

interface FloatingOptionsProps {
  message: RawMessage,
  isCompact?: boolean | number,
  showContextMenu?: (event: MouseEvent) => void,
  quoteClick?(): void;
  reactionPickerClick?(event: MouseEvent): void
}


function FloatOptions(props: FloatingOptionsProps) {
  const params = useParams<{ serverId: string }>();
  const { account, serverMembers } = useStore();
  const { createPortal } = useCustomPortal();

  const onDeleteClick = () => {
    createPortal?.(close => <DeleteMessageModal close={close} message={props.message} />);
  };
  const onEditClick = () => {
    const { channelProperties } = useStore();
    channelProperties.setEditMessage(props.message.channelId, props.message);
  };
  const showEdit = () => account.user()?.id === props.message.createdBy.id && props.message.type === MessageType.CONTENT;

  const showDelete = () => {
    if (account.user()?.id === props.message.createdBy.id) return true;
    if (!params.serverId) return false;

    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return member?.hasPermission?.(ROLE_PERMISSIONS.MANAGE_CHANNELS);
  };

  const isContentType = () => props.message.type === MessageType.CONTENT;


  return (
    <div class={styles.floatOptions}>
      {props.isCompact && (<div class={styles.floatDate}>{formatTimestamp(props.message.createdAt)}</div>)}
      <Show when={isContentType()}><div class={styles.item} onClick={props.reactionPickerClick}><Icon size={18} name='face' class={styles.icon} /></div></Show>
      <Show when={isContentType()}><div class={styles.item} onClick={props.quoteClick}><Icon size={18} name='format_quote' class={styles.icon} /></div></Show>
      <Show when={showEdit()}><div class={styles.item} onClick={onEditClick}><Icon size={18} name='edit' class={styles.icon} /></div></Show>
      <Show when={showDelete()}><div class={styles.item} onClick={onDeleteClick}><Icon size={18} name='delete' class={styles.icon} color='var(--alert-color)' /></div></Show>
      <div class={classNames("floatingShowMore", styles.item)} onClick={props.showContextMenu}><Icon size={18} name='more_vert' class={styles.icon} /></div>
    </div>
  );
}

interface MessageItemProps {
  class?: string;
  message: Message;
  beforeMessage?: Message;
  hideFloating?: boolean;
  messagePaneEl?: HTMLDivElement;
  textAreaEl?: HTMLTextAreaElement;
  contextMenu?: (event: MouseEvent) => void;
  userContextMenu?: (event: MouseEvent) => void
  reactionPickerClick?: (event: MouseEvent) => void
  quoteClick?: () => void
}

interface DetailsProps {
  message: Message;
  userContextMenu?: (event: MouseEvent) => void;
  isSystemMessage?: boolean;
  isServerCreator?: boolean;
  serverMember?: ServerMember;
  showProfileFlyout?: (event: MouseEvent) => void
  hovered?: boolean
}
const Details = (props: DetailsProps) => (
  <div class={classNames(styles.details)}>

    <CustomLink onClick={props.showProfileFlyout} decoration onContextMenu={props.userContextMenu} class={classNames("trigger-profile-flyout", styles.username)} href={RouterEndpoints.PROFILE(props.message.createdBy.id)} style={{ color: props.serverMember?.roleColor() }}>
      {props.message.createdBy.username}
    </CustomLink>
    <Show when={props.serverMember?.topRoleWithIcon()}>
      {role => <RoleEmoji title={role().name} size={16} icon={role().icon} hovered={props.hovered} resize={16}  />}
    </Show>
    <Show when={props.isSystemMessage}><SystemMessage message={props.message} /></Show>
    <Show when={props.isServerCreator}>
      <div class={styles.ownerBadge}>Owner</div>
    </Show>
    <Show when={props.message.createdBy.bot}>
      <div class={styles.ownerBadge}>Bot</div>
    </Show>
    <div class={styles.date}>{formatTimestamp(props.message.createdAt)}</div>
  </div>
);


const MessageItem = (props: MessageItemProps) => {

  const params = useParams();
  const { serverMembers, servers, account, friends } = useStore();
  const [hovered, setHovered] = createSignal(false);
  const serverMember = () => params.serverId ? serverMembers.get(params.serverId, props.message.createdBy.id) : undefined;

  const isServerCreator = () => params.serverId ? servers.get(params.serverId)?.createdById === props.message.createdBy.id : undefined;
  const {createPortal} = useCustomPortal();




  const currentTime = props.message?.createdAt;
  const beforeMessageTime = () => props.beforeMessage?.createdAt!;

  const isSameCreator = () => props.beforeMessage && props.beforeMessage?.createdBy?.id === props.message?.createdBy?.id;
  const isDateUnderFiveMinutes = () => beforeMessageTime() && (currentTime - beforeMessageTime()) < 300000;
  const isBeforeMessageContent = () => props.beforeMessage && props.beforeMessage.type === MessageType.CONTENT;


  const isCompact = () => isSameCreator() && isDateUnderFiveMinutes() && isBeforeMessageContent();
  const isSystemMessage = () => props.message.type !== MessageType.CONTENT;

  const [isMentioned, setIsMentioned] = createSignal(false);
  const [isSomeoneMentioned, setIsSomeoneMentioned] = createSignal(false); // @someone
  const [blockedMessage, setBlockedMessage] = createSignal(false);

  createEffect(() => {
    setBlockedMessage(friends.hasBeenBlockedByMe(props.message.createdBy.id));
  });


  const hasPermissionToMentionEveryone = () => {
    if (!params.serverId) return false;
    const member = serverMember();
    if (!member) return false;
    if (member.isServerCreator()) return true;
    return member.hasPermission?.(ROLE_PERMISSIONS.MENTION_EVERYONE);
  };


  createEffect(on([() => props.message.mentions?.length, () => props.message.quotedMessages.length], () => {
    setTimeout(() => {
      const isEveryoneMentioned = props.message.content?.includes("[@:e]") && hasPermissionToMentionEveryone();
      const isSomeoneMentioned = props.message.content?.includes("[@:s]") || false;
      const isQuoted = props.message.quotedMessages?.find(m => m.createdBy?.id === account.user()?.id);
      const isMentioned = isEveryoneMentioned || props.message.mentions?.find(u => u.id === account.user()?.id);
      setIsMentioned(!!isQuoted || !!isMentioned);
      setIsSomeoneMentioned(isSomeoneMentioned);
    });
  }));

  const showProfileFlyout = (event: MouseEvent) => {
    event.preventDefault();
    const el = event.target as HTMLElement;
    const rect = el?.getBoundingClientRect()!;
    const pos = { left: rect.left + 40, top: rect.top, anchor: "left" } as const;
    return createPortal(close => <ProfileFlyout triggerEl={el} position={pos} serverId={params.serverId} close={close} userId={props.message.createdBy.id} />, "profile-pane-flyout-" + props.message.createdBy.id, true);
  };

  return (
    <div
      class={
        classNames(
          styles.messageItem,
          conditionalClass(isCompact(), styles.compact),
          conditionalClass(isMentioned(), styles.mentioned),
          conditionalClass(isSomeoneMentioned(), styles.someoneMentioned),
          props.class,
          "messageItem"
        )}
      onContextMenu={props.contextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      id={`message-${props.message.id}`}
    >
      <Show when={!props.hideFloating}><FloatOptions reactionPickerClick={props.reactionPickerClick} quoteClick={props.quoteClick} showContextMenu={props.contextMenu} isCompact={isCompact()} message={props.message} /></Show>
      <Switch fallback={<Show when={blockedMessage()}><div onClick={() => setBlockedMessage(false)} class={classNames(styles.blockedMessage, conditionalClass(isCompact(), styles.compact))}>You have blocked this user. Click to show.</div></Show>}>
        <Match when={isSystemMessage()}>
          <SystemMessage message={props.message} />
        </Match>
        <Match when={!isSystemMessage() && !blockedMessage()}>
          <Show when={!isCompact()}>
            <A onClick={showProfileFlyout} onContextMenu={props.userContextMenu} href={RouterEndpoints.PROFILE(props.message.createdBy.id)} class={classNames(styles.avatar, "trigger-profile-flyout")}>
              <Avatar animate={hovered()} user={props.message.createdBy} size={40} resize={96} />
            </A>
          </Show>
          <div class={styles.messageInner}>
            <Show when={!isCompact()}>
              <Details 
                hovered={hovered()}
                message={props.message} 
                isServerCreator={isServerCreator()} 
                isSystemMessage={isSystemMessage()} 
                serverMember={serverMember()} 
                showProfileFlyout={showProfileFlyout} 
                userContextMenu={props.userContextMenu} 
              />
            </Show>
            <Content message={props.message} hovered={hovered()} />
            <Show when={props.message.uploadingAttachment}>
              <UploadAttachment message={props.message} />
            </Show>
            <Show when={props.message.reactions?.length}><Reactions textAreaEl={props.textAreaEl} reactionPickerClick={props.reactionPickerClick} hovered={hovered()} message={props.message} /></Show>
          </div>
        </Match>
      </Switch>
    </div>
  );
};



const Content = (props: { message: Message, hovered: boolean }) => {
  return (
    <div class={styles.content}>
      <Markup message={props.message} text={props.message.content || ""} />
      <Show when={!props.message.uploadingAttachment || props.message.content?.trim()}>
        <SentStatus message={props.message} />
      </Show>
      <Embeds {...props} />
    </div>
  );
};


const UploadAttachment = (props: { message: Message }) => {
  const attachment = () => props.message.uploadingAttachment!;
  return (
    <div class={styles.uploadProgress}>
      <div class={styles.name}>{attachment().file.name}</div>
      <div class={styles.size}>{prettyBytes(attachment().file.size, 0)}</div>
      <div class={styles.progressBarContainer}>
        <div class={styles.currentProgress} style={{ width: attachment().progress + "%" }} />
      </div>
    </div>
  );
};



const SentStatus = (props: { message: Message }) => {

  const editedAt = () => {
    if (!props.message.editedAt) return;
    return "Edited at " + formatTimestamp(props.message.editedAt);
  };

  return (
    <Switch>
      <Match when={props.message.sentStatus === MessageSentStatus.FAILED}>
        <div class={styles.sentStatus}>
          <Icon class={styles.icon} name='error_outline' size={14} color="var(--alert-color)" />
        </div>
      </Match>
      <Match when={props.message.sentStatus === MessageSentStatus.SENDING}>
        <div class={styles.sentStatus}>
          <Icon class={styles.icon} name='query_builder' size={14} color="rgba(255,255,255,0.4)" />
        </div>
      </Match>
      <Match when={editedAt()}>
        <div class={styles.sentStatus}>
          <Icon class={styles.icon} name='edit' size={14} color="rgba(255,255,255,0.4)" title={editedAt()} />
        </div>
      </Match>
    </Switch>
  );
};


const SystemMessage = (props: { message: Message }) => {
  const systemMessage = () => {
    switch (props.message.type) {
      case MessageType.JOIN_SERVER:
        return { icon: "login", color: "var(--primary-color)", message: "has joined the server." };
      case MessageType.LEAVE_SERVER:
        return { icon: "logout", color: "var(--alert-color)", message: "has left the server." };
      case MessageType.KICK_USER:
        return { icon: "logout", color: "var(--alert-color)", message: "has been kicked." };
      case MessageType.BAN_USER:
        return { icon: "block", color: "var(--alert-color)", message: "has been banned." };
      case MessageType.CALL_STARTED:
        return { icon: "call", color: "var(--success-color)", message: "started a call." };
      default:
        return undefined;
    }
  };

  return (
    <Show when={systemMessage()}>
      <div class={styles.systemMessage}>
        <div class={styles.iconContainer}><Icon name={systemMessage()?.icon} color={systemMessage()?.color} /></div>
        <div class="markup"><MentionUser user={props.message.createdBy} /></div>
        <span>
          <span>{systemMessage()?.message}</span>
          <span class={styles.date}>{formatTimestamp(props.message.createdAt)}</span>
        </span>
      </div>
    </Show>
  );
};

export default MessageItem;



const inviteLinkRegex = new RegExp(
  `${env.APP_URL}/i/([\\S]+)`
);

const youtubeLinkRegex =
  /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/;



export function Embeds(props: { message: Message, hovered: boolean; maxWidth?: number; maxHeight?: number }) {

  const inviteEmbedCode = () => props.message.content?.match(inviteLinkRegex)?.[1];

  
  const youtubeEmbed = () =>props.message.embed?.origUrl?.match(youtubeLinkRegex);


  return (
    <div class={styles.embeds}>
      <Show when={props.message.attachments?.[0]?.provider === "local"}>
        <ImageEmbed attachment={props.message.attachments?.[0]!} widthOffset={-90}  maxWidth={props.maxWidth} maxHeight={props.maxHeight} />
      </Show>
      <Switch>
        <Match when={inviteEmbedCode()}>
          {code => <ServerInviteEmbed code={code()} />}
        </Match>
        <Match when={youtubeEmbed()}>
          {youtubeEmbed => <YoutubeEmbed code={youtubeEmbed()[3]} embed={props.message.embed!} shorts={youtubeEmbed()[1].endsWith("shorts")} />}
        </Match>
        <Match when={props.message.attachments?.[0]?.provider === "google_drive"}>
          <GoogleDriveEmbeds attachment={props.message.attachments?.[0]!} />
        </Match>
        <Match when={props.message.embed}>
          <OGEmbed message={props.message} />
        </Match>
      </Switch>
    </div>
  );
}






const allowedVideoMimes = ["video/mp4", "video/webm"];
const allowedAudioMimes = ["audio/mp3", "audio/mpeg", "audio/ogg"];


const GoogleDriveEmbeds = (props: { attachment: RawAttachment }) => {
  return (
    <>
      <Switch fallback={<FileEmbed attachment={props.attachment} />}>
        <Match when={allowedVideoMimes.includes(props.attachment.mime!)} ><VideoEmbed attachment={props.attachment} /></Match>
        <Match when={allowedAudioMimes.includes(props.attachment.mime!)} ><AudioEmbed attachment={props.attachment} /></Match>
      </Switch>
    </>
  );
};


const YoutubeEmbed = (props: { code: string, embed: RawEmbed, shorts: boolean }) => {
  const { paneWidth, height, width: windowWidth } = useWindowProperties();
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();
  const [playVideo, setPlayVideo] = createSignal<boolean>(false);

  const [date, setDate] = createSignal<string>("");

  const widthOffset = -90;
  const customHeight = 0;
  const customWidth = 0;

  const style = () => {

    if (props.shorts) {
      const maxWidth = clamp((customWidth || paneWidth()!) + (widthOffset || 0), 600);
      const maxHeight = windowWidth() <= 600 ? (customHeight || height()) / 1.4 : (customHeight || height()) / 2;
      return clampImageSize(1080, 1920, maxWidth, maxHeight);
    }


    const maxWidth = clamp((customWidth || paneWidth()!) + (widthOffset || 0), 600);
    return clampImageSize(1920, 1080, maxWidth, (customHeight || height()) / 2);
  };

  onMount(() => {
    updateDate();
    const interval = setInterval(updateDate, 60000);
    onCleanup(() => clearInterval(interval));
  });

  const updateDate = () => {
    setDate(timeSince(new Date(props.embed.uploadDate || 0).getTime()));
  };

  return (
    <div class={styles.youtubeEmbed} >
      <div class={styles.video} style={style()}>
        <Show when={!playVideo()}>
          <img style={{ width: "100%", height: "100%", "object-fit": "cover" }} src={props.embed.imageUrl} />
          <div onClick={() => setPlayVideo(!playVideo())} class={styles.playButtonContainer}>
            <div class={styles.playButton}>
              <Icon name='play_arrow' color='var(--primary-color)' size={28} />
            </div>
          </div>
        </Show>
        <Show when={playVideo()}>
          <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${props.code}?autoplay=1`} frameborder="0"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen />
        </Show>
      </div>
      <div class={styles.youtubeEmbedDetails}>
        <div class={styles.title}>{props.embed.title}</div>
        <div class={styles.info}>
          {props.embed.channelName} • <span class={styles.date}>{date()}</span>
        </div>
        <div class={styles.description}>{props.embed.description}</div>
    
      </div>
    </div>

  );
};




const VideoEmbed = (props: { attachment: RawAttachment }) => {
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();
  const [playVideo, setPlayVideo] = createSignal<boolean>(false);
  onMount(async () => {
    await initializeGoogleDrive();
  });

  // eslint-disable-next-line solid/reactivity
  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(props.attachment.fileId!, "name, size, modifiedTime, webContentLink, mimeType, thumbnailLink, videoMediaMetadata").catch((e) => console.log(e));
    // const file = await getFile(props.attachment.fileId!, "*").catch((e) => console.log(e))
    if (!file) return setError("Could not get Video.");

    if (file.mimeType !== props.attachment.mime) return setError("Video was modified.");


    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt;
    if (diff >= 5000) return setError("Video was modified.");
    setFile(file);
  });

  return (
    <div class={styles.videoEmbed}>
      <div class={styles.videoInfo}>
        <Show when={!file() && !error()}><Skeleton.Item height='100%' width='100%' /></Show>
        <Show when={error()}>
          <Icon name='error' color='var(--alert-color)' size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{error()}</div>
          </div>
          <Button iconName='info' iconSize={16} onClick={() => alert("This Video was modified/deleted by the creator in their Google Drive. ")} />
        </Show>
        <Show when={file() && !error()}>
          <Icon name='insert_drive_file' color='var(--primary-color)' size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{file()?.name}</div>
            <div class={styles.fileEmbedSize}>{prettyBytes(parseInt(file()?.size! || "0"), 0)}</div>
          </div>
          <Button iconName='download' onClick={() => window.open(file()?.webContentLink!, "_blank")} />
        </Show>
      </div>

      <div class={styles.video}>
        <Show when={!file() && !error()}><Skeleton.Item height='100%' width='100%' /></Show>
        <Show when={file() && !error()}>
          <Show when={!playVideo()}>
            {/* <Show when={file()?.thumbnailLink}><img crossorigin="anonymous" style={{ width: "100%", height: "100%", "object-fit": "contain" }} src={file()?.thumbnailLink} alt="" /></Show> */}
            <div onClick={() => setPlayVideo(!playVideo())} class={styles.playButtonContainer}>
              <div class={styles.playButton}>
                <Icon name='play_arrow' color='var(--primary-color)' size={28} />
              </div>
            </div>
          </Show>
          <Show when={playVideo()}>
            <video crossorigin="anonymous" style={{ width: "100%", height: "100%", "object-fit": "contain" }} autoplay src={`https://drive.lienuc.com/uc?id=${props.attachment.fileId}`} controls />
          </Show>
        </Show>
      </div>

    </div>

  );
};

const FileEmbed = (props: { attachment: RawAttachment }) => {
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();
  onMount(async () => {
    await initializeGoogleDrive();
  });

  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(props.attachment.fileId!, "name, size, modifiedTime, webContentLink, mimeType").catch((e) => console.log(e));
    // const file = await getFile(props.attachment.fileId!, "*").catch((e) => console.log(e))
    if (!file) return setError("Could not get file.");

    if (file.mimeType !== props.attachment.mime) return setError("File was modified.");


    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt;
    if (diff >= 5000) return setError("File was modified.");
    setFile(file);
  });

  return (
    <div class={styles.fileEmbed}>
      <Show when={!file() && !error()}><Skeleton.Item height='100%' width='100%' /></Show>
      <Show when={error()}>
        <Icon name='error' color='var(--alert-color)' size={30} />
        <div class={styles.fileEmbedDetails}>
          <div class={styles.fileEmbedName}>{error()}</div>
        </div>
        <Button iconName='info' iconSize={16} onClick={() => alert("This file was modified/deleted by the creator in their Google Drive. ")} />
      </Show>
      <Show when={file() && !error()}>
        <Icon name='insert_drive_file' color='var(--primary-color)' size={30} />
        <div class={styles.fileEmbedDetails}>
          <div class={styles.fileEmbedName}>{file()?.name}</div>
          <div class={styles.fileEmbedSize}>{prettyBytes(parseInt(file()?.size! || "0"), 0)}</div>
        </div>
        <Button iconName='download' onClick={() => window.open(file()?.webContentLink!, "_blank")} />
      </Show>
    </div>

  );
};
const AudioEmbed = (props: { attachment: RawAttachment }) => {
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();
  const [preloadAudio, setPreloadAudio] = createSignal(false);
  const [preloaded, setPreloaded] = createSignal(false);
  const [playing, setPlaying] = createSignal(false);

  const [currentTime, setCurrentTime] = createSignal(0);
  const [endTime, setEndTime] = createSignal(0);

  let audio: HTMLAudioElement | undefined;
  let progressBarRef: HTMLDivElement | undefined;

  onMount(async () => {
    await initializeGoogleDrive();
  });

  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(props.attachment.fileId!, "name, size, modifiedTime, webContentLink, mimeType").catch((e) => console.log(e));
    // const file = await getFile(props.attachment.fileId!, "*").catch((e) => console.log(e))
    if (!file) return setError("Could not get file.");

    if (file.mimeType !== props.attachment.mime) return setError("File was modified.");


    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt;
    if (diff >= 5000) return setError("File was modified.");
    setFile(file);
  });
  
  createEffect(() => {
    if (!preloadAudio()) return;
    const fileItem = file();
    if (!fileItem) return;

    audio = new Audio();
    audio.crossOrigin = "anonymous";
    
    audio.onloadedmetadata = () => {
      setPreloaded(true);
    };

    audio.onended = () => {
      setPlaying(false);
    };

    audio.src = `https://drive.lienuc.com/uc?id=${props.attachment.fileId}`;
  });
  createEffect(() => {
    if (!preloaded()) return;
    if (playing())
      audio?.play();
    else
      audio?.pause();
  });

  onCleanup(() => {
    audio?.pause();
    audio?.remove();
  });

  const statusIcon = () => {
    if (playing() && !preloaded()) return "hourglass_top";
    if (playing()) return "pause";
    return "play_arrow";
  };

  const playingTimeEl = () => {
    if (!audio) return;



    return  ;
  };

  createEffect(on(preloaded, () => {
    if (!audio) return;
    if (!preloaded()) return;

    setEndTime(audio.duration * 1000);
    audio.addEventListener("timeupdate", onTimeUpdate);

    onCleanup(() => {
      audio?.removeEventListener("timeupdate", onTimeUpdate);
    });
  }));

  const onTimeUpdate = () => {
    if (!audio) return;
    const current = audio.currentTime * 1000;
    setCurrentTime(current);
  };

  const onProgressClick = (event: MouseEvent) => {
    if (!audio) return;
    if (!progressBarRef) return;

    const rect = progressBarRef.getBoundingClientRect();
    const mouseX = event.clientX - rect.x;

    const percent = mouseX / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  return (
    <div class={classNames(styles.fileEmbed, styles.audioEmbed, conditionalClass(preloaded(), styles.preloadedAudio))} onMouseEnter={() => setPreloadAudio(true)}>
      <div class={styles.innerAudioEmbed}>
        <Show when={!file() && !error()}><Skeleton.Item height='100%' width='100%' /></Show>
        <Show when={error()}>
          <Icon name='error' color='var(--alert-color)' size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{error()}</div>
          </div>
          <Button iconName='info' iconSize={16} onClick={() => alert("This file was modified/deleted by the creator in their Google Drive. ")} />
        </Show>
        <Show when={file() && !error()}>
          <Button onClick={() => setPlaying(!playing())} iconName={statusIcon()} color='var(--primary-color)' styles={{"border-radius": "50%"}} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{file()?.name}</div>
            <div class={styles.fileEmbedSize}>{prettyBytes(parseInt(file()?.size! || "0"), 0)}</div>
          </div>
          <Button iconName='download' onClick={() => window.open(file()?.webContentLink!, "_blank")} />
        </Show>

      </div>

      <Show when={preloaded()}>
        <div class={styles.audioDetails}>
          <div class={styles.time}>
            <div>{millisecondsToHhMmSs(currentTime(), true)}</div>
            <div>{millisecondsToHhMmSs(endTime(), true)}</div>
          </div>


          <div ref={progressBarRef} class={styles.progressBar} onClick={onProgressClick}>
            <div class={styles.progress} style={{ width: `${(currentTime() / endTime()) * 100}%` }} />
          </div>


        </div>
      </Show>


    </div>

  );
};



const inviteCache = new Map<string, ServerWithMemberCount | false>();


function ServerInviteEmbed(props: { code: string }) {
  const navigate = useNavigate();
  const { servers } = useStore();
  const [invite, setInvite] = createSignal<ServerWithMemberCount | null | false>(null);
  const [joining, setJoining] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);

  onMount(async () => {
    if (inviteCache.has(props.code)) return setInvite(inviteCache.get(props.code)!);
    const invite = await serverDetailsByInviteCode(props.code).catch(() => { });
    setInvite(invite || false);
    inviteCache.set(props.code, invite || false);
  });

  const cachedServer = () => {
    const _invite = invite();
    if (!_invite) return;
    return servers.get(_invite.id);
  };

  createEffect(() => {
    if (joining() && cachedServer()) {
      navigate(RouterEndpoints.SERVER_MESSAGES(cachedServer()!.id, cachedServer()!.defaultChannelId));
    }
  });

  const joinOrVisitServer = () => {
    const _invite = invite();
    if (!_invite) return;
    if (cachedServer()) return navigate(RouterEndpoints.SERVER_MESSAGES(_invite.id, _invite.defaultChannelId));

    if (joining()) return;
    setJoining(true);

    joinServerByInviteCode(props.code).catch((err) => {
      alert(err.message);
    }).finally(() => setJoining(false));
  };


  return (
    <div class={styles.serverInviteEmbed} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      <Show when={invite()} fallback={<div class={styles.serverInviteLoading}><Show when={invite() === false}><Icon name='error' color='var(--alert-color)' /></Show>{invite() === false ? "Invalid Invite Code" : "Loading Invite..."}</div>}>
        {invite => (
          <>
            <Avatar server={invite()} size={40} animate={hovered()} showBorder />
            <div class={styles.serverInfo}>
              <div class={styles.serverName}>
                <span class={styles.serverNameOnly}>{invite()?.name}</span>
                <Show when={invite().verified}><ServerVerifiedIcon /></Show>
              </div>

              <div class={styles.serverMemberCount}>
                <Icon name='people' size={14} color='var(--primary-color)' />
                {invite().memberCount} member(s)
              </div>
            </div>
            <Button label={joining() ? "Joining..." : cachedServer() ? "Visit" : "Join"} iconName='login' onClick={joinOrVisitServer} />
          </>
        )}
      </Show>
    </div>
  );
}


function OGEmbed(props: { message: RawMessage }) {
  const { hasFocus } = useWindowProperties();

  const embed = () => props.message.embed!;
  const { createPortal } = useCustomPortal();

  const onLinkClick = (e: MouseEvent) => {
    e.preventDefault();
    createPortal(close => <DangerousLinkModal unsafeUrl={embed().url} close={close} />);
  };

  const imageUrl = () => `${env.NERIMITY_CDN}proxy/${encodeURIComponent(embed().imageUrl!)}/embed.${embed().imageMime?.split("/")[1]}`;
  const isGif = () => imageUrl().endsWith(".gif");

  const url = (ignoreFocus?: boolean) => {
    const url = new URL(imageUrl());
    if (ignoreFocus) return url.href;
    if (!isGif()) return url.href;
    if (!hasFocus()) {
      url.searchParams.set("type", "webp");
    }
    return url.href;
  };
  const onImageClick = () => {
    createPortal(close => <ImagePreviewModal close={close} url={url(true)} />);
  };


  return (
    <Switch fallback={
      <div class={styles.ogEmbedContainer}>
        <Show when={embed().imageUrl}>
          <img onClick={onImageClick} src={url()} class={styles.ogEmbedImage} loading='lazy' />
        </Show>
        <div>
          <CustomLink decoration class={styles.ogEmbedTitle} href={embed().url || "#"} onclick={onLinkClick} target="_blank" rel="noopener noreferrer">{embed().title}</CustomLink>

          <div class={styles.ogEmbedDescription}>{embed().description}</div>
        </div>
      </div>
    }>
      <Match when={embed().type === "image"}>
        <ImageEmbed
          attachment={{
            id: "",
            path: `proxy/${encodeURIComponent(embed().imageUrl!)}/embed.${embed().imageMime?.split("/")[1]}`,
            width: embed().imageWidth,
            height: embed().imageHeight
          }}
          widthOffset={-90}
        />
      </Match>
    </Switch>
  );
}


interface ReactionItemProps {
  textAreaEl?: HTMLTextAreaElement;
  reaction: RawMessageReaction,
  message: Message,
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event?: MouseEvent) => void;
}


function ReactionItem(props: ReactionItemProps) {
  const { hasFocus } = useWindowProperties();


  let isHovering = false;

  const onMouseEnter = (e: any) => {
    isHovering = true;
    props.onMouseEnter?.(e);
  };

  const onMouseLeave = (e: any) => {
    isHovering = false;
    props.onMouseLeave?.(e);
  };
  onCleanup(() => {
    if (isHovering) props.onMouseLeave?.();
  });

  const name = () => props.reaction.emojiId ? props.reaction.name : emojiUnicodeToShortcode(props.reaction.name);

  const url = () => {
    if (!props.reaction.emojiId) return unicodeToTwemojiUrl(props.reaction.name);
    return `${env.NERIMITY_CDN}/emojis/${props.reaction.emojiId}.${props.reaction.gif ? "gif" : "webp"}${props.reaction.gif ? (!hasFocus() ? "?type=webp" : "") : ""}`;
  };

  const addReaction = () => {
    props.textAreaEl?.focus();
    if (props.reaction.reacted) {
      removeMessageReaction({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId
      });
      return;
    }
    addMessageReaction({
      channelId: props.message.channelId,
      messageId: props.message.id,
      name: props.reaction.name,
      emojiId: props.reaction.emojiId,
      gif: props.reaction.gif
    });
  };

  return (
    <Button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={e => {
        e.preventDefault(); e.stopPropagation();
      }}
      margin={0}
      padding={[2, 8, 2, 2]}
      customChildrenLeft={
        <Emoji class={styles.emoji} name={name()} url={url()} custom={!!props.reaction.emojiId} resize={60} />
      }
      onClick={addReaction}
      class={classNames(styles.reactionItem, conditionalClass(props.reaction.reacted, styles.reacted))}
      label={props.reaction.count.toLocaleString()}
      textSize={12}
      color={!props.reaction.reacted ? "white" : undefined}
    />
  );
}

function AddNewReactionButton(props: { show?: boolean; onClick?(event: MouseEvent): void }) {
  const { isMobileAgent } = useWindowProperties();
  const show = () => {
    if (isMobileAgent()) return true;
    if (props.show) return true;
  };
  return (
    <Button onClick={props.onClick} margin={0} padding={6} class={styles.reactionItem} styles={{ visibility: show() ? "visible" : "hidden" }} iconName='add' iconSize={15} />
  );
}


function Reactions(props: { hovered: boolean, textAreaEl?: HTMLTextAreaElement; message: Message, reactionPickerClick?(event: MouseEvent): void }) {
  const { createPortal, closePortalById } = useCustomPortal();

  const onHover = (event: MouseEvent, reaction: RawMessageReaction) => {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    createPortal(() => (<WhoReactedModal {...{ x: rect.x + (rect.width / 2), y: rect.y, reaction, message: props.message }} />), "whoReactedModal");
  };
  const onBlur = () => {
    closePortalById("whoReactedModal");
  };

  return (
    <div class={styles.reactions}>
      <For each={props.message.reactions}>
        {reaction => <ReactionItem onMouseEnter={e => onHover(e, reaction)} onMouseLeave={onBlur} textAreaEl={props.textAreaEl} message={props.message} reaction={reaction} />}
      </For>
      <AddNewReactionButton show={props.hovered} onClick={props.reactionPickerClick} />
    </div>
  );
}


function WhoReactedModal(props: { x: number, y: number; reaction: RawMessageReaction, message: Message }) {
  const [users, setUsers] = createSignal<null | RawUser[]>(null);
  const [el, setEL] = createSignal<undefined | HTMLDivElement>(undefined);
  const { width, height } = useResizeObserver(el);


  onMount(() => {
    const timeoutId = window.setTimeout(async () => {
      const newReactedUsers = await fetchMessageReactedUsers({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId,
        limit: 5
      });
      setUsers(newReactedUsers.map(u => u.user));
    }, 500);

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });

  const style = () => {
    if (!height()) return { pointerEvents: "none" };
    return { top: (props.y - height() - 5) + "px", left: (props.x - width() / 2) + "px" };
  };

  const reactionCount = props.reaction.count;

  const plusCount = () => reactionCount - users()?.length!;

  return (
    <Show when={users()}>
      <div ref={setEL} class={styles.whoReactedModal} style={style()}>
        <For each={users()!}>
          {user => (
            <div class={styles.whoReactedItem}>
              <Avatar size={15} user={user} />
              <div>{user.username}</div>
            </div>
          )}
        </For>
        <Show when={plusCount()}><div class={styles.whoReactedPlusCount}>{plusCount()} more</div></Show>
      </div>
    </Show>
  );
}








const DeleteMessageModalContainer = styled(FlexColumn)`
  overflow: auto;
  padding: 10px;
  max-height: 200px;
  
`;
const deleteMessageItemContainerStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;
  background-color: rgba(0,0,0,0.3);

  overflow: hidden;
  &&{
    &:hover {
      background-color: rgba(0,0,0,0.3);
    }
  }
`;

const deleteMessageModalStyles = css`
  max-height: 800px;
  overflow: hidden;
`;

export function DeleteMessageModal(props: { message: Message, close: () => void }) {

  const onDeleteClick = () => {
    props.close();
    deleteMessage({ channelId: props.message.channelId, messageId: props.message.id });
  };


  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onDeleteClick();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      props. close();
    }
  };


  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });



  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} iconName="close" label="Cancel" />
      <Button onClick={onDeleteClick} iconName="delete" color='var(--alert-color)' label="Delete" />
    </FlexRow>
  );

  return (
    <Modal close={props.close} title='Delete Message?' icon='delete' class={deleteMessageModalStyles} actionButtons={ActionButtons} maxWidth={500}>
      <DeleteMessageModalContainer>
        <Text>Are you sure you would like to delete this message?</Text>
        <MessageItem class={deleteMessageItemContainerStyles} hideFloating message={props.message} />
      </DeleteMessageModalContainer>
    </Modal>
  );
}