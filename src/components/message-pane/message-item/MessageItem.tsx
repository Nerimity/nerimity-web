import styles from "./styles.module.scss";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import {
  formatTimestamp,
  fullDate,
  fullDateTime,
  millisecondsToHhMmSs,
  timeElapsed,
  timeSince,
  timeSinceMentions,
} from "@/common/date";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/icon/Icon";
import {
  AttachmentProviders,
  HtmlEmbedItem,
  MessageType,
  RawAttachment,
  RawEmbed,
  RawMessage,
  RawMessageReaction,
  RawUser,
} from "@/chat-api/RawData";
import { Message, MessageSentStatus } from "@/chat-api/store/useMessages";
import {
  addMessageReaction,
  fetchMessageReactedUsers,
  removeMessageReaction,
} from "@/chat-api/services/MessageService";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useNavigate, useParams } from "solid-navigator";
import useStore from "@/chat-api/store/useStore";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  JSX,
  lazy,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { Markup } from "@/components/Markup";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import Button from "@/components/ui/Button";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ImageEmbed, clamp, clampImageSize } from "@/components/ui/ImageEmbed";
import { CustomLink } from "@/components/ui/CustomLink";
import { MentionUser } from "@/components/markup/MentionUser";
import { Emoji } from "@/components/markup/Emoji";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import env from "@/common/env";
import { useWindowProperties } from "@/common/useWindowProperties";
import { DangerousLinkModal } from "@/components/ui/DangerousLinkModal";
import { useResizeObserver } from "@/common/useResizeObserver";
import {
  ServerWithMemberCount,
  serverDetailsByInviteCode,
} from "@/chat-api/services/ServerService";
import { ServerVerifiedIcon } from "@/components/servers/ServerVerifiedIcon";
import {
  getFile,
  googleApiInitialized,
  initializeGoogleDrive,
} from "@/common/driveAPI";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ProfileFlyout } from "@/components/floating-profile/FloatingProfile";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import { Dynamic, Portal } from "solid-js/web";
import { Emoji as RoleEmoji } from "@/components/ui/Emoji";
import { prettyBytes } from "@/common/prettyBytes";
import { unzipJson } from "@/common/zip";
import { emitScrollToMessage } from "@/common/GlobalEvents";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { electronWindowAPI } from "@/common/Electron";
import { reactNativeAPI, useReactNativeEvent } from "@/common/ReactNative";
import { stat } from "fs";
import {
  AudioEmbed,
  GoogleDriveAudioEmbed,
  LocalAudioEmbed,
} from "./AudioEmbed";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { ButtonsEmbed } from "./ButtonsEmbed";
import { Tooltip } from "@/components/ui/Tooltip";
import { getSystemMessage } from "@/common/SystemMessage";
import { useJoinServer } from "@/chat-api/useJoinServer";
import { Modal } from "@/components/ui/modal";
import Text from "@/components/ui/Text";
import Checkbox from "@/components/ui/Checkbox";
import { FlexColumn, FlexRow } from "@/components/ui/Flexbox";
import { css } from "solid-styled-components";
import { StorageKeys, useReactiveLocalStorage } from "@/common/localStorage";
import {
  inviteLinkRegex,
  youtubeLinkRegex,
  twitterStatusLinkRegex,
} from "@/common/regex";
import { RawYoutubeEmbed } from "./RawYoutubeEmbed";
import { fetchTranslation, TranslateRes } from "@/common/GoogleTranslate";

const DeleteMessageModal = lazy(
  () => import("../message-delete-modal/MessageDeleteModal")
);

interface FloatingOptionsProps {
  message: RawMessage;
  isCompact?: boolean | number;
  showContextMenu?: (event: MouseEvent) => void;
  reactionPickerClick?(event: MouseEvent): void;
  textAreaEl?: HTMLTextAreaElement;
}

