import styles from "./styles.module.scss";
import { CHANNEL_PERMISSIONS, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ServerEvents } from "@/chat-api/EventNames";
import {
  MessageType,
  RawMessage,
  RawMessageReaction,
  RawUser
} from "@/chat-api/RawData";
import {
  ReactedUser,
  addMessageReaction,
  fetchMessageReactedUsers,
  markMessageUnread,
  pinMessage,
  unpinMessage
} from "@/chat-api/services/MessageService";
import socketClient from "@/chat-api/socketClient";
import { Message, MessageSentStatus } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import {
  emitScrollToMessage,
  useScrollToMessageListener
} from "@/common/GlobalEvents";
import { playMessageNotification } from "@/common/Sound";
import { createDesktopNotification } from "@/common/desktopNotification";
import env from "@/common/env";
import {
  useMutationObserver,
  useResizeObserver
} from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import ContextMenu, {
  ContextMenuProps
} from "@/components/ui/context-menu/ContextMenu";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import {
  emojiShortcodeToUnicode,
  emojiUnicodeToShortcode,
  unicodeToTwemojiUrl
} from "@/emoji";
import { useParams, useSearchParams } from "solid-navigator";
import {
  For,
  Show,
  batch,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  lazy,
  on,
  onCleanup,
  onMount
} from "solid-js";
import { createStore } from "solid-js/store";
import MessageItem from "../message-item/MessageItem";
import MemberContextMenu from "@/components/member-context-menu/MemberContextMenu";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { copyToClipboard } from "@/common/clipboard";
import { t } from "@nerimity/i18lite";
import { useDrawer } from "@/components/ui/drawer/Drawer";
import { fileToDataUrl } from "@/common/fileToDataUrl";
import { PhotoEditor } from "@/components/ui/photo-editor/PhotoEditor";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { FlexRow } from "@/components/ui/Flexbox";
import { Emoji as UiEmoji } from "@/components/ui/Emoji";
import { Emoji } from "@/components/markup/Emoji";
import ItemContainer from "@/components/ui/LegacyItem";
import Avatar from "@/components/ui/Avatar";
import { formatTimestamp } from "@/common/date";
import { CreateTicketModal } from "@/components/CreateTicketModal";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { pushMessageNotification } from "@/components/in-app-notification-previews/useInAppNotificationPreviews";
import { fetchTranslation } from "@/common/GoogleTranslate";
import { messagesPreloader } from "@/common/createPreloader";
import { unzipJson } from "@/common/zip";
import { rightDrawerMode } from "@/common/localStorage";
import { cn } from "@/common/classNames";
import { addToHistory } from "@nerimity/solid-emoji-picker";

const DeleteMessageModal = lazy(
  () => import("../message-delete-modal/MessageDeleteModal")
);
const PinConfirmModal = lazy(
  () => import("../pin-confirm-modal/PinConfirmModal")
);

