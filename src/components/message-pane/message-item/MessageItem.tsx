import styles from "./styles.module.scss";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import { formatTimestamp, fullDate, formatTimestampRelative } from "@/common/date";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/icon/Icon";
import {
  AttachmentProviders,
  HtmlEmbedItem,
  MessageType,
  RawAttachment,
  RawEmbed,
  RawMessage
} from "@/chat-api/RawData";
import useMessages, {
  Message,
  MessageSentStatus
} from "@/chat-api/store/useMessages";

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
  ParentComponent,
  Show,
  Switch
} from "solid-js";
import { Markup } from "@/components/Markup";
import {
  toast,
  useCustomPortal
} from "@/components/ui/custom-portal/CustomPortal";
import Button from "@/components/ui/Button";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ImageEmbed, clamp, clampImageSize } from "@/components/ui/ImageEmbed";
import { CustomLink } from "@/components/ui/CustomLink";
import { MentionUser } from "@/components/markup/MentionUser";
import env from "@/common/env";
import { useWindowProperties } from "@/common/useWindowProperties";
import { DangerousLinkModal } from "@/components/ui/DangerousLinkModal";
import {
  ServerWithMemberCount,
  getPublicServer,
  publicServerByEmojiId,
  serverDetailsByInviteCode
} from "@/chat-api/services/ServerService";
import { ServerVerifiedIcon } from "@/components/servers/ServerVerifiedIcon";
import {
  getFile,
  googleApiInitialized,
  initializeGoogleDrive
} from "@/common/driveAPI";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import useServerMembers, {
  ServerMember
} from "@/chat-api/store/useServerMembers";
import { Dynamic, Portal } from "solid-js/web";
import { Emoji as RoleEmoji } from "@/components/ui/Emoji";
import { prettyBytes } from "@/common/prettyBytes";
import { unzipJson } from "@/common/zip";
import { emitScrollToMessage } from "@/common/GlobalEvents";
import socketClient from "@/chat-api/socketClient";
import { ServerEvents } from "@/chat-api/EventNames";
import { electronWindowAPI } from "@/common/Electron";
import { reactNativeAPI } from "@/common/ReactNative";
import { GoogleDriveAudioEmbed, LocalAudioEmbed } from "./AudioEmbed";
import { ButtonsEmbed } from "./ButtonsEmbed";
import { Tooltip } from "@/components/ui/Tooltip";
import { getSystemMessage } from "@/common/SystemMessage";
import { useJoinServer } from "@/chat-api/useJoinServer";
import { Modal } from "@/components/ui/modal";
import Text from "@/components/ui/Text";
import Checkbox from "@/components/ui/Checkbox";
import { FlexColumn } from "@/components/ui/Flexbox";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";
import {
  inviteLinkRegex,
  youtubeLinkRegex,
  twitterStatusLinkRegex
} from "@/common/regex";
import { RawYoutubeEmbed } from "./RawYoutubeEmbed";
import { fetchTranslation, TranslateRes } from "@/common/GoogleTranslate";
import { userDetailsPreloader } from "@/common/createPreloader";
import { Trans, useTransContext } from "@nerimity/solid-i18lite";
import markupStyle from "@/components/Markup.scss?inline";
import avatarStyle from "@/components/ui/Avatar.module.css?inline";
import avatarBorderStyle from "@/components/avatar-borders/FounderAdminSupporterBorder.module.css?inline";
import { getFont } from "@/common/fonts";
import useAccount from "@/chat-api/store/useAccount";
import { Entity } from "@nerimity/nevula";
import { useSwipeActions } from "./useSwipeActions";
import { MessageReactions } from "./Reactions";
const ImagePreviewModal = lazy(
  () => import("@/components/ui/ImagePreviewModal")
);

const DeleteMessageModal = lazy(
  () => import("../message-delete-modal/MessageDeleteModal")
);

interface FloatingOptionsProps {
  message: Message;
  isCompact?: boolean | number;
  showContextMenu?: (event: MouseEvent) => void;
  reactionPickerClick?(event: MouseEvent): void;
  textAreaEl?: HTMLTextAreaElement;
}