function FloatOptions(props: FloatingOptionsProps) {
  const params = useParams<{ serverId: string }>();
  const { account, serverMembers, channelProperties } = useStore();
  const { createPortal } = useCustomPortal();

  const replyClick = () => {
    channelProperties.addReply(props.message.channelId, props.message);
    props.textAreaEl?.focus();
  };
  const onDeleteClick = (e: MouseEvent) => {
    createPortal?.((close) => (
      <DeleteMessageModal
        instant={e.shiftKey}
        close={close}
        message={props.message}
      />
    ));
  };
  const onEditClick = () => {
    const { channelProperties } = useStore();
    channelProperties.setEditMessage(props.message.channelId, props.message);
  };
  const showEdit = () =>
    account.user()?.id === props.message.createdBy.id &&
    props.message.type === MessageType.CONTENT;

  const showDelete = () => {
    if (account.user()?.id === props.message.createdBy.id) return true;
    if (!params.serverId) return false;

    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return member?.hasPermission?.(ROLE_PERMISSIONS.MANAGE_CHANNELS);
  };

  const isContentType = () => props.message.type === MessageType.CONTENT;

  return (
    <div class={styles.floatOptions}>
      {props.isCompact && (
        <div class={styles.floatDate}>
          {formatTimestamp(props.message.createdAt)}
        </div>
      )}
      <Show when={isContentType()}>
        <div class={styles.item} onClick={props.reactionPickerClick}>
          <Icon size={18} name="face" class={styles.icon} />
        </div>
      </Show>
      <Show when={isContentType()}>
        <div class={styles.item} onClick={replyClick}>
          <Icon size={18} name="reply" class={styles.icon} />
        </div>
      </Show>
      <Show when={showEdit()}>
        <div class={styles.item} onClick={onEditClick}>
          <Icon size={18} name="edit" class={styles.icon} />
        </div>
      </Show>
      <Show when={showDelete()}>
        <div class={styles.item} onClick={onDeleteClick}>
          <Icon
            size={18}
            name="delete"
            class={styles.icon}
            color="var(--alert-color)"
          />
        </div>
      </Show>
      <div
        class={classNames("floatingShowMore", styles.item)}
        onClick={props.showContextMenu}
      >
        <Icon size={18} name="more_vert" class={styles.icon} />
      </div>
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
  userContextMenu?: (event: MouseEvent) => void;
  reactionPickerClick?: (event: MouseEvent) => void;
  quoteClick?: () => void;
  translateMessage?: boolean;
}

interface DetailsProps {
  message: Message;
  userContextMenu?: (event: MouseEvent) => void;
  isSystemMessage?: boolean;
  isServerCreator?: boolean;
  serverMember?: ServerMember;
  showProfileFlyout?: (event: MouseEvent) => void;
  hovered?: boolean;
}
const Details = (props: DetailsProps) => (
  <div class={classNames(styles.details)}>
    <CustomLink
      onClick={props.showProfileFlyout}
      decoration
      onContextMenu={props.userContextMenu}
      class={classNames("trigger-profile-flyout", styles.username)}
      href={RouterEndpoints.PROFILE(props.message.createdBy.id)}
      style={{ color: props.serverMember?.roleColor() }}
    >
      {props.serverMember?.nickname || props.message.createdBy.username}
    </CustomLink>
    <Show when={props.serverMember?.topRoleWithIcon()}>
      {(role) => (
        <RoleEmoji
          title={role().name}
          size={16}
          icon={role().icon}
          hovered={props.hovered}
          resize={16}
        />
      )}
    </Show>
    <Show when={props.isSystemMessage}>
      <SystemMessage message={props.message} />
    </Show>
    <Show when={props.isServerCreator}>
      <div class={styles.ownerBadge}>Owner</div>
    </Show>
    <Show when={props.message.createdBy.bot}>
      <div class={styles.ownerBadge}>Bot</div>
    </Show>
    <div class={styles.date}>{formatTimestamp(props.message.createdAt)}</div>
    <Show when={props.message.silent}>
      <Tooltip tooltip="Silent" anchor="left">
        <Icon
          name="notifications_off"
          color="rgba(255, 255, 255, 0.4)"
          size={12}
        />
      </Tooltip>
    </Show>
  </div>
);

const MessageItem = (props: MessageItemProps) => {
  const params = useParams();
  const { serverMembers, servers, account, friends } = useStore();
  const [hovered, setHovered] = createSignal(false);
  const [translatedContent, setTranslatedContent] =
    createSignal<TranslateRes>();
  const serverMember = createMemo(() =>
    params.serverId
      ? serverMembers.get(params.serverId, props.message.createdBy.id)
      : undefined
  );
  const server = createMemo(() => servers.get(params.serverId!));

  const isServerCreator = () =>
    server()?.createdById === props.message.createdBy.id;

  const { createPortal } = useCustomPortal();

  const isNewDay = createMemo(() => {
    if (!props.beforeMessage) return true;
    const beforeCreatedAt = new Date(props.beforeMessage.createdAt);
    const createdAt = new Date(props.message.createdAt);

    const nextDay = new Date(beforeCreatedAt);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    return createdAt >= nextDay;
  });

  const currentTime = props.message?.createdAt;
  const beforeMessageTime = () => props.beforeMessage?.createdAt!;

  const isSameCreator = () =>
    props.beforeMessage &&
    props.beforeMessage?.createdBy?.id === props.message?.createdBy?.id;
  const isDateUnderFiveMinutes = () =>
    beforeMessageTime() && currentTime - beforeMessageTime() < 300000;
  const isBeforeMessageContent = () =>
    props.beforeMessage && props.beforeMessage.type === MessageType.CONTENT;

  const isCompact = () =>
    !props.message.replyMessages?.length &&
    isSameCreator() &&
    isDateUnderFiveMinutes() &&
    isBeforeMessageContent();
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

  const updateTranslation = async () => {
    const translated = await fetchTranslation(props.message.content!).catch(
      () => {
        alert("Something went wrong, try again later.");
      }
    );
    if (!translated) return;
    setTranslatedContent(translated);
  };

  createEffect(() => {
    if (!props.translateMessage) return;
    if (!props.message.content) return;
    if (translatedContent()) return;
    updateTranslation();
  });

  const selfMember = createMemo(() =>
    serverMembers.get(params.serverId!, account.user()?.id!)
  );
  createEffect(
    on(
      [
        () => props.message.mentions?.length,
        () => props.message.quotedMessages?.length,
        () => props.message.roleMentions?.length,
      ],
      () => {
        setTimeout(() => {
          const isEveryoneMentioned =
            props.message.content?.includes("[@:e]") &&
            hasPermissionToMentionEveryone();
          const isSomeoneMentioned =
            props.message.content?.includes("[@:s]") || false;
          const isQuoted = props.message.quotedMessages?.find(
            (m) => m.createdBy?.id === account.user()?.id
          );
          const isReplied = props.message.replyMessages?.find(
            (m) => m.replyToMessage?.createdBy?.id === account.user()?.id
          );
          const isRoleMentioned =
            serverMember()?.hasPermission(ROLE_PERMISSIONS.MENTION_ROLES) &&
            props.message.roleMentions.find(
              (r) =>
                r.id !== server()?.defaultRoleId && selfMember()?.hasRole(r.id)
            );
          const isMentioned =
            isEveryoneMentioned ||
            props.message.mentions?.find((u) => u.id === account.user()?.id);

          setIsMentioned(
            !!isQuoted || !!isMentioned || !!isReplied || !!isRoleMentioned
          );
          setIsSomeoneMentioned(isSomeoneMentioned);
        });
      }
    )
  );

  const showProfileFlyout = (event: MouseEvent) => {
    event.preventDefault();
    const el = event.target as HTMLElement;
    const rect = el?.getBoundingClientRect()!;
    const pos = {
      left: rect.left + 40,
      top: rect.top,
      anchor: "left",
    } as const;
    return createPortal(
      (close) => (
        <ProfileFlyout
          triggerEl={el}
          position={pos}
          serverId={params.serverId}
          close={close}
          userId={props.message.createdBy.id}
        />
      ),
      "profile-pane-flyout-" + props.message.createdBy.id,
      true
    );
  };

  return (
    <>
      <Show when={isNewDay()}>
        <div class={styles.newDayMarker}>
          {fullDate(props.message.createdAt, "long", "long")}
        </div>
      </Show>
      <div
        class={classNames(
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
        <Show when={!props.hideFloating}>
          <FloatOptions
            textAreaEl={props.textAreaEl}
            reactionPickerClick={props.reactionPickerClick}
            showContextMenu={props.contextMenu}
            isCompact={isCompact()}
            message={props.message}
          />
        </Show>
        <Switch
          fallback={
            <Show when={blockedMessage()}>
              <div
                onClick={() => setBlockedMessage(false)}
                class={classNames(
                  styles.blockedMessage,
                  conditionalClass(isCompact(), styles.compact)
                )}
              >
                You have blocked this user. Click to show.
              </div>
            </Show>
          }
        >
          <Match when={isSystemMessage()}>
            <SystemMessage message={props.message} />
          </Match>
          <Match when={!isSystemMessage() && !blockedMessage()}>
            <div class={styles.messageInner}>
              <MessageReplies message={props.message} />
              <div class={styles.messageInnerInner}>
                <Show when={!isCompact()}>
                  <A
                    onClick={showProfileFlyout}
                    onContextMenu={props.userContextMenu}
                    href={RouterEndpoints.PROFILE(props.message.createdBy.id)}
                    class={classNames(styles.avatar, "trigger-profile-flyout")}
                  >
                    <Avatar
                      animate={hovered()}
                      user={props.message.createdBy}
                      size={40}
                      resize={96}
                    />
                  </A>
                </Show>
                <div class={styles.messageInnerInnerInner}>
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
                  <Show when={translatedContent()}>
                    <div class={styles.translationArea}>
                      <span class={styles.title}>
                        Translation{" "}
                        <span class={styles.translationSource}>
                          ({translatedContent()?.src})
                        </span>
                      </span>
                      <Markup
                        text={translatedContent()?.translationString!}
                        replaceCommandBotId
                      />
                    </div>
                  </Show>
                  <Show when={props.message.uploadingAttachment}>
                    <UploadAttachment message={props.message} />
                  </Show>
                  <Show when={props.message.reactions?.length}>
                    <Reactions
                      textAreaEl={props.textAreaEl}
                      reactionPickerClick={props.reactionPickerClick}
                      hovered={hovered()}
                      message={props.message}
                    />
                  </Show>
                </div>
              </div>
            </div>
          </Match>
        </Switch>
      </div>
    </>
  );
};

const Content = (props: { message: Message; hovered: boolean }) => {
  const params = useParams<{ serverId?: string }>();
  const store = useStore();
  return (
    <div class={styles.content}>
      <Markup
        replaceCommandBotId
        message={props.message}
        text={props.message.content || ""}
        serverId={params.serverId}
      />
      <Show
        when={
          !props.message.uploadingAttachment || props.message.content?.trim()
        }
      >
        <SentStatus message={props.message} />
      </Show>
      <Embeds {...props} />
      <Show when={props.message.local}>
        <Button
          label="Dismiss"
          margin={0}
          padding={4}
          onClick={() => {
            store.messages.locallyRemoveMessage(
              props.message.channelId,
              props.message.id
            );
          }}
        />
      </Show>
    </div>
  );
};

const UploadAttachment = (props: { message: Message }) => {
  const attachment = () => props.message.uploadingAttachment!;

  return (
    <div class={styles.uploadProgress}>
      <div class={styles.attachmentDetails}>
        <Icon name="publish" size={38} color="var(--primary-color)" />
        <div class={styles.attachmentDetailsInner}>
          <div class={styles.name}>{attachment().file.name}</div>
          <div class={styles.otherDetails}>
            <div class={styles.size}>
              {prettyBytes(attachment().file.size, 0)}
            </div>
            <Show when={attachment().speed}>
              <div class={styles.speed}>
                {attachment().progress}% • {attachment().speed}
              </div>
            </Show>
          </div>
        </div>
      </div>

      <div class={styles.progressBarContainer}>
        <div
          class={styles.currentProgress}
          style={{ width: attachment().progress + "%" }}
        />
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
          <Icon
            class={styles.icon}
            name="error_outline"
            size={14}
            color="var(--alert-color)"
          />
        </div>
      </Match>
      <Match when={props.message.sentStatus === MessageSentStatus.SENDING}>
        <div class={styles.sentStatus}>
          <Icon
            class={styles.icon}
            name="query_builder"
            size={14}
            color="rgba(255,255,255,0.4)"
          />
        </div>
      </Match>
      <Match when={editedAt()}>
        <div class={styles.sentStatus}>
          <Icon
            class={styles.icon}
            name="edit"
            size={14}
            color="rgba(255,255,255,0.4)"
            title={editedAt()}
          />
        </div>
      </Match>
    </Switch>
  );
};

const SystemMessage = (props: { message: Message }) => {
  const systemMessage = createMemo(() => getSystemMessage(props.message.type));
  return (
    <Show when={systemMessage()}>
      <div class={styles.systemMessage}>
        <div class={styles.iconContainer}>
          <Icon
            name={systemMessage()?.icon}
            class={cn(
              styles.icon,
              systemMessage()?.icon === "logout" ? styles.logoutIcon : undefined
            )}
            color={systemMessage()?.color}
          />
        </div>
        <span class="markup">
          <MentionUser user={props.message.createdBy} />

          <span>
            <span> {systemMessage()?.message}</span>
            <span class={styles.date}>
              {formatTimestamp(props.message.createdAt)}
            </span>
          </span>
        </span>
      </div>
    </Show>
  );
};

export default MessageItem;

export function Embeds(props: {
  message: Message;
  hovered: boolean;
  maxWidth?: number;
  maxHeight?: number;
}) {
  const inviteEmbedCode = () =>
    props.message.content?.match(inviteLinkRegex)?.[1];

  const youtubeEmbed = () =>
    props.message.embed?.origUrl?.match(youtubeLinkRegex);

  return (
    <div class={styles.embeds}>
      <Show when={props.message.attachments?.[0]?.provider === "local"}>
        <LocalCdnEmbeds
          attachment={props.message.attachments?.[0]!}
          maxWidth={props.maxWidth}
          maxHeight={props.maxHeight}
        />
      </Show>
      <Switch>
        <Match when={props.message.htmlEmbed}>
          <HTMLEmbed message={props.message} />
        </Match>
        <Match when={inviteEmbedCode()}>
          {(code) => <ServerInviteEmbed code={code()} />}
        </Match>

        <Match when={youtubeEmbed()}>
          {(youtubeEmbed) => (
            <YoutubeEmbed
              code={youtubeEmbed()[3]}
              embed={props.message.embed!}
              shorts={youtubeEmbed()[1].endsWith("shorts")}
            />
          )}
        </Match>
        <Match
          when={props.message.attachments?.[0]?.provider === "google_drive"}
        >
          <GoogleDriveEmbeds attachment={props.message.attachments?.[0]!} />
        </Match>
        <Match when={props.message.embed}>
          <OGEmbed message={props.message} />
        </Match>
      </Switch>
      <Show when={props.message.buttons}>
        <ButtonsEmbed message={props.message} />
      </Show>
    </div>
  );
}

const LocalCdnEmbeds = (props: {
  attachment: RawAttachment;
  maxWidth?: number;
  maxHeight?: number;
}) => {
  const isImageCompressed = () => {
    return props.attachment.width;
  };

  const isVideo = () => {
    return props.attachment.mime?.startsWith("video/");
  };

  const isAudio = () => {
    return props.attachment.mime?.startsWith("audio/");
  };

  return (
    <Switch>
      <Match when={isImageCompressed()}>
        <ImageEmbed
          attachment={props.attachment}
          widthOffset={-90}
          maxWidth={props.maxWidth}
          maxHeight={props.maxHeight}
        />
      </Match>
      <Match when={isVideo()}>
        <LocalVideoEmbed attachment={props.attachment} />
      </Match>
      <Match when={isVideo()}>
        <LocalVideoEmbed attachment={props.attachment} />
      </Match>
      <Match when={isAudio()}>
        <LocalAudioEmbed attachment={props.attachment} />
      </Match>
      <Match when={true}>
        <LocalFileEmbed attachment={props.attachment} />
      </Match>
    </Switch>
  );
};

const LocalVideoEmbed = (props: { attachment: RawAttachment }) => {
  const isExpired = () => {
    return props.attachment.expireAt && Date.now() > props.attachment.expireAt;
  };
  return (
    <VideoEmbed
      error={isExpired() ? "File expired." : undefined}
      file={{
        name: props.attachment.path?.split("/").reverse()[0]!,
        size: props.attachment.filesize!,
        url: env.NERIMITY_CDN + props.attachment.path!,
        expireAt: props.attachment.expireAt,
        provider: "local",
      }}
    />
  );
};
const LocalFileEmbed = (props: { attachment: RawAttachment }) => {
  const isExpired = () => {
    return props.attachment.expireAt && Date.now() > props.attachment.expireAt;
  };
  return (
    <FileEmbed
      error={isExpired() ? "File expired." : undefined}
      file={{
        name: props.attachment.path?.split("/").reverse()[0]!,
        mime: props.attachment.mime!,
        size: props.attachment.filesize!,
        url: env.NERIMITY_CDN + props.attachment.path!,
        previewUrl: env.NERIMITY_CDN + props.attachment.path!,
        expireAt: props.attachment.expireAt,
      }}
    />
  );
};

const allowedVideoMimes = ["video/mp4", "video/webm"];
const allowedAudioMimes = ["audio/mp3", "audio/mpeg", "audio/ogg"];

const GoogleDriveEmbeds = (props: { attachment: RawAttachment }) => {
  return (
    <>
      <Switch fallback={<GoogleDriveFileEmbed attachment={props.attachment} />}>
        <Match when={allowedVideoMimes.includes(props.attachment.mime!)}>
          <GoogleDriveVideoEmbed attachment={props.attachment} />
        </Match>
        <Match when={allowedAudioMimes.includes(props.attachment.mime!)}>
          <GoogleDriveAudioEmbed attachment={props.attachment} />
        </Match>
      </Switch>
    </>
  );
};

export const YoutubeEmbed = (props: {
  code: string;
  embed: RawEmbed;
  shorts: boolean;
}) => {
  const { paneWidth, height, width: windowWidth } = useWindowProperties();

  const widthOffset = -90;
  const customHeight = 0;
  const customWidth = 0;

  const style = () => {
    if (props.shorts) {
      const maxWidth = clamp(
        (customWidth || paneWidth()!) + (widthOffset || 0),
        600
      );
      const maxHeight =
        windowWidth() <= 600
          ? (customHeight || height()) / 1.4
          : (customHeight || height()) / 2;
      return clampImageSize(1080, 1920, maxWidth, maxHeight);
    }

    const maxWidth = clamp(
      (customWidth || paneWidth()!) + (widthOffset || 0),
      600
    );
    return clampImageSize(1920, 1080, maxWidth, 999999);
  };

  return <RawYoutubeEmbed {...props} style={style()} />;
};

const TwitterEmbed = (props: { path: string }) => {
  let ref: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  const existingScript = document.getElementById("twitter-wjs");
  if (!existingScript) {
    const scriptEl = document.createElement("script");
    scriptEl.src = "https://platform.twitter.com/widgets.js";
    scriptEl.async = true;
    scriptEl.id = "twitter-wjs";

    document.body.appendChild(scriptEl);
  }
  onMount(() => {
    window.twttr?.widgets.load(ref);
  });
  onCleanup(() => {
    containerRef?.remove();
  });

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <blockquote
        ref={ref}
        class="twitter-tweet"
        data-dnt="true"
        data-width="100%"
        data-conversation="none"
        data-theme="dark"
      >
        <a href={`https://twitter.com${props.path}?ref_src=twsrc%5Etfw`} />
      </blockquote>
    </div>
  );
};

const GoogleDriveVideoEmbed = (props: { attachment: RawAttachment }) => {
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();
  const [playVideo, setPlayVideo] = createSignal<boolean>(false);
  onMount(async () => {
    await initializeGoogleDrive();
  });

  // eslint-disable-next-line solid/reactivity
  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(
      props.attachment.fileId!,
      "name, size, modifiedTime, webContentLink, mimeType, thumbnailLink, videoMediaMetadata"
    ).catch((e) => console.log(e));
    // const file = await getFile(props.attachment.fileId!, "*").catch((e) => console.log(e))
    if (!file) return setError("Could not get Video.");

    if (file.mimeType !== props.attachment.mime)
      return setError("Video was modified.");

    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt!;
    if (diff >= 5000) return setError("Video was modified.");
    setFile(file);
  });

  return (
    <VideoEmbed
      error={error()}
      file={
        file()
          ? {
              url: file()!.webContentLink!,
              name: file()!.name!,
              size: parseInt(file()!.size! || "0"),
              thumbnailLink: file()?.thumbnailLink,
              provider: "google_drive",
            }
          : undefined
      }
    />
  );
};
const VideoEmbed = (props: {
  file?: {
    url: string;
    name: string;
    size: number;
    thumbnailLink?: string;
    expireAt?: number;
    provider: AttachmentProviders;
  };
  error?: string;
}) => {
  const [playVideo, setPlayVideo] = createSignal<boolean>(false);

  const onPlayClick = () => {
    if (reactNativeAPI()?.isReactNative) {
      reactNativeAPI()?.playVideo(props.file?.url!);
      return;
    }

    if (props.file?.provider === "google_drive") {
      if (
        !electronWindowAPI()?.isElectron &&
        !reactNativeAPI()?.isReactNative
      ) {
        alert(
          "Due to new Google Drive policy, you can only play videos from the Nerimity Desktop App."
        );
      }
    }
    setPlayVideo(!playVideo());
  };

  return (
    <div class={styles.videoEmbed}>
      <div class={styles.videoInfo}>
        <Show when={!props.file && !props.error}>
          <Skeleton.Item height="100%" width="100%" />
        </Show>
        <Show when={props.error}>
          <Icon name="error" color="var(--alert-color)" size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.error}</div>
          </div>
          <Button
            iconName="info"
            iconSize={16}
            onClick={() =>
              alert(
                props.file?.expireAt
                  ? "Video expired."
                  : "This Video was modified/deleted by the creator in their Google Drive. "
              )
            }
          />
        </Show>
        <Show when={props.file && !props.error}>
          <Icon
            name="insert_drive_file"
            color="var(--primary-color)"
            size={30}
          />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.file?.name}</div>
            <div class={styles.fileEmbedSize}>
              {prettyBytes(props.file?.size || 0, 0)}
            </div>
          </div>
          <Button
            iconName="download"
            onClick={() => window.open(props.file?.url, "_blank")}
          />
        </Show>
      </div>
      <Show when={props.file?.expireAt}>
        <div class={styles.expiresAt}>
          <Icon
            name="timer"
            size={14}
            color={props.error ? "var(--alert-color)" : "var(--primary-color)"}
          />
          {props.error ? "Expired " : "Expires "}
          {timeSinceMentions(props.file?.expireAt!)}
        </div>
      </Show>
      <div class={styles.video}>
        <Show when={!props.file && !props.error}>
          <Skeleton.Item height="100%" width="100%" />
        </Show>
        <Show when={props.file && !props.error}>
          <Show when={!playVideo()}>
            <Show when={props.file?.thumbnailLink}>
              <img
                crossorigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  "object-fit": "contain",
                }}
                src={props.file?.thumbnailLink}
                alt=""
              />
            </Show>
            <div onClick={onPlayClick} class={styles.playButtonContainer}>
              <div class={styles.playButton}>
                <Icon
                  name="play_arrow"
                  color="var(--primary-color)"
                  size={28}
                />
              </div>
            </div>
          </Show>
          <Show when={playVideo()}>
            <video
              crossorigin="anonymous"
              style={{ width: "100%", height: "100%", "object-fit": "contain" }}
              autoplay
              src={props.file?.url!}
              controls
            />
          </Show>
        </Show>
      </div>
    </div>
  );
};