export const MessageLogArea = (props: {
  mainPaneEl: HTMLDivElement;
  textAreaEl?: HTMLTextAreaElement;
}) => {
  const [searchParams, setSearchParams] = useSearchParams<{
    messageId?: string;
  }>();

  const [getRightDrawerMode] = rightDrawerMode;

  let messageLogElement: undefined | HTMLDivElement;

  const [topSkeletonRef, setTopSkeletonRef] = createSignal<HTMLDivElement>();
  const [bottomSkeletonRef, setBottomSkeletonRef] =
    createSignal<HTMLDivElement>();

  const { height: topSkeletonHeight } = useResizeObserver(topSkeletonRef);
  const { height: bottomSkeletonHeight } = useResizeObserver(bottomSkeletonRef);

  const drawer = useDrawer();
  const { createPortal } = useCustomPortal();
  const params = useParams<{ channelId: string; serverId?: string }>();
  const { hasFocus } = useWindowProperties();
  const { channels, messages, account, channelProperties, servers } =
    useStore();
  const channelMessages = createMemo(() =>
    messages.getMessagesByChannelId(params.channelId!)
  );
  const [unreadMarker, setUnreadMarker] = createStore<{
    lastSeenAt: number | null;
    messageId: string | null;
  }>({ lastSeenAt: null, messageId: null });

  const [messageContextDetails, setMessageContextDetails] = createSignal<
    | {
        position: { x: number; y: number };
        message: Message;
        clickEvent: MouseEvent;
      }
    | undefined
  >(undefined);
  const [userContextMenuDetails, setUserContextMenuDetails] = createSignal<
    { position?: { x: number; y: number }; message?: Message } | undefined
  >({ position: undefined, message: undefined });

  const [areMessagesLoading, setAreMessagesLoading] = createSignal(false);
  const scrollTracker = createScrollTracker(
    props.mainPaneEl,
    topSkeletonHeight,
    bottomSkeletonHeight
  );

  const channel = createMemo(() => channels.get(params.channelId!));

  const properties = () => channelProperties.get(params.channelId);

  const scrollToMessageListener = useScrollToMessageListener();
  const scrollPositionRetainer = useScrollPositionRetainer(
    () => props.mainPaneEl!,
    () => messageLogElement!
  );

  const isStale = () => properties()?.stale;

  createEffect(
    on([isStale, account.isAuthenticated], async () => {
      if (!isStale()) return;
      if (!account.isAuthenticated()) return;

      if (!properties()?.moreBottomToLoad) {
        setAreMessagesLoading(true);
        await messages
          .fetchAndStoreMessages(params.channelId, true)
          .catch(() => {});
        updateUnreadMarker(true);
        setAreMessagesLoading(false);
        channelProperties.updateStale(params.channelId, false);
      }
    })
  );

  scrollToMessageListener(async (event) => {
    if (areMessagesLoading()) return;
    drawer?.goToMain();
    setAreMessagesLoading(true);
    let messageEl = messageLogElement?.querySelector(
      `#message-${event.messageId}`
    ) as HTMLDivElement;
    if (!messageEl) {
      await messages.loadAroundAndStoreMessages(channel().id, event.messageId);

      messageEl = messageLogElement?.querySelector(
        `#message-${event.messageId}`
      ) as HTMLDivElement;
      setTimeout(() => {
        scrollTracker.setLoadMoreBottom(false);
        batch(() => {
          channelProperties.setMoreTopToLoad(params.channelId, true);
          channelProperties.setMoreBottomToLoad(params.channelId, true);
          scrollTracker.forceUpdate();
        });

        if (searchParams.messageId) {
          setSearchParams({ messageId: undefined }, { replace: true });
        }
      }, 300);
    }
    setTimeout(() => {
      messageEl?.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "center"
      });
    }, 500);
    setTimeout(() => {
      setAreMessagesLoading(false);
    }, 1200);
    if (!messageEl) return;
    messageEl.style.background = "var(--primary-color-dark)";
    setTimeout(() => {
      if (!messageEl) return;
      messageEl.style.background = "";
    }, 3000);
  });

  const { height } = useResizeObserver(() => messageLogElement);

  useMutationObserver(
    () => messageLogElement,
    (mutations) => {
      if (scrollTracker.scrolledBottom()) {
        const floatingOptionsHovered = mutations.find((e) => {
          if (e.type !== "childList") return;
          const addedFloating = [...e.addedNodes].find(
            (e) => e instanceof HTMLElement && e.closest(".floatOptions")
          );
          const removedFloating = [...e.removedNodes].find(
            (e) => e instanceof HTMLElement && e.closest(".floatOptions")
          );
          return addedFloating || removedFloating;
        });
        if (floatingOptionsHovered) return;
        props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
      }
    }
  );

  const onWindowResize = () => {
    if (scrollTracker.scrolledBottom()) {
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
    }
  };

  createRenderEffect(
    on(height, () => {
      if (scrollTracker.scrolledBottom()) {
        props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
      }
    })
  );

  const updateUnreadMarker = (ignoreFocus = false) => {
    if (!ignoreFocus && hasFocus()) return;
    const lastSeenAt = channel()?.lastSeen || -1;
    const message = channelMessages()?.find(
      (m) => m.createdAt - lastSeenAt >= 0
    );
    setUnreadMarker({
      lastSeenAt,
      messageId: message?.id || null
    });
  };

  createRenderEffect(
    on(
      [() => channelMessages()?.length, () => channel()?.lastSeen],
      (now, prev) => {
        if (!prev) return;
        const [prevMessageLength, prevLastSeen] = prev;
        const [nowMessageLength, nowLastSeen] = now;
        if (prevMessageLength !== nowMessageLength) return;
        if (!nowLastSeen) return;
        if (!prevLastSeen) return;
        if (nowLastSeen >= prevLastSeen) return;
        updateUnreadMarker(true);
      }
    )
  );
  createRenderEffect(
    on(
      () => channelMessages()?.length,
      (length, prevLength) => {
        if (!length) return;
        updateUnreadMarker(prevLength === undefined);
        if (prevLength === undefined) return;
        dismissNotification();
      }
    )
  );

  createEffect(
    on(
      hasFocus,
      () => {
        dismissNotification();
      },
      { defer: true }
    )
  );

  const dismissNotification = () => {
    if (!hasFocus()) return;
    if (!scrollTracker.scrolledBottom()) return;

    setTimeout(() => {
      channel()?.dismissNotification();
    }, 100);
  };

  const onMessageCreated = (payload: {
    socketId: string;
    message: RawMessage;
  }) => {
    if (socketClient.id() === payload.socketId) return;

    if (payload.message.channelId !== params.channelId) return;

    if (!scrollTracker.scrolledBottom()) {
      if (payload.message.createdBy.id !== account.user()?.id) {
        if (!hasFocus()) return;
        playMessageNotification({
          message: payload.message,
          serverId: channel().serverId
        });
        createDesktopNotification(payload.message);
        pushMessageNotification(payload.message);
      }
    }
  };
  // const onMessageDeleted = (payload: { channelId: string, messageId: string }) => {
  //   // if (payload.channelId !== params.channelId) return;

  //   // setAreMessagesLoading(true);

  //   messages.locallyRemoveMessagesBatch(params.channelId, 40);
  //   channelProperties.setMoreTopToLoad(params.channelId, true);
  //   channelProperties.setMoreBottomToLoad(params.channelId, true);
  // };

  // setTimeout(() => {
  //   onMessageDeleted();
  // }, 5000);

  const { height: textAreaHeight } = useResizeObserver(
    () => props.textAreaEl?.parentElement?.parentElement
  );

  createEffect(
    on(textAreaHeight, () => {
      if (scrollTracker.scrolledBottom()) {
        props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
      }
    })
  );

  createEffect(
    on(
      () => channelMessages()?.length,
      () => {
        if (scrollTracker.scrolledBottom()) {
          props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
        }
      }
    )
  );

  createEffect(
    on(channelMessages, (messages, prevMessages) => {
      if (prevMessages) return;

      const scrollPosition = () => {
        if (properties()?.isScrolledBottom === undefined)
          return props.mainPaneEl.scrollHeight;
        if (properties()?.isScrolledBottom)
          return props.mainPaneEl.scrollHeight;
        return properties()?.scrollTop!;
      };
      props.mainPaneEl.scrollTop = scrollPosition();
      scrollTracker.forceUpdate();

      setTimeout(() => {
        if (searchParams.messageId) return;
        setAreMessagesLoading(false);
      }, 100);
    })
  );

  createEffect(
    on(scrollTracker.scrolledBottom, () => {
      dismissNotification();
      channelProperties.setScrolledBottom(
        params.channelId,
        scrollTracker.scrolledBottom()
      );
    })
  );

  createEffect(
    on(
      () => searchParams.messageId,
      () => {
        if (searchParams.messageId) {
          setTimeout(() => {
            emitScrollToMessage({ messageId: searchParams.messageId! });
            setSearchParams({ messageId: undefined }, { replace: true });
          }, 100);
          return;
        }
      },
      { defer: true }
    )
  );

  onMount(async () => {
    let authenticated = false;
    createEffect(
      on(account.isAuthenticated, async (isAuthenticated) => {
        if (!isAuthenticated) return;
        if (authenticated) return;
        authenticated = true;

        if (!channelMessages()) {
          channelProperties.setMoreTopToLoad(params.channelId, true);
          channelProperties.setMoreBottomToLoad(params.channelId, false);
        }

        if (searchParams.messageId) {
          setTimeout(() => {
            emitScrollToMessage({ messageId: searchParams.messageId! });
          }, 100);
          return;
        }

        await fetchMessages();
      })
    );

    const channelId = params.channelId;

    window.addEventListener("resize", onWindowResize);
    document.addEventListener("paste", onPaste);

    socketClient.socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated);
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", onPaste);
      scrollTracker.forceUpdate();
      batch(() => {
        channelProperties.setScrolledBottom(
          channelId,
          scrollTracker.scrolledBottom()
        );
        channelProperties.setScrollTop(channelId, scrollTracker.scrollTop());
      });
      socketClient.socket.off(ServerEvents.MESSAGE_CREATED, onMessageCreated);
    });
  });

  const onPaste = async (event: ClipboardEvent) => {
    const file = event.clipboardData?.files[0];
    if (!file) return;
    channelProperties.setAttachment(params.channelId, file);
  };

  // key binds
  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      // scroll to bottom
      if (properties()?.moreBottomToLoad) {
        await messages.fetchAndStoreMessages(params.channelId, true);
      }
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
      updateUnreadMarker(true);
    }
  };

  const fetchMessages = async () => {
    if (channelMessages()) return;
    await messagesPreloader.run(params.channelId);
    // await messages.fetchAndStoreMessages(params.channelId);
  };

  // Load more top when scrolled to the top
  createEffect(
    on(
      [scrollTracker.loadMoreTop, areMessagesLoading],
      ([loadMoreTop, alreadyLoading]) => {
        if (!channelMessages()) return;
        if (channelMessages()?.length! === 0) return;
        if (!properties()?.moreTopToLoad) return;
        if (alreadyLoading) return;
        if (!loadMoreTop) return;
        setAreMessagesLoading(true);

        const beforeSet = () => {
          scrollPositionRetainer.save("first");
        };

        const afterSet = ({
          hasMore,
          data
        }: {
          hasMore: boolean;
          data: RawMessage[];
        }) => {
          if (!data.length) {
            batch(() => {
              scrollPositionRetainer.load();
              channelProperties.setMoreTopToLoad(params.channelId, false);
              scrollTracker.forceUpdate();
              setAreMessagesLoading(false);
            });
            return;
          }
          scrollPositionRetainer.load();
          channelProperties.setMoreBottomToLoad(
            params.channelId,
            channelMessages()?.length! >= env.MESSAGE_LIMIT
          );
          channelProperties.setMoreTopToLoad(params.channelId, hasMore);
          scrollTracker.forceUpdate();
          setAreMessagesLoading(false);
        };
        messages.loadMoreTopAndStoreMessages(
          params.channelId,
          beforeSet,
          afterSet
        );
      }
    )
  );

  // Load more bottom when scrolled to the bottom
  createEffect(
    on(
      [scrollTracker.loadMoreBottom, areMessagesLoading],
      ([loadMoreBottom, alreadyLoading]) => {
        if (!channelMessages()) return;
        if (channelMessages()?.length! === 0) return;
        if (!properties()?.moreBottomToLoad) return;
        if (alreadyLoading) return;
        if (!loadMoreBottom) return;
        setAreMessagesLoading(true);

        const beforeSet = () => {
          scrollPositionRetainer.save("last");
        };

        const afterSet = ({ hasMore }: { hasMore: boolean }) => {
          scrollPositionRetainer.load();
          channelProperties.setMoreTopToLoad(
            params.channelId,
            channelMessages()?.length! >= env.MESSAGE_LIMIT
          );
          channelProperties.setMoreBottomToLoad(params.channelId, hasMore);
          scrollTracker.forceUpdate();
          setAreMessagesLoading(false);
        };
        messages.loadMoreBottomAndStoreMessages(
          params.channelId,
          beforeSet,
          afterSet
        );
      }
    )
  );

  const removeUnreadMarker = () => {
    updateUnreadMarker(true);
  };

  const onContextMenu = (event: MouseEvent, message: Message) => {
    event.preventDefault();
    setMessageContextDetails({
      message,
      clickEvent: event,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    });
  };
  const onUserContextMenu = (event: MouseEvent, message: Message) => {
    event.preventDefault();
    event.stopPropagation();
    if (message.webhookId) return;
    setUserContextMenuDetails({
      message,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    });
  };

  const quoteMessage = (message: Message) => {
    if (!props.textAreaEl) return;
    props.textAreaEl!.focus();
    props.textAreaEl!.setRangeText(
      `[q:${message.id}]`,
      props.textAreaEl!.selectionStart,
      props.textAreaEl.selectionEnd,
      "end"
    );
    channelProperties.updateContent(params.channelId, props.textAreaEl.value);
  };

  const replyMessage = (message: Message) => {
    if (!props.textAreaEl) return;
    props.textAreaEl!.focus();
    channelProperties.addReply(params.channelId, message);
  };

  const addReaction = async (shortcode: string, message: Message) => {
    props.textAreaEl?.focus();
    const customEmoji = servers.customEmojiNamesToEmoji()[shortcode];
    const name = !customEmoji ? emojiShortcodeToUnicode(shortcode) : shortcode;

    addToHistory(shortcode, 20);
    await addMessageReaction({
      channelId: message.channelId,
      messageId: message.id,
      name: name!,
      emojiId: customEmoji?.id,
      gif: customEmoji?.gif,
      webp: customEmoji?.webp
    });
  };

  const reactionPickerClick = (event: MouseEvent, message: Message) => {
    createPortal((close) => (
      <FloatingEmojiPicker
        onClick={(shortcode) => addReaction(shortcode, message)}
        close={close}
        x={event.clientX}
        y={event.clientY}
      />
    ));
  };

  const [translateMessageIds, setTranslateMessageIds] = createSignal<string[]>(
    []
  );
  const translateMessage = async () => {
    const messageId = messageContextDetails()?.message.id;
    if (translateMessageIds().includes(messageId!)) return;
    setTranslateMessageIds([...translateMessageIds(), messageId!]);
  };

  return (
    <div class={styles.messageLogArea} ref={messageLogElement}>
      <Show when={messageContextDetails()}>
        <MessageContextMenu
          {...messageContextDetails()!}
          replyMessage={() => replyMessage(messageContextDetails()?.message!)}
          quoteMessage={() => quoteMessage(messageContextDetails()?.message!)}
          translateMessage={translateMessage}
          addReaction={(shortcode: string, message: Message) =>
            addReaction(shortcode, message)
          }
          onClose={() => setMessageContextDetails(undefined)}
        />
      </Show>
      <Show when={userContextMenuDetails()?.position}>
        <MemberContextMenu
          user={userContextMenuDetails()?.message?.createdBy}
          position={userContextMenuDetails()!.position}
          serverId={params.serverId}
          userId={userContextMenuDetails()?.message?.createdBy?.id!}
          onClose={() =>
            setUserContextMenuDetails({
              position: undefined,
              message: userContextMenuDetails()?.message
            })
          }
        />
      </Show>
      <Show when={channelMessages()?.length === 0}>
        <div class={styles.noMessages}>
          <Icon name="comment" size={40} color="var(--primary-color)" />
          <div>
            <div class={styles.noMessagesTitle}>
              {t("messageView.noMessages")}
            </div>
            <div class={styles.noMessagesText}>
              {t("messageView.noMessagesDescription")}
            </div>
          </div>
        </div>
      </Show>

      <Show
        when={
          properties()?.moreTopToLoad &&
          (!channelMessages() ||
            channelMessages()?.length! >= env.MESSAGE_LIMIT)
        }
      >
        <div ref={setTopSkeletonRef}>
          <Skeleton.List count={20} class={styles.skeletonList}>
            <MessageSkeleton />
          </Skeleton.List>
        </div>
      </Show>

      <For each={channelMessages()}>
        {(message, i) => (
          <>
            <Show when={unreadMarker.messageId === message.id}>
              <UnreadMarker onClick={removeUnreadMarker} />
            </Show>
            <MessageItem
              allowSwipeActions={getRightDrawerMode() === "HEADER_CLICK"}
              showNewDayMarker
              isEditing={
                message.id === properties()?.editMessageId ||
                properties()?.replyToMessages.includes(message)
              }
              translateMessage={translateMessageIds().includes(message.id!)}
              reactionPickerClick={(event) =>
                reactionPickerClick(event, message)
              }
              quoteClick={() => quoteMessage(message)}
              contextMenu={(event) => onContextMenu(event, message)}
              userContextMenu={(event) => onUserContextMenu(event, message)}
              message={message}
              beforeMessage={channelMessages()?.[i() - 1]}
              messagePaneEl={props.mainPaneEl}
              textAreaEl={props.textAreaEl}
            />
          </>
        )}
      </For>
      <Show when={properties()?.moreBottomToLoad}>
        <div ref={setBottomSkeletonRef}>
          <Skeleton.List count={20} class={styles.skeletonList}>
            <MessageSkeleton />
          </Skeleton.List>
        </div>
      </Show>
    </div>
  );
};