function FloatOptions(props: FloatingOptionsProps) {
  const params = useParams<{ serverId: string }>();
  const { account, serverMembers, channelProperties, channels } = useStore();
  const { createPortal } = useCustomPortal();

  const hasMessageId = () => !props.message.local && props.message.sentStatus === undefined;
  const sendFailed = () => props.message.sentStatus === MessageSentStatus.FAILED;

  const replyClick = () => {
    channelProperties.addReply(props.message.channelId, props.message);
    props.textAreaEl?.focus();
  };
  const onDeleteClick = (e: MouseEvent) => {
    createPortal?.((close) => (
      <DeleteMessageModal
        instant={e.shiftKey || sendFailed() || props.message.local}
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
    props.message.type === MessageType.CONTENT &&
    hasMessageId();

  const showDelete = () => {
    if (sendFailed() || props.message.local) return true;
    if (account.user()?.id === props.message.createdBy.id) return true;
    if (!params.serverId) return false;

    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return serverMembers.hasPermission(
      member!,
      ROLE_PERMISSIONS.MANAGE_CHANNELS
    );
  };

  const showReply = () => {
    if (!hasMessageId()) return false;
    if (props.message.type !== MessageType.CONTENT) return false;
    const channel = channels.get(props.message.channelId!);
    return channel?.canSendMessage(account.user()?.id!);
  };

  const showReact = () => hasMessageId();

  return (
    <div class={cn(styles.floatOptions, "floatOptions")}>
      {props.isCompact && (
        <div class={styles.floatDate}>
          {formatTimestamp(props.message.createdAt)}
        </div>
      )}
      <Show when={showReact()}>
        <div class={styles.item} onClick={props.reactionPickerClick}>
          <Icon size={18} name="face" class={styles.icon} />
        </div>
      </Show>
      <Show when={showReply()}>
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
  showNewDayMarker?: boolean;
  isEditing?: boolean;
  containerWidth?: number;
  allowSwipeActions?: boolean;
}

interface DetailsProps {
  message: Message;
  userContextMenu?: (event: MouseEvent) => void;
  isSystemMessage?: boolean;
  isServerCreator?: boolean;
  serverMember?: ServerMember;
  showProfileFlyout?: (event: MouseEvent) => void;
  hovered: boolean;
}

const Details = (props: DetailsProps) => {
  const serverMembers = useServerMembers();
  const [t] = useTransContext();

  const topRoleWithColor = createMemo(
    () =>
      props.serverMember && serverMembers.topRoleWithColor(props.serverMember)
  );
  const font = createMemo(() =>
    getFont(props.message.createdBy.profile?.font || 0)
  );

  const muted = createMemo(() => {
    if (!props.serverMember?.muteExpireAt) return;
    return props.serverMember.muteExpireAt > Date.now();
  });

  return (
    <div class={classNames(styles.details, "details")}>
      <Show when={muted()}>
        <Tooltip
          tooltip={`Muted until ${formatTimestamp(props.serverMember?.muteExpireAt!)}`}
          anchor="right"
          class={styles.mutedTooltip}
        >
          <Icon size={18} name="volume_off" class={styles.muted} />
        </Tooltip>
      </Show>
      <CustomLink
        onClick={props.showProfileFlyout}
        decoration
        onmouseenter={() => {
          userDetailsPreloader.preload(props.message.createdBy.id);
        }}
        onContextMenu={props.userContextMenu}
        class={classNames(
          "trigger-profile-flyout",
          styles.username,
          font()?.class,
        )}
        href={
          props.message.webhookId
            ? "#"
            : RouterEndpoints.PROFILE(props.message.createdBy.id)
        }
        style={{
          "--gradient":
            topRoleWithColor()?.gradient || topRoleWithColor()?.hexColor,
          "--color": topRoleWithColor()?.hexColor!
        }}
      >
        {props.serverMember?.nickname || props.message.createdBy.username}
      </CustomLink>
      <Show
        when={
          props.serverMember &&
          serverMembers.topRoleWithIcon(props.serverMember)
        }
      >
        {(role) => (
          <RoleEmoji
            title={role().name}
            size={16}
            icon={role().icon}
            defaultPaused={true}
            hovered={props.hovered}
            resize={26}
          />
        )}
      </Show>
      <Show when={props.isSystemMessage}>
        <SystemMessage
          message={props.message}
          hovered={props.hovered}
          showProfileFlyout={props.showProfileFlyout}
          onUserContextMenu={props.userContextMenu}
        />
      </Show>
      <Show when={props.isServerCreator}>
        <div class={styles.ownerBadge}>{t("message.badge.owner")}</div>
      </Show>
      <Show when={props.message.pinned}>
        <div class={styles.pinnedIcon} title="Pinned Message">
          <Icon name="keep" size={16} />
        </div>
      </Show>
      <Show when={props.message.createdBy.bot}>
        <div class={styles.ownerBadge}>
          {props.message.webhookId
            ? t("message.badge.webhook")
            : t("message.badge.bot")}
        </div>
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
};

const MessageItem = (props: MessageItemProps) => {
  const params = useParams();
  const [t] = useTransContext();
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

  const { createRegisteredPortal } = useCustomPortal();

  const [messageItemRef, setMessageItemRef] = createSignal<HTMLDivElement>();
  const swipeActions = useSwipeActions(() => ({
    message: props.message,
    allowSwipeActions: props.allowSwipeActions,
    textAreaEl: props.textAreaEl,
    messageItemRef: messageItemRef()
  }));

  const isNewDay = createMemo(() => {
    if (!props.showNewDayMarker) return false;
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

  const isSystemMessage = () => props.message.type !== MessageType.CONTENT;

  const isCompact = () =>
    !isSystemMessage() &&
    !props.message.replyMessages?.length &&
    isSameCreator() &&
    isDateUnderFiveMinutes() &&
    isBeforeMessageContent();

  const isSending = () => props.message.sentStatus === MessageSentStatus.SENDING;

  const [isMentioned, setIsMentioned] = createSignal(false);
  const [isSomeoneMentioned, setIsSomeoneMentioned] = createSignal(false);
  const [blockedMessage, setBlockedMessage] = createSignal(false);

  createEffect(() => {
    setBlockedMessage(friends.hasBeenBlockedByMe(props.message.createdBy.id));
  });

  const hasPermissionToMentionEveryone = () => {
    if (!params.serverId) return false;
    const member = serverMember();
    if (!member) return false;
    if (serverMembers.isServerCreator(member)) return true;
    return serverMembers.hasPermission(
      member,
      ROLE_PERMISSIONS.MENTION_EVERYONE
    );
  };

  const updateTranslation = async () => {
    const translated = await fetchTranslation(props.message.content!).catch(
      () => {
        toast(t("message.translationError"));
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
        blockedMessage
      ],
      () => {
        if (blockedMessage()) return;
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
            serverMember() &&
            serverMembers.hasPermission(
              serverMember()!,
              ROLE_PERMISSIONS.MENTION_ROLES
            ) &&
            props.message.roleMentions.find(
              (r) =>
                r.id !== server()?.defaultRoleId &&
                serverMembers.hasRole(selfMember()!, r.id)
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
    if (props.message.webhookId) return;
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
        userId: props.message.createdBy.id
      },
      "profile-pane-flyout-" + props.message.createdBy.id,
      true
    );
  };

  return (
    <>
      <Show when={isNewDay()}>
        <div class={styles.newDayMarker}>
          {fullDate(props.message.createdAt)}
        </div>
      </Show>
      <div
        class={classNames(
          styles.messageItem,
          conditionalClass(isCompact(), styles.compact),
          conditionalClass(isMentioned(), styles.mentioned),
          conditionalClass(props.isEditing, styles.isEditing),
          conditionalClass(isSomeoneMentioned(), styles.someoneMentioned),
          props.class,
          "messageItem"
        )}
        ref={setMessageItemRef}
        onContextMenu={props.contextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        id={`message-${props.message.id}`}
        onTouchMove={swipeActions.handleTouchMove}
        onTouchStart={swipeActions.handleTouchStart}
        onTouchEnd={swipeActions.handleTouchEnd}
      >
        <div class={styles.actionIndicator}>
          <Show when={swipeActions.action() === "reply"}>
            <Icon name="reply" size={24} color="var(--primary-color)" />
          </Show>
          <Show when={swipeActions.action() === "edit"}>
            <Icon name="edit" size={24} color="var(--success-color)" />
          </Show>
        </div>
        <Show when={!props.hideFloating && hovered() && !isSending()}>
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
                {t("message.blocked")}
              </div>
            </Show>
          }
        >
          <Match when={isSystemMessage()}>
            <div>
              <SystemMessage
                message={props.message}
                hovered={hovered()}
                onUserContextMenu={props.userContextMenu}
                showProfileFlyout={showProfileFlyout}
              />
              <Show when={props.message.reactions?.length}>
                <div class={styles.systemMessageReactions}>
                  <MessageReactions
                    textAreaEl={props.textAreaEl}
                    reactionPickerClick={props.reactionPickerClick}
                    hovered={hovered()}
                    message={props.message}
                  />
                </div>
              </Show>
            </div>
          </Match>
          <Match when={!isSystemMessage() && !blockedMessage()}>
            <div class={styles.messageInner}>
              <MessageReplies message={props.message} />
              <div class={styles.messageInnerInner}>
                <Show when={!isCompact()}>
                  <A
                    onClick={showProfileFlyout}
                    onContextMenu={props.userContextMenu}
                    href={
                      props.message.webhookId
                        ? "#"
                        : RouterEndpoints.PROFILE(props.message.createdBy.id)
                    }
                    onmouseenter={() => {
                      userDetailsPreloader.preload(props.message.createdBy.id);
                    }}
                    class={classNames(
                      styles.avatar,
                      "avatar",
                      "trigger-profile-flyout"
                    )}
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
                  <Content
                    containerWidth={props.containerWidth}
                    message={props.message}
                    hovered={hovered()}
                  />
                  <Show when={translatedContent()}>
                    <div class={styles.translationArea}>
                      <span class={styles.title}>
                        {t("message.translation.title")}{" "}
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
                    <MessageReactions
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

const updateCheckEntity = (
  message: Message,
  entity: Entity,
  state: boolean
) => {
  const messages = useMessages();

  const text = message.content ?? "";
  const before = text.slice(0, entity.outerSpan.start);
  const checkbox = `-[${state ? "x" : " "}]`;
  const after = text.slice(entity.outerSpan.end, text.length);

  messages.editAndStoreMessage(
    message.channelId,
    message.id,
    `${before}${checkbox}${after}`
  );
};

const Content = (props: {
  message: Message;
  hovered: boolean;
  containerWidth?: number;
}) => {
  const params = useParams<{ serverId?: string }>();
  const store = useStore();
  const [t] = useTransContext();
  const account = useAccount();

  const canEditMessage = () =>
    account.user()?.id === props.message.createdBy.id &&
    props.message.type === MessageType.CONTENT;

  const isImageEmbedOnlyMessage = () => {
    const content = props.message.content;
    if (!content) return false;
    if (props.message.embed?.type !== "image") return false;
    try {
      new URL(content);
      return !content.includes(" ");
    } catch {
      return false;
    }
  };

  return (
    <div class={styles.content}>
      <Show when={!isImageEmbedOnlyMessage()}>
        <Markup
          replaceCommandBotId
          message={props.message}
          text={props.message.content || ""}
          serverId={params.serverId}
          canEditCheckboxes={canEditMessage()}
          onCheckboxChanged={(entity, state) =>
            updateCheckEntity(props.message, entity, state)
          }
        />
      </Show>
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
          label={t("message.dismissButton")}
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
  const [t] = useTransContext();
  const editedAt = () => {
    if (!props.message.editedAt) return;
    return t("message.editedAt", {
      time: formatTimestamp(props.message.editedAt)
    });
  };

  return (
    <Switch>
      <Match when={props.message.sentStatus === MessageSentStatus.FAILED}>
        <div class={styles.sentStatus}>
          <Icon
            class={styles.icon}
            name="error_border"
            size={14}
            color="var(--alert-color)"
          />
        </div>
      </Match>
      <Match when={props.message.sentStatus === MessageSentStatus.SENDING}>
        <div class={styles.sentStatus}>
          <Icon
            class={styles.icon}
            name="schedule"
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

const SystemMessage = (props: {
  message: Message;
  hovered: boolean;
  onUserContextMenu?: (event: MouseEvent) => void;
  showProfileFlyout?: (event: MouseEvent) => void;
}) => {
  const systemMessage = createMemo(() =>
    getSystemMessage(props.message.type, props.message.createdBy.bot)
  );

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
        <div class={styles.contentContainer}>
          <A
            href={RouterEndpoints.PROFILE(props.message.createdBy.id)}
            onContextMenu={props.onUserContextMenu}
            onClick={props.showProfileFlyout}
          >
            <Avatar
              animate={props.hovered}
              class="trigger-profile-flyout"
              user={props.message.createdBy}
              size={30}
            />
          </A>
          <div class={styles.content}>
            <span class="markup">
              <Trans
                key={systemMessage()?.message!}
                components={{
                  User: <MentionUser user={props.message.createdBy} />,
                  "2": (props: { children: string }) => (
                    <span>{props.children}</span>
                  )
                }}
              />
            </span>
            <span class={styles.date}>
              {formatTimestamp(props.message.createdAt)}
            </span>
          </div>
        </div>
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
  containerWidth?: number;
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
          containerWidth={props.containerWidth}
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
              containerWidth={props.containerWidth}
              code={youtubeEmbed()[3]!}
              embed={props.message.embed!}
              shorts={youtubeEmbed()[1]?.endsWith("shorts")!}
            />
          )}
        </Match>
        <Match
          when={props.message.attachments?.[0]?.provider === "google_drive"}
        >
          <GoogleDriveEmbeds attachment={props.message.attachments?.[0]!} />
        </Match>
        <Match when={props.message.embed}>
          <OGEmbed message={props.message} customWidth={props.containerWidth} />
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
  containerWidth?: number;
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
          customWidth={props.containerWidth}
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
  const [t] = useTransContext();
  const isExpired = () => {
    return props.attachment.expireAt && Date.now() > props.attachment.expireAt;
  };
  return (
    <VideoEmbed
      error={isExpired() ? t("fileEmbed.fileExpired") : undefined}
      file={{
        name: decodeURIComponent(
          props.attachment.path?.split("/").reverse()[0]!
        ),
        size: props.attachment.filesize!,
        url: env.NERIMITY_CDN + props.attachment.path!,
        expireAt: props.attachment.expireAt,
        provider: "local"
      }}
    />
  );
};

const LocalFileEmbed = (props: { attachment: RawAttachment }) => {
  const isExpired = () =>
    props.attachment.expireAt && Date.now() > props.attachment.expireAt;
  const [t] = useTransContext();

  return (
    <FileEmbed
      error={isExpired() ? t("fileEmbed.fileExpired") : undefined}
      file={{
        name: decodeURIComponent(
          props.attachment.path?.split("/").reverse()[0]!
        ),
        mime: props.attachment.mime!,
        size: props.attachment.filesize!,
        url: env.NERIMITY_CDN + props.attachment.path!,
        previewUrl: env.NERIMITY_CDN + props.attachment.path!,
        expireAt: props.attachment.expireAt
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
  containerWidth?: number;
}) => {
  const { paneWidth, height } = useWindowProperties();

  const widthOffset = -90;
  const customHeight = 0;
  const customWidth = 0;

  const containerWidth = () => props.containerWidth ?? paneWidth()!;

  const style = () => {
    if (props.shorts) {
      const maxWidth = clamp(
        (customWidth || containerWidth()) + (widthOffset || 0),
        600
      );
      const maxHeight =
        containerWidth() <= 600
          ? (customHeight || height()) / 1.4
          : (customHeight || height()) / 2;
      return clampImageSize(1080, 1920, maxWidth, maxHeight);
    }

    const maxWidth = clamp(
      (customWidth || containerWidth()) + (widthOffset || 0),
      600
    );
    return clampImageSize(1920, 1080, maxWidth, 999999);
  };

  return <RawYoutubeEmbed {...props} style={style()} />;
};

const TwitterEmbed = (props: { path: string }) => {
  let ref: HTMLQuoteElement | undefined;
  let containerRef: HTMLDivElement | undefined;

  const loadWidget = () => {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load(ref);
    } else {
      setTimeout(loadWidget, 100);
    }
  };

  onMount(() => {
    const existingScript = document.getElementById("twitter-wjs");

    if (!existingScript) {
      const scriptEl = document.createElement("script");
      scriptEl.src = "https://platform.twitter.com/widgets.js";
      scriptEl.async = true;
      scriptEl.id = "twitter-wjs";
      document.body.appendChild(scriptEl);
    }

    loadWidget();
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
  const [t] = useTransContext();

  onMount(async () => {
    await initializeGoogleDrive();
  });

  createEffect(async () => {
    if (!googleApiInitialized()) return;
    const file = await getFile(
      props.attachment.fileId!,
      "name, size, modifiedTime, webContentLink, mimeType, thumbnailLink, videoMediaMetadata"
    ).catch((e) => console.log(e));

    if (!file) return setError(t("fileEmbed.videoEmbed.couldNotGetVideo"));
    if (file.mimeType !== props.attachment.mime)
      return setError(t("fileEmbed.videoEmbed.videoModified"));

    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt!;
    if (diff >= 5000) return setError(t("fileEmbed.videoEmbed.videoModified"));

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
              provider: "google_drive"
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
  const [t] = useTransContext();

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
        toast(t("fileEmbed.videoEmbed.googleDrivePolicy"));
      }
    }
    setPlayVideo(!playVideo());
  };

  const alertExpiredOrModified = () =>
    toast(
      props.file?.expireAt
        ? t("fileEmbed.videoEmbed.videoExpired") // Can probably move all "expired" to use a central expired string in future
        : t("fileEmbed.videoEmbed.modifiedOrDeleted")
    );

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
            onClick={alertExpiredOrModified}
          />
        </Show>

        <Show when={props.file && !props.error}>
          <Icon name="draft" color="var(--primary-color)" size={30} />
          <div class={styles.fileEmbedDetails}>
            <div class={styles.fileEmbedName}>{props.file?.name}</div>
            <div class={styles.fileEmbedSize}>
              {prettyBytes(props.file?.size || 0, 0)}
            </div>
          </div>
          <Button
            onClick={() => window.open(props.file?.url, "_blank")}
            iconName="download"
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
          {props.error
            ? t("fileEmbed.expired", {
                time: formatTimestampRelative(props.file?.expireAt!)
              })
            : t("fileEmbed.expires", {
                time: formatTimestampRelative(props.file?.expireAt!)
              })}
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
                  "object-fit": "contain"
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
  const [t] = useTransContext();

  const previewClick = () => {
    createPortal((close) => (
      <ImagePreviewModal
        close={close}
        url={props.file?.previewUrl!}
        origUrl={props.file?.originalPreviewUrl}
      />
    ));
  };

  const alertExpired = () =>
    toast(
      props.file?.expireAt
        ? t("fileEmbed.fileExpired")
        : t("fileEmbed.modifiedOrDeleted")
    );

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
            onClick={alertExpired}
          />
        </div>
      </Show>

      <Show when={props.file && !props.error}>
        <div class={styles.fileEmbedContainer}>
          <Icon name="draft" color="var(--primary-color)" size={30} />
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
                title={t("fileEmbed.viewImage")}
              />
            </Show>
            <Button
              iconName="download"
              margin={0}
              title={t("fileEmbed.download")}
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
          {props.error
            ? t("fileEmbed.expired", {
                time: formatTimestampRelative(props.file?.expireAt!)
              })
            : t("fileEmbed.expires", {
                time: formatTimestampRelative(props.file?.expireAt!)
              })}
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
  const [t] = useTransContext();

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
    if (!file) return setError(t("fileEmbed.couldNotGetFile"));

    if (file.mimeType !== props.attachment.mime)
      return setError(t("fileEmbed.fileModified"));

    const fileTime = new Date(file.modifiedTime!).getTime();
    const diff = fileTime - props.attachment.createdAt!;
    if (diff >= 5000) return setError(t("fileEmbed.fileModified"));
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
              originalPreviewUrl: originalPreview()
            }
          : undefined
      }
    />
  );
};

const inviteCache = new Map<string, ServerWithMemberCount | false>();

export function ServerInviteEmbed(props: { code?: string; emojiId?: string }) {
  const navigate = useNavigate();
  const { servers, serverMembers } = useStore();
  const [t] = useTransContext();
  const [invite, setInvite] = createSignal<
    ServerWithMemberCount | null | false
  >(null);
  const [hovered, setHovered] = createSignal(false);

  const { joinByInviteCode, joinPublicById, joining } = useJoinServer();

  const cacheId = props.code
    ? `invite/${props.code}`
    : props.emojiId
      ? `emoji/${props.emojiId}`
      : "";

  const serverDetailsByEmoji = async (emojiId: string) => {
    const cachedEmoji = servers
      .emojisUpdatedDupName()
      .find((e) => e.id === props.emojiId);

    const serverId = cachedEmoji?.serverId;
    if (serverId) {
      const server = servers.get(serverId);
      if (server) {
        return {
          memberCount: (serverMembers.array(serverId) || []).length,
          ...server
        };
      }
    }

    const exploreItem = await publicServerByEmojiId(emojiId).catch(() => {});
    if (exploreItem && exploreItem.server) {
      return {
        memberCount: exploreItem.server._count?.serverMembers || 0,
        ...exploreItem.server
      };
    }
  };

  onMount(async () => {
    if (inviteCache.has(cacheId)) return setInvite(inviteCache.get(cacheId)!);

    let invite;
    if (props.code) {
      invite = await serverDetailsByInviteCode(props.code).catch(() => {});
    } else if (props.emojiId) {
      invite = await serverDetailsByEmoji(props.emojiId).catch(() => {});
    }
    setInvite(invite || false);
    inviteCache.set(cacheId, invite || false);
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

    if (props.code) {
      joinByInviteCode(props.code, _invite.id);
    } else if (props.emojiId) {
      joinPublicById(_invite.id);
    }
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
            <Switch fallback={t("invite.loading")}>
              <Match when={invite() === false && props.emojiId}>
                <span class={styles.serverInvitePrivate}>
                  {t("invite.privateEmoji")}
                </span>
              </Match>
              <Match when={invite() === false}>
                <Icon name="error" color="var(--alert-color)" />
                {t("invite.invalid")}
              </Match>
            </Switch>
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
                <Icon name="group" size={14} color="var(--primary-color)" />
                {invite().memberCount}{" "}
                {invite().memberCount === 1
                  ? t("invite.member")
                  : t("invite.members")}
              </div>
            </div>
            <Button
              label={
                joining()
                  ? t("invite.joiningButton")
                  : cachedServer()
                    ? t("invite.visitButton")
                    : t("invite.joinButton")
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
  message: { content?: string; embed?: RawEmbed | null };
  customWidth?: number;
  customHeight?: number;
  customWidthOffset?: number;
}) {
  const embed = () => props.message.embed!;
  const { createPortal } = useCustomPortal();
  const [showDetailed, setShowDetailed] = createSignal(false);
  const [t] = useTransContext();

  const origSrc = () => {
    const rawUrl = embed().imageUrl!;
    if (rawUrl.startsWith("https://") || rawUrl.startsWith("http://"))
      return rawUrl;
    return `https://${embed().domain}/${rawUrl}`;
  };

  const twitterStatusEmbed = () =>
    props.message.content?.match(twitterStatusLinkRegex);

  const showDetailedTwitterEmbed = () => {
    const [useTwitterEmbed, setUseTwitterEmbed] = useLocalStorage(
      StorageKeys.USE_TWITTER_EMBED,
      false
    );
    if (showDetailed()) {
      return setShowDetailed(false);
    }
    if (useTwitterEmbed()) return setShowDetailed(true);
    createPortal((close) => (
      <Modal.Root close={close} desktopMaxWidth={400}>
        <Modal.Header title={t("message.twitterEmbed.modalTitle")} />
        <Modal.Body>
          <FlexColumn gap={8}>
            <Text opacity={0.8} size={14}>
              {t("message.twitterEmbed.modalDescription")}
            </Text>
            <Checkbox
              label={t("message.twitterEmbed.doNotShowAgain")}
              checked={useTwitterEmbed()}
              onChange={setUseTwitterEmbed}
            />
          </FlexColumn>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Button
            label={t("message.twitterEmbed.closeButton")}
            iconName="close"
            onClick={() => {
              setUseTwitterEmbed(false);
              close();
            }}
          />
          <Modal.Button
            label={t("message.twitterEmbed.showButton")}
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
    <Show when={embed()}>
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
                embed().imageMime?.split("/")[1] +
                (embed().animated ? "#a" : "")
              }`,
              width: embed().imageWidth,
              height: embed().imageHeight
            }}
            widthOffset={props.customWidthOffset || -90}
            customWidth={props.customWidth}
            customHeight={props.customHeight}
          />
        </Match>
        <Match when={embed().type !== "image"}>
          <NormalEmbed
            message={props.message}
            containerWidth={props.customWidth}
          />
        </Match>
      </Switch>
      <Show when={twitterStatusEmbed()}>
        <Button
          label={
            showDetailed()
              ? t("message.twitterEmbed.basicEmbed")
              : t("message.twitterEmbed.detailedEmbed")
          }
          onclick={showDetailedTwitterEmbed}
          margin={[4, 0, 0, 0]}
        />
      </Show>
    </Show>
  );
}

const NormalEmbed = (props: {
  message: { embed?: RawEmbed | null };
  containerWidth?: number;
}) => {
  const { shouldAnimate } = useWindowProperties();
  const { createPortal } = useCustomPortal();
  const [hovered, setHovered] = createSignal(false);

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

  const url = (alwaysPlay?: boolean) => {
    const url = new URL(imageUrl());
    if (alwaysPlay) return url.href;
    if (!isGif()) return url.href;

    if (!shouldAnimate(hovered())) {
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
              customWidth={props.containerWidth}
              ignoreClick
              attachment={{
                id: "",
                origSrc: origSrc(),
                path: `proxy/${encodeURIComponent(origSrc()!)}/embed.${
                  embed().imageMime?.split("/")[1]
                }`,
                width: embed().imageWidth,
                height: embed().imageHeight
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

const replaceImageUrl = (val: string, shouldAnimate: boolean) => {
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
      (shouldAnimate ? "" : "?type=webp")
    }")`;
  });
};
const htmlEmbedContainerStyles: JSX.CSSProperties = {
  position: "relative",
  display: "flex",
  overflow: "auto",
  "align-self": "normal",
  "max-height": "500px"
};

function HTMLEmbed(props: { message: RawMessage }) {
  const id = createUniqueId();
  const embed = createMemo<HtmlEmbedItem | HtmlEmbedItem[]>(() =>
    unzipJson(props.message.htmlEmbed!)
  );
  const { shouldAnimate } = useWindowProperties();
  const [hovered, setHovered] = createSignal(false);

  const styleItem = createMemo(
    () =>
      (embed() as HtmlEmbedItem[]).find?.((item) => item?.tag === "style")
        ?.content[0] as string | undefined
  );

  return (
    <ShadowRoot>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        class={classNames(`htmlEmbed${id}`)}
        style={htmlEmbedContainerStyles}
      >
        <HTMLEmbedItem
          animate={shouldAnimate(hovered())}
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
              ${replaceImageUrl(styleItem()!, shouldAnimate(hovered()))}
            }
          `}
          </style>
        </Show>
      </div>
    </ShadowRoot>
  );
}

function HTMLEmbedItem(props: {
  items: HtmlEmbedItem[] | string[];
  animate: boolean;
}) {
  const { createPortal } = useCustomPortal();

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
      attributes.style = replaceImageUrl(attributes.style, props.animate);
    }
    if (attributes.src) {
      attributes.src =
        env.NERIMITY_CDN +
        "proxy/" +
        encodeURIComponent(attributes.src) +
        "/b" +
        (props.animate ? "" : "?type=webp");
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
                      <HTMLEmbedItem
                        animate={props.animate}
                        items={[content as HtmlEmbedItem]}
                      />
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
        })
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
      ...{ replyToMessage: payload.updated }
    };
    store.messages.updateLocalMessage(
      {
        replyMessages
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
  const [t] = useTransContext();

  const member = () =>
    store.serverMembers.get(
      params.serverId!,
      props.replyToMessage?.createdBy?.id!
    );

  const topRoleWithColor = createMemo(
    () => member() && store.serverMembers.topRoleWithColor(member()!)
  );

  const hasAttachments = () => props.replyToMessage?.attachments?.length;

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
              "--gradient":
                topRoleWithColor()?.gradient || topRoleWithColor()?.hexColor,
              "--color": topRoleWithColor()?.hexColor!
            }}
          >
            {member()?.nickname || props.replyToMessage!.createdBy?.username}
          </div>
          <Show when={hasAttachments()}>
            <Icon name="image" color="rgba(255,255,255,0.6)" size={16} />
          </Show>
          <div class={styles.replyContent}>
            <Markup
              replaceCommandBotId
              inline
              message={props.replyToMessage!}
              text={
                props.replyToMessage!.content ||
                (hasAttachments() ? t("message.imageMessage") : "")
              }
            />
          </div>
        </Show>
        <Show when={!props.replyToMessage}>
          <div class={styles.replyContent}>{t("message.deletedMessage")}</div>
        </Show>
      </div>
    </div>
  );
};

const markupStyleSheet = new CSSStyleSheet();
markupStyleSheet.replaceSync(markupStyle);
const avatarStyleSheet = new CSSStyleSheet();
avatarStyleSheet.replaceSync(avatarStyle);
const avatarBorderStyleSheet = new CSSStyleSheet();
avatarBorderStyleSheet.replaceSync(avatarBorderStyle);

/**
 * A declarative shadow root component
 *
 * Hooks into SolidJS' Portal's `useShadow` prop
 * to handle shadow DOM and the component lifecycle
 */
const ShadowRoot: ParentComponent = (props) => {
  let containerRef: HTMLDivElement | undefined;

  const applyStyles = (el: HTMLDivElement) => {
    const shadow = el.shadowRoot;
    if (shadow) {
      shadow.adoptedStyleSheets = [
        markupStyleSheet,
        avatarStyleSheet,
        avatarBorderStyleSheet
      ];
    }
  };

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <Show when={containerRef}>
        <Portal mount={containerRef} useShadow={true} ref={applyStyles}>
          {props.children}
        </Portal>
      </Show>
    </div>
  );
};