const FileEmbed = (props: {
  error?: string;
  file?: {
    size: number;
    name: string;
    url: string;
    expireAt?: number;
    mime: string;
    previewUrl?: string;
    originalPreviewUrl?: string;
  };
}) => {
  const { createPortal } = useCustomPortal();
  const isImage = () => props.file?.mime?.startsWith("image/");

  const previewClick = () => {
    createPortal((close) => (
      <ImagePreviewModal
        close={close}
        url={props.file?.previewUrl!}
        origUrl={props.file?.originalPreviewUrl}
      />
    ));
  };

  return (
    <div
      class={cn(styles.fileEmbed, !!props.file?.expireAt && styles.willExpire)}
    >
      <Show when={!props.file && !props.error}>
        <Skeleton.Item height="100%" width="100%" />
      </Show>
      <Show when={props.error}>
        <div class={styles.fileEmbedErrorContainer}>
          <Icon name="error" color="var(--alert-color)" size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.error}</div>
          </div>
          <Button
            iconName="info"
            iconSize={16}
            margin={0}
            onClick={() =>
              alert(
                props.file?.expireAt
                  ? "File expired."
                  : "This file was modified/deleted by the creator in their Google Drive. "
              )
            }
          />
        </div>
      </Show>
      <Show when={props.file && !props.error}>
        <div class={styles.fileEmbedContainer}>
          <Icon
            name="insert_drive_file"
            color="var(--primary-color)"
            size={30}
          />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.file?.name}</div>
            <div class={styles.fileEmbedSize}>
              {prettyBytes(props.file?.size! || 0, 0)}
            </div>
          </div>
          <div class={styles.fileEmbedActions}>
            <Show when={isImage()}>
              <Button
                iconName="visibility"
                margin={0}
                onClick={previewClick}
                title="View Image"
              />
            </Show>
            <Button
              iconName="download"
              margin={0}
              title="Download"
              onClick={() => window.open(props.file?.url, "_blank")}
            />
          </div>
        </div>
      </Show>
      <Show when={props.file?.expireAt}>
        <div class={styles.expiresAt}>
          <Icon
            name="timer"
            size={14}
            color={props.error ? "var(--alert-color)" : "var(--primary-color)"}
          />
          {props.error ? "Expired " : "Expires "}
          {timeSinceMentions(props.file?.expireAt!)}
        </div>
      </Show>
    </div>
  );
};
const GoogleDriveFileEmbed = (props: { attachment: RawAttachment }) => {
  const [file, setFile] = createSignal<gapi.client.drive.File | null>(null);
  const [error, setError] = createSignal<string | undefined>();
  onMount(async () => {
    await initializeGoogleDrive();
  });

  const previewUrl = () => file()?.thumbnailLink?.slice(0, -5);
  const originalPreview = () =>
    "https://drive.google.com/uc?id=" + props.attachment.fileId;

  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(
      props.attachment.fileId!,
      "name, size, modifiedTime, webContentLink, mimeType, thumbnailLink"
    ).catch((e) => console.log(e));
    // const file = await getFile(props.attachment.fileId!, "*").catch((e) => console.log(e))
    if (!file) return setError("Could not get file.");

    if (file.mimeType !== props.attachment.mime)
      return setError("File was modified.");

    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt!;
    if (diff >= 5000) return setError("File was modified.");
    setFile(file);
  });

  return (
    <FileEmbed
      error={error()}
      file={
        file()
          ? {
              name: file()?.name!,
              mime: file()?.mimeType!,
              size: parseInt(file()?.size!),
              url: file()?.webContentLink!,
              previewUrl: previewUrl(),
              originalPreviewUrl: originalPreview(),
            }
          : undefined
      }
    />
  );
};