const MessageSkeleton = () => {
  return (
    <div class={styles.base}>
      <Skeleton.Item width="42px" height="42px" class={styles.avatar} />
      <div class={styles.content}>
        <Skeleton.Item
          width={`${generateRandom(10, 30)}%`}
          height="18px"
          class={styles.username}
        />
        <Skeleton.Item
          width={`${generateRandom(10, 100)}%`}
          height="18px"
          class={styles.text}
        />
      </div>
    </div>
  );
};

const useScrollPositionRetainer = (
  scrollElement: () => HTMLDivElement,
  logElement: () => HTMLDivElement
) => {
  let el: HTMLDivElement | undefined;

  let beforeBottom: undefined | number;

  const save = (trackFrom: "first" | "last") => {
    if (beforeBottom) return;
    el = logElement()?.querySelector(".messageItem") as HTMLDivElement;

    if (trackFrom === "last") {
      const messageItemEls = logElement().querySelectorAll(".messageItem");

      el = messageItemEls[messageItemEls.length - 1] as HTMLDivElement;
    }

    const rect = el.getBoundingClientRect();

    beforeBottom = rect.bottom;
  };
  const load = () => {
    if (!el) return;
    const afterBottom = el.getBoundingClientRect().bottom;
    const difference = afterBottom - beforeBottom!;
    scrollElement().scrollTop = scrollElement().scrollTop + difference;
    beforeBottom = undefined;
  };
  return { save, load };
};

