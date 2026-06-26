import styles from "./styles.module.scss";
import { Message, MessageSentStatus } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import ContextMenu, {
  ContextMenuProps
} from "@/components/ui/context-menu/ContextMenu";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { createEffect, createSignal, For, lazy, on, Show } from "solid-js";
import { useParams } from "solid-navigator";
import { CreateTicketModal } from "@/components/CreateTicketModal";
import { MessageType, RawMessageReaction } from "@/chat-api/RawData";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import {
  fetchMessageReactedUsers,
  markMessageUnread,
  ReactedUser
} from "@/chat-api/services/MessageService";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import { t } from "@nerimity/i18lite";
import { copyToClipboard } from "@/common/clipboard";
import env from "@/common/env";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { formatTimestamp } from "@/common/date";
import Avatar from "@/components/ui/Avatar";
import {
  emojiShortcodeToUnicode,
  emojiUnicodeToShortcode,
  unicodeToTwemojiUrl
} from "@/emoji";
import { useWindowProperties } from "@/common/useWindowProperties";
import { Emoji as UiEmoji } from "@/components/ui/Emoji";
import { cn } from "@/common/classNames";
import Icon from "@/components/ui/icon/Icon";
import { Emoji } from "@/components/markup/Emoji";
import ItemContainer from "@/components/ui/LegacyItem";
import { Modal } from "@/components/ui/modal";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { addReminder } from "@/chat-api/services/ReminderService";
import Text from "@/components/ui/Text";

const DeleteMessageModal = lazy(
  () => import("../message-delete-modal/MessageDeleteModal")
);
const PinConfirmModal = lazy(
  () => import("../pin-confirm-modal/PinConfirmModal")
);

type MessageContextMenuProps = Omit<ContextMenuProps, "items"> & {
  message: Message;
  clickEvent: MouseEvent;
  quoteMessage(): void;
  replyMessage(): void;
  translateMessage?(): void;
  addReaction(shortcode: string, message: Message): void;
};