const inviteCache = new Map<string, ServerWithMemberCount | false>();

export function ServerInviteEmbed(props: { code: string }) {
  const navigate = useNavigate();
  const { servers } = useStore();
  const [invite, setInvite] = createSignal<
    ServerWithMemberCount | null | false
  >(null);
  const [hovered, setHovered] = createSignal(false);

  const { joinByInviteCode, joining } = useJoinServer();

  onMount(async () => {
    if (inviteCache.has(props.code))
      return setInvite(inviteCache.get(props.code)!);
    const invite = await serverDetailsByInviteCode(props.code).catch(() => {});
    setInvite(invite || false);
    inviteCache.set(props.code, invite || false);
  });

  const cachedServer = () => {
    const _invite = invite();
    if (!_invite) return;
    return servers.get(_invite.id);
  };

  const joinOrVisitServer = () => {
    const _invite = invite();
    if (!_invite) return;
    if (cachedServer())
      return navigate(
        RouterEndpoints.SERVER_MESSAGES(_invite.id, _invite.defaultChannelId)
      );

    if (joining()) return;

    joinByInviteCode(props.code, _invite.id);
  };

  return (
    <div
      class={styles.serverInviteEmbed}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Show
        when={invite()}
        fallback={
          <div class={styles.serverInviteLoading}>
            <Show when={invite() === false}>
              <Icon name="error" color="var(--alert-color)" />
            </Show>
            {invite() === false ? "Invalid Invite Code" : "Loading Invite..."}
          </div>
        }
      >
        {(invite) => (
          <>
            <Avatar
              server={invite()}
              size={40}
              animate={hovered()}
              showBorder
            />
            <div class={styles.serverInfo}>
              <div class={styles.serverName}>
                <span class={styles.serverNameOnly}>{invite()?.name}</span>
                <Show when={invite().verified}>
                  <ServerVerifiedIcon />
                </Show>
              </div>

              <div class={styles.serverMemberCount}>
                <Icon name="people" size={14} color="var(--primary-color)" />
                {invite().memberCount} member(s)
              </div>
            </div>
            <Button
              label={
                joining() ? "Joining..." : cachedServer() ? "Visit" : "Join"
              }
              iconName="login"
              onClick={joinOrVisitServer}
            />
          </>
        )}
      </Show>
    </div>
  );
}