function createScrollTracker(
  scrollElement: HTMLElement,
  topSkeletonHeight: () => number,
  bottomSkeletonHeight: () => number
) {
  const [loadMoreTop, setLoadMoreTop] = createSignal(false);
  const [loadMoreBottom, setLoadMoreBottom] = createSignal(true);
  const [scrolledBottom, setScrolledBottom] = createSignal(true);
  const [scrollTop, setScrollTop] = createSignal(scrollElement.scrollTop);

  const SCROLLED_BOTTOM_LENGTH = () => bottomSkeletonHeight() || 20;

  const onScroll = () => {
    const scrollBottom =
      scrollElement.scrollHeight -
      (scrollElement.scrollTop + scrollElement.clientHeight);

    const isLoadMoreTop = scrollElement.scrollTop <= topSkeletonHeight();
    const isLoadMoreBottom = scrollBottom <= bottomSkeletonHeight();
    const isScrolledBottom = scrollBottom <= SCROLLED_BOTTOM_LENGTH();

    if (loadMoreTop() !== isLoadMoreTop) setLoadMoreTop(isLoadMoreTop);
    if (loadMoreBottom() !== isLoadMoreBottom)
      setLoadMoreBottom(isLoadMoreBottom);
    if (scrolledBottom() !== isScrolledBottom)
      setScrolledBottom(isScrolledBottom);
    setScrollTop(scrollElement.scrollTop);
  };

  onMount(() => {
    scrollElement.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => scrollElement.removeEventListener("scroll", onScroll));
  });
  return {
    loadMoreTop,
    loadMoreBottom,
    scrolledBottom,
    scrollTop,
    forceUpdate: onScroll,
    setLoadMoreBottom
  };
}

function UnreadMarker(props: { onClick: () => void }) {
  return (
    <div onClick={props.onClick} class={styles.unreadMarkerContainer}>
      <div class={styles.unreadMarker}>
        <Icon name="mark_chat_unread" size={14} />
        {t("messageView.newMessages")}
        <Button
          iconSize={14}
          class={styles.closeButton}
          iconName="close"
          color="white"
        />
      </div>
    </div>
  );
}

type MessageContextMenuProps = Omit<ContextMenuProps, "items"> & {
  message: Message;
  clickEvent: MouseEvent;
  quoteMessage(): void;
  replyMessage(): void;
  translateMessage?(): void;
  addReaction(shortcode: string, message: Message): void;
};

function MessageContextMenu(props: MessageContextMenuProps) {
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
                  copyToClipboard(
                    renderHtml(unzipJson(props.message.htmlEmbed!))
                  )
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
      const menuPadding = 2 * 7; // total menu padding from fullwidth context menu
      const paddedIconSize = iconSize() + 2 * 6; // horizontal button padding
      const iconGap = 6;

      // usable space left after removing menu padding & the picker button
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
    recentlyUsed = []; // ignore invalid data
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

const generateRandom = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min);
};