export function MessageContextMenu(props: MessageContextMenuProps) {
  const params = useParams<{ serverId?: string }>();
  const { createPortal } = useCustomPortal();
  const { account, serverMembers, channels } = useStore();

  const channel = () => channels.get(props.message.channelId!);

  const hasMessageId = () =>
    !props.message.local && props.message.sentStatus === undefined;
  const sendFailed = () =>
    props.message.sentStatus === MessageSentStatus.FAILED;

  const onDeleteClick = (e?: MouseEvent) => {
    createPortal?.((close) => (
      <DeleteMessageModal
        instant={e?.shiftKey || sendFailed() || props.message.local}
        close={close}
        message={props.message}
      />
    ));
  };

  const onViewReactionsClick = () => {
    createPortal?.((close) => (
      <ViewReactionsModal close={close} message={props.message} />
    ));
  };

  const onEditClick = () => {
    const { channelProperties } = useStore();
    channelProperties.setEditMessage(props.message.channelId, props.message);
  };

  const onReportClick = () => {
    createPortal((close) => (
      <CreateTicketModal
        close={close}
        ticket={{
          id: "ABUSE",
          userId: props.message.createdBy.id,
          messageId: props.message.id
        }}
      />
    ));
  };

  const showEdit = () =>
    account.user()?.id === props.message.createdBy.id &&
    props.message.type === MessageType.CONTENT &&
    hasMessageId();

  const showDelete = () => {
    if (sendFailed()) return true;
    if (account.user()?.id === props.message.createdBy.id) return true;
    if (!params.serverId) return false;

    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return serverMembers.hasPermission(
      member!,
      ROLE_PERMISSIONS.MANAGE_CHANNELS
    );
  };

  const showPin = () => {
    if (props.message.type !== MessageType.CONTENT || !hasMessageId())
      return false;
    if (!params.serverId) return true;
    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return serverMembers.hasPermission(
      member!,
      ROLE_PERMISSIONS.MANAGE_CHANNELS
    );
  };

  const showReminder = () => {
    if (props.message.type === MessageType.CONTENT && hasMessageId())
      return true;
  };

  const showQuote = () => {
    if (props.message.type !== MessageType.CONTENT || !hasMessageId())
      return false;
    return channel()?.canSendMessage(account.user()?.id!);
  };
  const showReply = () => {
    if (props.message.type !== MessageType.CONTENT || !hasMessageId())
      return false;
    return channel()?.canSendMessage(account.user()?.id!);
  };
  const showReact = () => hasMessageId();

  const hasReactions = () => props.message?.reactions.length;
  const hasContent = () => props.message.content;
  const isSelfMessage = () => account.user()?.id === props.message.createdBy.id;
  const showReportMessage = () => !isSelfMessage() && !props.message.local;

  const onMarkUnreadClick = () => {
    markMessageUnread({
      channelId: props.message.channelId,
      messageId: props.message.id
    });
  };

  const onTranslateClick = () => {
    props.translateMessage?.();
  };

  const onSetReminderClick = () => {
    createPortal?.((close) => (
      <SetReminderModal close={close} message={props.message} />
    ));
  };

  const onPinClick = () => {
    createPortal?.((close) => (
      <PinConfirmModal close={close} message={props.message} />
    ));
  };

  const onReactPickerClick = (event: MouseEvent) => {
    createPortal?.((close) => (
      <FloatingEmojiPicker
        onClick={(shortcode) => props.addReaction(shortcode, props.message)}
        close={close}
        x={event.clientX}
        y={event.clientY}
      />
    ));
    props.onClose?.();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderHtml(nodeOrNodes: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderSingleNode = (node: any) => {
      let html = `<${node.tag}`;
      if (node.attributes) {
        for (const key in node.attributes) {
          if (Object.prototype.hasOwnProperty.call(node.attributes, key)) {
            const encodedValue = node.attributes[key].replace(/"/g, "&quot;");
            html += ` ${key}="${encodedValue}"`;
          }
        }
      }
      html += ">";

      for (const contentItem of node.content) {
        if (typeof contentItem === "string") {
          html += contentItem;
        } else {
          html += renderSingleNode(contentItem);
        }
      }

      html += `</${node.tag}>`;
      return html;
    };

    if (typeof nodeOrNodes === "string") {
      return nodeOrNodes;
    } else if (Array.isArray(nodeOrNodes)) {
      return nodeOrNodes.map(renderSingleNode).join("\n");
    } else {
      return renderSingleNode(nodeOrNodes);
    }
  }

  return (
    <ContextMenu
      triggerClassName="floatingShowMore"
      {...props}
      header={
        <Show when={showReact()}>
          <MessageReactHeader
            addReaction={(shortcode: string) => {
              props.addReaction(shortcode, props.message);
              props.onClose?.();
            }}
            openReactPicker={(ev: MouseEvent) => onReactPickerClick(ev)}
          />
        </Show>
      }
      items={[
        ...(hasReactions()
          ? [
              {
                icon: "face",
                label: t("messageContextMenu.viewReactions"),
                onClick: onViewReactionsClick
              }
            ]
          : []),

        ...(hasContent()
          ? [
              {
                icon: "translate",
                label: t("messageContextMenu.translateMessage"),
                onClick: onTranslateClick
              }
            ]
          : []),
        ...(showReminder()
          ? [
              {
                icon: "notifications",
                label: t("messageContextMenu.setReminder"),
                onClick: onSetReminderClick
              }
            ]
          : []),
        ...(hasMessageId()
          ? [
              {
                icon: "mark_chat_unread",
                label: t("messageContextMenu.markUnread"),
                onClick: onMarkUnreadClick
              }
            ]
          : []),
        showPin()
          ? {
              icon: "keep",
              label: props.message.pinned
                ? t("messageContextMenu.unpinMessage")
                : t("messageContextMenu.pinMessage"),
              alert: props.message.pinned,
              onClick: onPinClick
            }
          : {},
        ...(showQuote()
          ? [
              {
                icon: "format_quote",
                label: t("messageContextMenu.quoteMessage"),
                onClick: props.quoteMessage
              }
            ]
          : []),
        ...(showReply()
          ? [
              {
                icon: "reply",
                label: t("messageContextMenu.reply"),
                onClick: props.replyMessage
              }
            ]
          : []),
        ...(showEdit()
          ? [
              {
                icon: "edit",
                label: t("messageContextMenu.editMessage")!,
                onClick: onEditClick
              }
            ]
          : []),
        ...(showDelete()
          ? [
              {
                icon: "delete",
                label: t("messageContextMenu.deleteMessage")!,
                onClick: onDeleteClick,
                alert: true
              }
            ]
          : []),
        ...(showReportMessage()
          ? [
              {
                icon: "flag",
                label: t("messageContextMenu.reportMessage")!,
                onClick: onReportClick,
                alert: true
              }
            ]
          : []),

        { separator: true },

        ...(hasMessageId()
          ? [
              {
                icon: "link",
                label: t("messageContextMenu.copyMessageLink")!,
                onClick: () => {
                  const channel = channels.get(props.message.channelId!);
                  if (channel?.serverId) {
                    return copyToClipboard(
                      `${env.APP_URL}/app/servers/${channel.serverId}/${channel.id}?messageId=${props.message.id}`
                    );
                  }
                  return copyToClipboard(
                    `${env.APP_URL}/app/inbox/${channel?.id}?messageId=${props.message.id}`
                  );
                }
              }
            ]
          : []),

        ...(hasContent()
          ? [
              {
                icon: "content_copy",
                label: t("messageContextMenu.copyMessage")!,
                onClick: () => copyToClipboard(props.message.content!)
              }
            ]
          : []),
        ...(props.message.htmlEmbed
          ? [
              {
                icon: "content_copy",
                label: t("messageContextMenu.copyHTML"),
                onClick: () =>
                  copyToClipboard(renderHtml(props.message.htmlEmbed!))
              }
            ]
          : []),

        ...(hasMessageId()
          ? [
              {
                icon: "content_copy",
                label: t("general.copyID")!,
                onClick: () => copyToClipboard(props.message.id!)
              }
            ]
          : [])
      ]}
    />
  );
}

const MessageReactHeader = (props: {
  addReaction: (shortcode: string) => void;
  openReactPicker: (event: MouseEvent) => void;
}) => {
  const { isMobileWidth, width } = useWindowProperties();
  const store = useStore();

  const emojiIcon = (shortcode: string) => {
    const customEmoji = store.servers.customEmojiNamesToEmoji()[shortcode];
    const unicode = emojiShortcodeToUnicode(shortcode);
    const icon =
      unicode ||
      (customEmoji &&
        `${customEmoji.id}.${customEmoji.gif ? (customEmoji.webp ? "webp#a" : "gif") : "webp"}`);
    return icon;
  };

  const iconSize = () => (isMobileWidth() ? 32 : 20);

  const emojiSlots = () => {
    if (!isMobileWidth()) {
      return 4;
    } else {
      const menuPadding = 2 * 7;
      const paddedIconSize = iconSize() + 2 * 6;
      const iconGap = 6;

      const remainingSpace = width() - menuPadding - paddedIconSize;
      return Math.max(
        Math.floor(remainingSpace / (paddedIconSize + iconGap)),
        0
      );
    }
  };

  let recentlyUsed: string[];
  try {
    recentlyUsed = JSON.parse(
      localStorage["nerimity-solid-emoji-pane"] || "[]"
    );
  } catch {
    recentlyUsed = [];
  }
  const defaultEmojis = ["+1", "heart", "100", "tada", "smile"];
  const dedupedEmojis = [...new Set([...recentlyUsed, ...defaultEmojis])];

  const suggestions = () => dedupedEmojis.slice(0, emojiSlots());

  return (
    <div class={styles.reactSuggestionList}>
      <For each={suggestions()}>
        {(shortcode, i) => (
          <div
            class={styles.reaction}
            onClick={() => props.addReaction(shortcode)}
          >
            <UiEmoji
              size={iconSize()}
              icon={emojiIcon(shortcode)}
              defaultPaused={true}
              hovered={false}
              resize={60}
            />
          </div>
        )}
      </For>
      <div
        class={cn(styles.reaction, styles.reactionPicker)}
        onClick={props.openReactPicker}
      >
        <Icon size={iconSize()} name="more_horiz" />
      </div>
    </div>
  );
};

const ViewReactionsModal = (props: { close: () => void; message: Message }) => {
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [reactedUsers, setReactedUsers] = createSignal<ReactedUser[]>([]);

  const selectedReaction = () => props.message.reactions[selectedIndex()]!;

  createEffect(
    on(selectedIndex, async () => {
      setReactedUsers([]);
      const reactedUsers = await fetchMessageReactedUsers({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: selectedReaction().name,
        emojiId: selectedReaction().emojiId,
        limit: 50
      });
      setReactedUsers(reactedUsers);
    })
  );

  return (
    <LegacyModal
      maxWidth={600}
      maxHeight={500}
      class={styles.viewReactionsModal}
      title="Reactions"
      icon="face"
      close={props.close}
    >
      <div class={styles.viewReactionsContainer}>
        <ReactionTabs
          message={props.message}
          onClick={setSelectedIndex}
          selectedIndex={selectedIndex()}
        />
        <ReactedUsersList reactedUsers={reactedUsers()} />
      </div>
    </LegacyModal>
  );
};

const ReactionTabs = (props: {
  message: Message;
  selectedIndex: number;
  onClick: (index: number) => void;
}) => {
  return (
    <div class={styles.reactionTabs}>
      <For each={props.message.reactions}>
        {(reaction, i) => (
          <ReactionItem
            onClick={() => props.onClick?.(i())}
            selected={i() === props.selectedIndex}
            reaction={reaction}
          />
        )}
      </For>
    </div>
  );
};

const ReactionItem = (props: {
  reaction: RawMessageReaction;
  selected: boolean;
  onClick?: () => void;
}) => {
  const { shouldAnimate } = useWindowProperties();
  const [hovered, setHovered] = createSignal(false);

  const name = () =>
    props.reaction.emojiId
      ? props.reaction.name
      : emojiUnicodeToShortcode(props.reaction.name);

  const shouldBeStatic = () => {
    const isGif = props.reaction.gif;
    const isAnimatedWebp = props.reaction.webp;

    if (!isAnimatedWebp && !isGif) {
      return false;
    }

    return !shouldAnimate(hovered());
  };

  const url = () => {
    if (!props.reaction.emojiId)
      return unicodeToTwemojiUrl(props.reaction.name);

    const e = props.reaction;
    const ext = e.gif && !e.webp ? "gif" : "webp";
    const url = new URL(
      `${env.NERIMITY_CDN}emojis/${props.reaction.emojiId}.${ext}`
    );
    url.searchParams.set("size", "60");
    if (shouldBeStatic()) {
      url.searchParams.set("type", "webp");
    }
    return url.href;
  };

  return (
    <ItemContainer
      class={styles.reactionItem}
      selected={props.selected}
      handlePosition="bottom"
      onClick={props.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Emoji
        class={styles.emoji}
        name={name()}
        url={url()}
        custom={!!props.reaction.emojiId}
        resize={60}
      />

      <div class={styles.name}>{name()}</div>
      <div class={styles.count}>{props.reaction.count}</div>
    </ItemContainer>
  );
};

const ReactedUsersList = (props: { reactedUsers: ReactedUser[] }) => {
  return (
    <div class={styles.reactedUsers}>
      <For each={props.reactedUsers}>
        {(user) => <ReactedUserItem reactedUser={user} />}
      </For>
    </div>
  );
};

const ReactedUserItem = (props: { reactedUser: ReactedUser }) => {
  return (
    <div class={styles.reactedUserItem}>
      <Avatar user={props.reactedUser.user} size={24} />
      <div class={styles.reactedUsername}>
        {props.reactedUser.user.username}
      </div>
      <div class={styles.reactedAt}>
        {formatTimestamp(props.reactedUser.reactedAt)}
      </div>
    </div>
  );
};

const SetReminderModal = (props: { close: () => void; message: Message }) => {
  const [date, setDate] = createSignal(new Date());
  const [error, setError] = createSignal<string | null>(null);
  let requestSent = false;

  const onSetReminderClick = async () => {
    if (requestSent) return;
    requestSent = true;
    setError(null);
    const close = props.close;

    await addReminder({
      timestamp: date().getTime(),
      messageId: props.message?.id
    })
      .then(() => close())
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        requestSent = false;
      });
  };
  return (
    <Modal.Root
      class={styles.datePickerOuterModal}
      close={props.close}
      desktopMaxWidth={284}
    >
      <Modal.Header title={t("markup.timestampModal.title")} />
      <Modal.Body class={styles.datePickerModal}>
        <DateTimePicker value={date()} onChange={setDate} />
        <Show when={error()}>
          <Text color="var(--alert-color)">{error()}</Text>
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("messageContextMenu.setReminder")}
          iconName="check"
          primary
          onClick={onSetReminderClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
};