export function OGEmbed(props: {
  message: { content?: string; embed: RawEmbed };
  customWidth?: number;
  customHeight?: number;
  customWidthOffset?: number;
}) {
  const embed = () => props.message.embed!;
  const { createPortal } = useCustomPortal();
  const [showDetailed, setShowDetailed] = createSignal(false);
  const origSrc = () => {
    const rawUrl = embed().imageUrl!;
    if (rawUrl.startsWith("https://") || rawUrl.startsWith("http://"))
      return rawUrl;
    return `https://${embed().domain}/${rawUrl}`;
  };

  const twitterStatusEmbed = () =>
    props.message.content?.match(twitterStatusLinkRegex);

  const showDetailedTwitterEmbed = () => {
    const [useTwitterEmbed, setUseTwitterEmbed] = useReactiveLocalStorage(
      StorageKeys.USE_TWITTER_EMBED,
      false
    );
    if (showDetailed()) {
      return setShowDetailed(false);
    }
    if (useTwitterEmbed()) return setShowDetailed(true);
    createPortal((close) => (
      <Modal.Root close={close} desktopMaxWidth={400}>
        <Modal.Header title="Detailed Twitter Embed" />
        <Modal.Body>
          <FlexColumn gap={8}>
            <Text opacity={0.8} size={14}>
              When using the official Twitter embed, your data will collected by
              elmo musk.
            </Text>
            <Checkbox
              label="Don't show this again."
              checked={useTwitterEmbed()}
              onChange={setUseTwitterEmbed}
            />
          </FlexColumn>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Button
            label="Don't show"
            iconName="close"
            onClick={() => {
              setUseTwitterEmbed(false);
              close();
            }}
          />
          <Modal.Button
            label="Show"
            primary
            iconName="check"
            onclick={() => {
              setShowDetailed(true);
              close();
            }}
          />
        </Modal.Footer>
      </Modal.Root>
    ));
  };

  return (
    <>
      <Switch>
        <Match when={showDetailed()}>
          <TwitterEmbed path={twitterStatusEmbed()?.[3]!} />
        </Match>
        <Match when={embed().type === "image"}>
          <ImageEmbed
            attachment={{
              id: "",
              origSrc: origSrc()!,
              path: `proxy/${encodeURIComponent(origSrc()!)}/embed.${
                embed().imageMime?.split("/")[1]
              }`,
              width: embed().imageWidth,
              height: embed().imageHeight,
            }}
            widthOffset={props.customWidthOffset || -90}
            customWidth={props.customWidth}
            customHeight={props.customHeight}
          />
        </Match>
        <Match when={embed().type !== "image"}>
          <NormalEmbed message={props.message} />
        </Match>
      </Switch>
      <Show when={twitterStatusEmbed()}>
        <Button
          label={showDetailed() ? "Basic Embed" : "Detailed Embed"}
          onclick={showDetailedTwitterEmbed}
          margin={[4, 0, 0, 0]}
        />
      </Show>
    </>
  );
}

const NormalEmbed = (props: { message: RawMessage }) => {
  const { hasFocus } = useWindowProperties();
  const { createPortal } = useCustomPortal();

  const embed = () => props.message.embed!;

  const origSrc = () => {
    const rawUrl = embed().imageUrl!;
    if (rawUrl.startsWith("https://") || rawUrl.startsWith("http://"))
      return rawUrl;
    return `https://${embed().domain}/${rawUrl}`;
  };

  const imageUrl = () =>
    `${env.NERIMITY_CDN}proxy/${encodeURIComponent(origSrc()!)}/embed.${
      embed().imageMime?.split("/")[1]
    }`;
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
    if (embed().video) {
      return onLinkClick();
    }
    createPortal((close) => (
      <ImagePreviewModal close={close} url={url(true)} origUrl={origSrc()} />
    ));
  };

  const onLinkClick = (e?: MouseEvent) => {
    e?.preventDefault();
    createPortal((close) => (
      <DangerousLinkModal unsafeUrl={embed().url} close={close} />
    ));
  };

  const largeImage = () => embed().largeImage;

  return (
    <div
      class={classNames(
        styles.ogEmbedContainer,
        conditionalClass(largeImage(), styles.largeImage)
      )}
    >
      <Show when={embed().imageUrl}>
        <div class={styles.ogEmbedImageContainer} onClick={onImageClick}>
          <Show when={embed().video}>
            <div class={styles.playButton}>
              <Icon name="play_arrow" color="var(--primary-color)" size={28} />
            </div>
          </Show>
          <Show when={!largeImage()}>
            <img src={url()} class={styles.ogEmbedImage} loading="lazy" />
          </Show>
          <Show when={largeImage()}>
            <ImageEmbed
              ignoreClick
              attachment={{
                id: "",
                origSrc: origSrc(),
                path: `proxy/${encodeURIComponent(origSrc()!)}/embed.${
                  embed().imageMime?.split("/")[1]
                }`,
                width: embed().imageWidth,
                height: embed().imageHeight,
              }}
              widthOffset={-90}
              maxWidth={500}
            />
          </Show>
        </div>
      </Show>
      <div>
        <CustomLink
          decoration
          class={styles.ogEmbedTitle}
          href={embed().url || "#"}
          onclick={onLinkClick}
          target="_blank"
          rel="noopener noreferrer"
        >
          {embed().title}
        </CustomLink>

        <div class={styles.ogEmbedDescription}>{embed().description}</div>
      </div>
    </div>
  );
};

const replaceImageUrl = (val: string, hasFocus: boolean) => {
  const regex = /url\((.*?)\)/gim;
  const regex2 = /url\((.*?)\)/im;

  return val.replaceAll(regex, (r) => {
    let url = regex2.exec(r)?.[1];
    if (!url) return r;
    if (url.startsWith('"') || url.startsWith("'")) {
      url = url.slice(1, -1);
    }
    return `url("${
      env.NERIMITY_CDN +
      "proxy/" +
      encodeURIComponent(url) +
      "/b" +
      (hasFocus ? "" : "?type=webp")
    }")`;
  });
};
const htmlEmbedContainerStyles: JSX.CSSProperties = {
  position: "relative",
  display: "flex",
  overflow: "auto",
  "align-self": "normal",
  "max-height": "500px",
};

function HTMLEmbed(props: { message: RawMessage }) {
  const id = createUniqueId();
  const embed = createMemo<HtmlEmbedItem | HtmlEmbedItem[]>(() =>
    unzipJson(props.message.htmlEmbed!)
  );
  const { hasFocus } = useWindowProperties();

  const styleItem = createMemo(
    () =>
      (embed() as HtmlEmbedItem[]).find?.((item) => item?.tag === "style")
        ?.content[0] as string | undefined
  );

  return (
    <ShadowRoot>
      <div
        class={classNames(`htmlEmbed${id}`)}
        style={htmlEmbedContainerStyles}
      >
        <HTMLEmbedItem
          items={
            Array.isArray(embed())
              ? (embed() as HtmlEmbedItem[])
              : [embed() as HtmlEmbedItem]
          }
        />
        <Show when={styleItem()}>
          {/* @scope (.htmlEmbed${id}) { */}
          <style>
            {`
            .htmlEmbed${id} {
              ${replaceImageUrl(styleItem()!, hasFocus())}
            }
          `}
          </style>
        </Show>
      </div>
    </ShadowRoot>
  );
}

function HTMLEmbedItem(props: { items: HtmlEmbedItem[] | string[] }) {
  const { createPortal } = useCustomPortal();
  const { hasFocus } = useWindowProperties();

  const onLinkClick = (e: MouseEvent) => {
    const href = (e.currentTarget as HTMLAnchorElement).href;
    const value = (e.currentTarget as HTMLAnchorElement).innerText;
    if (href !== value) {
      e.preventDefault();
      createPortal((close) => (
        <DangerousLinkModal unsafeUrl={href || "#"} close={close} />
      ));
    }
  };

  const cleanAttributes = (item: HtmlEmbedItem) => {
    if (!item?.attributes) return undefined;
    const attributes = { ...item.attributes };
    if (attributes.href) {
      if (
        !attributes.href.startsWith("http://") &&
        !attributes.href.startsWith("https://")
      ) {
        attributes.href = "#";
      }
    }
    if (attributes.style) {
      attributes.style = replaceImageUrl(attributes.style, hasFocus());
    }
    if (attributes.src) {
      attributes.src =
        env.NERIMITY_CDN +
        "proxy/" +
        encodeURIComponent(attributes.src) +
        "/b" +
        (hasFocus() ? "" : "?type=webp");
    }
    return attributes;
  };

  const replaceEscaped = (str: string) => {
    return str
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&#039;", "'");
  };
  return (
    <For each={props.items}>
      {(item) => (
        <Switch
          fallback={
            <Dynamic
              component={(item as HtmlEmbedItem)?.tag}
              {...cleanAttributes(item as HtmlEmbedItem)}
              onClick={
                (item as HtmlEmbedItem)?.tag === "a" ? onLinkClick : undefined
              }
            >
              <For each={(item as HtmlEmbedItem).content}>
                {(content) => (
                  <Switch
                    fallback={
                      <HTMLEmbedItem items={[content as HtmlEmbedItem]} />
                    }
                  >
                    <Match when={typeof content === "string"}>
                      <Markup
                        text={replaceEscaped(content as string) as string}
                      />
                    </Match>
                    <Match when={(content as HtmlEmbedItem)?.tag === "style"}>
                      <></>
                    </Match>
                  </Switch>
                )}
              </For>
            </Dynamic>
          }
        >
          <Match when={typeof item === "string"}>
            <Markup text={replaceEscaped(item as string)} />
          </Match>
          <Match when={(item as HtmlEmbedItem)?.tag === "style"}>
            <></>
          </Match>
        </Switch>
      )}
    </For>
  );
}

interface ReactionItemProps {
  textAreaEl?: HTMLTextAreaElement;
  reaction: RawMessageReaction;
  message: Message;
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

  const name = () =>
    props.reaction.emojiId
      ? props.reaction.name
      : emojiUnicodeToShortcode(props.reaction.name);

  const url = () => {
    if (!props.reaction.emojiId)
      return unicodeToTwemojiUrl(props.reaction.name);
    return `${env.NERIMITY_CDN}/emojis/${props.reaction.emojiId}.${
      props.reaction.gif ? "gif" : "webp"
    }${props.reaction.gif ? (!hasFocus() ? "?type=webp" : "") : ""}`;
  };

  const addReaction = () => {
    props.textAreaEl?.focus();
    if (props.reaction.reacted) {
      removeMessageReaction({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId,
      });
      return;
    }
    addMessageReaction({
      channelId: props.message.channelId,
      messageId: props.message.id,
      name: props.reaction.name,
      emojiId: props.reaction.emojiId,
      gif: props.reaction.gif,
    });
  };

  return (
    <Button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      margin={0}
      padding={[2, 8, 2, 2]}
      customChildrenLeft={
        <Emoji
          class={styles.emoji}
          name={name()}
          url={url()}
          custom={!!props.reaction.emojiId}
          resize={60}
        />
      }
      onClick={addReaction}
      class={classNames(
        styles.reactionItem,
        conditionalClass(props.reaction.reacted, styles.reacted)
      )}
      label={props.reaction.count.toLocaleString()}
      textSize={12}
      color={!props.reaction.reacted ? "white" : undefined}
    />
  );
}

function AddNewReactionButton(props: {
  show?: boolean;
  onClick?(event: MouseEvent): void;
}) {
  const { isMobileAgent } = useWindowProperties();
  const show = () => {
    if (isMobileAgent()) return true;
    if (props.show) return true;
  };
  return (
    <Button
      onClick={props.onClick}
      margin={0}
      padding={6}
      class={styles.reactionItem}
      styles={{ visibility: show() ? "visible" : "hidden" }}
      iconName="add"
      iconSize={15}
    />
  );
}

function Reactions(props: {
  hovered: boolean;
  textAreaEl?: HTMLTextAreaElement;
  message: Message;
  reactionPickerClick?(event: MouseEvent): void;
}) {
  const { createPortal, closePortalById } = useCustomPortal();

  const onHover = (event: MouseEvent, reaction: RawMessageReaction) => {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    createPortal(
      () => (
        <WhoReactedModal
          {...{
            x: rect.x + rect.width / 2,
            y: rect.y,
            reaction,
            message: props.message,
          }}
        />
      ),
      "whoReactedModal"
    );
  };
  const onBlur = () => {
    closePortalById("whoReactedModal");
  };

  return (
    <div class={styles.reactions}>
      <For each={props.message.reactions}>
        {(reaction) => (
          <ReactionItem
            onMouseEnter={(e) => onHover(e, reaction)}
            onMouseLeave={onBlur}
            textAreaEl={props.textAreaEl}
            message={props.message}
            reaction={reaction}
          />
        )}
      </For>
      <AddNewReactionButton
        show={props.hovered}
        onClick={props.reactionPickerClick}
      />
    </div>
  );
}

function WhoReactedModal(props: {
  x: number;
  y: number;
  reaction: RawMessageReaction;
  message: Message;
}) {
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
        limit: 5,
      });
      setUsers(newReactedUsers.map((u) => u.user));
    }, 500);

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });

  const style = () => {
    if (!height()) return { pointerEvents: "none" };
    return {
      top: props.y - height() - 5 + "px",
      left: props.x - width() / 2 + "px",
    };
  };

  const reactionCount = props.reaction.count;

  const plusCount = () => reactionCount - users()?.length!;

  return (
    <Show when={users()}>
      <div ref={setEL} class={styles.whoReactedModal} style={style()}>
        <For each={users()!}>
          {(user) => (
            <div class={styles.whoReactedItem}>
              <Avatar size={15} user={user} />
              <div>{user.username}</div>
            </div>
          )}
        </For>
        <Show when={plusCount()}>
          <div class={styles.whoReactedPlusCount}>{plusCount()} more</div>
        </Show>
      </div>
    </Show>
  );
}

const MessageReplies = (props: { message: Message }) => {
  const store = useStore();
  const replies = () => props.message.replyMessages;
  const repliesIds = () => replies().map((r) => r.replyToMessage?.id);

  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete);
  socketClient.useSocketOn(ServerEvents.MESSAGE_UPDATED, onUpdate);

  function onDelete(payload: { channelId: string; messageId: string }) {
    if (!repliesIds().includes(payload.messageId)) return;

    store.messages.updateLocalMessage(
      {
        replyMessages: props.message.replyMessages.map((m) => {
          const match = m.replyToMessage?.id === payload.messageId;
          return match ? m : {};
        }),
      },
      props.message.channelId,
      props.message.id
    );
  }

  function onUpdate(payload: {
    channelId: string;
    messageId: string;
    updated: Message;
  }) {
    if (!repliesIds().includes(payload.messageId)) return;

    const replyMessages = [...props.message.replyMessages];
    const index = replyMessages.findIndex(
      (q) => q.replyToMessage?.id === payload.messageId
    );
    replyMessages[index] = {
      ...replyMessages[index],
      ...{ replyToMessage: payload.updated },
    };
    store.messages.updateLocalMessage(
      {
        replyMessages,
      },
      props.message.channelId,
      props.message.id
    );
  }

  return (
    <Show when={replies()?.length}>
      <div class={styles.replies}>
        <For each={replies()}>
          {(reply, i) => (
            <MessageReplyItem
              replyToMessage={reply.replyToMessage}
              index={i()}
            />
          )}
        </For>
      </div>
    </Show>
  );
};

const MessageReplyItem = (props: {
  replyToMessage?: RawMessage;
  index: number;
}) => {
  const params = useParams<{ serverId?: string }>();
  const store = useStore();

  const member = () =>
    store.serverMembers.get(
      params.serverId!,
      props.replyToMessage!.createdBy.id
    );

  const topRoleColor = () => {
    if (!params.serverId) return "white";
    return member()?.roleColor() || "white";
  };

  return (
    <div
      class={styles.replyItem}
      onClick={() =>
        props.replyToMessage &&
        emitScrollToMessage({ messageId: props.replyToMessage.id })
      }
    >
      <div
        class={classNames(
          styles.line,
          props.index === 0 ? styles.first : undefined
        )}
      />
      <div class={styles.replyContentContainer}>
        <Show when={props.replyToMessage}>
          <div
            class={styles.replyUsername}
            style={{
              color: topRoleColor(),
            }}
          >
            {member()?.nickname || props.replyToMessage!.createdBy.username}
          </div>
          <Show when={props.replyToMessage!.attachments?.length}>
            <Icon name="image" color="rgba(255,255,255,0.6)" size={16} />
          </Show>
          <div class={styles.replyContent}>
            <Markup
              replaceCommandBotId
              inline
              message={props.replyToMessage!}
              text={props.replyToMessage!.content || ""}
            />
          </div>
        </Show>
        <Show when={!props.replyToMessage}>
          <div class={styles.replyContent}>Message was deleted.</div>
        </Show>
      </div>
    </div>
  );
};

/**
 * A declarative shadow root component
 *
 * Hooks into SolidJS' Portal's `useShadow` prop
 * to handle shadow DOM and the component lifecycle
 */
const ShadowRoot: ParentComponent = (props) => {
  let div: HTMLDivElement;
  return (
    <div ref={div!} style={{ width: "100%" }}>
      <Portal mount={div!} useShadow={true}>
        {props.children}
      </Portal>
    </div>
  );
};
