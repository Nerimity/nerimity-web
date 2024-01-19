import styles from "./styles.module.scss"
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { ServerEvents } from "@/chat-api/EventNames";
import { MessageType, RawMessage } from "@/chat-api/RawData";
import { addMessageReaction } from "@/chat-api/services/MessageService";
import socketClient from "@/chat-api/socketClient";
import { Message } from "@/chat-api/store/useMessages";
import useStore from "@/chat-api/store/useStore";
import { useScrollToMessageListener } from "@/common/GlobalEvents";
import { playMessageNotification } from "@/common/Sound";
import { createDesktopNotification } from "@/common/desktopNotification";
import env from "@/common/env";
import { useMutationObserver, useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu/ContextMenu";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { emojiShortcodeToUnicode } from "@/emoji";
import { useParams } from "solid-navigator";
import { For, Show, batch, createEffect, createMemo, createRenderEffect, createSignal, on, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import MessageItem, { DeleteMessageModal } from "../message-item/MessageItem";
import MemberContextMenu from "@/components/member-context-menu/MemberContextMenu";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import { copyToClipboard } from "@/common/clipboard";
import { t } from "i18next";
import { useDrawer } from "@/components/ui/drawer/Drawer";

export const MessageLogArea = (props: { mainPaneEl: HTMLDivElement, textAreaEl?: HTMLTextAreaElement }) => {
  let messageLogElement: undefined | HTMLDivElement;

  const {goToMain} = useDrawer();
  const { createPortal } = useCustomPortal();
  const params = useParams<{ channelId: string, serverId?: string }>();
  const { hasFocus } = useWindowProperties();
  const { channels, messages, account, channelProperties, servers } = useStore();
  const channelMessages = createMemo(() => messages.getMessagesByChannelId(params.channelId!));
  const [unreadMarker, setUnreadMarker] = createStore<{ lastSeenAt: number | null, messageId: string | null }>({ lastSeenAt: null, messageId: null });
  

  const [messageContextDetails, setMessageContextDetails] = createSignal<{ position: { x: number, y: number }, message: Message } | undefined>(undefined);
  const [userContextMenuDetails, setUserContextMenuDetails] = createSignal<{ position?: { x: number, y: number }, message?: Message } | undefined>({ position: undefined, message: undefined });

  const [areMessagesLoading, setAreMessagesLoading] = createSignal(false);
  const scrollTracker = createScrollTracker(props.mainPaneEl);

  const channel = () => channels.get(params.channelId!)!;

  const properties = () => channelProperties.get(params.channelId);

  const scrollToMessageListener = useScrollToMessageListener();
  const scrollPositionRetainer = useScrollPositionRetainer(() => props.mainPaneEl!, () => messageLogElement!);

  scrollToMessageListener(async (event) => {
    if (areMessagesLoading()) return;
    goToMain();
    setAreMessagesLoading(true);
    let messageEl = document.getElementById(`message-${event.messageId}`);
    if (!messageEl) {
      await messages.loadAroundAndStoreMessages(channel().id, event.messageId);
      messageEl = document.getElementById(`message-${event.messageId}`);
      setTimeout(() => {
        scrollTracker.setLoadMoreBottom(false);
        batch(() => {
          channelProperties.setMoreTopToLoad(params.channelId, true);
          channelProperties.setMoreBottomToLoad(params.channelId, true);
          scrollTracker.forceUpdate();
        })
      }, 300)
    };
    setTimeout(() => {
      messageEl?.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'center'
      })
    }, 500);
    setTimeout(() => {
      setAreMessagesLoading(false);
    }, 1200);
    if (!messageEl) return;
    messageEl.style.background = "var(--primary-color-dark)";
    setTimeout(() => {
      if (!messageEl) return;
      messageEl.style.background = "";
    }, 3000)
  })

  const { height } = useResizeObserver(() => messageLogElement);

  useMutationObserver(() => messageLogElement, () => {
    if (scrollTracker.scrolledBottom()) {
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
    }
  })

  createRenderEffect(on(height, () => {
    if (scrollTracker.scrolledBottom()) {
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
    }
  }))

  const updateUnreadMarker = (ignoreFocus = false) => {
    if (!ignoreFocus && hasFocus()) return;
    const lastSeenAt = channel().lastSeen || -1;
    const message = channelMessages()?.find(m => m.createdAt - lastSeenAt >= 0);
    setUnreadMarker({
      lastSeenAt,
      messageId: message?.id || null
    });
  }

  createRenderEffect(on(() => channelMessages()?.length, (length, prevLength) => {
    if (!length) return;
    updateUnreadMarker(prevLength === undefined);
    if (prevLength === undefined) return;
    dismissNotification();
  }))

  createEffect(on(hasFocus, () => {
    dismissNotification();
  }, { defer: true }))

  const dismissNotification = () => {
    if (!hasFocus()) return;
    if (!scrollTracker.scrolledBottom()) return;

    setTimeout(() => {
      channel()?.dismissNotification();
    }, 100);
  }


  const onMessageCreated = (payload: { socketId: string, message: RawMessage }) => {
    if (socketClient.id() === payload.socketId) return;

    if (payload.message.channelId !== params.channelId) return;

    if (!scrollTracker.scrolledBottom()) {
      if (payload.message.createdBy.id !== account.user()?.id) {
        if (!hasFocus()) return;
        playMessageNotification({
          message: payload.message,
          serverId: channel().serverId
        });
        createDesktopNotification(payload.message)
      }
    }
  }


  const { height: textAreaHeight } = useResizeObserver(() => props.textAreaEl?.parentElement?.parentElement);

  createEffect(on(textAreaHeight, () => {
    if (scrollTracker.scrolledBottom()) {
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
    }
  }))

  createEffect(on(() => channelMessages()?.length, () => {
    if (scrollTracker.scrolledBottom()) {
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
    }
  }))

  createEffect(on(channelMessages, (messages, prevMessages) => {
    if (prevMessages) return;

    const scrollPosition = () => {
      if (properties()?.isScrolledBottom === undefined) return props.mainPaneEl.scrollHeight;
      if (properties()?.isScrolledBottom) return props.mainPaneEl.scrollHeight;
      return properties()?.scrollTop!;
    }
    props.mainPaneEl.scrollTop = scrollPosition();
    scrollTracker.forceUpdate();

    setTimeout(() => {
      setAreMessagesLoading(false);
    }, 100);
  }))

  createEffect(on(scrollTracker.scrolledBottom, () => {
    dismissNotification();
    channelProperties.setScrolledBottom(params.channelId, scrollTracker.scrolledBottom());
  }));

  onMount(async () => {
    let authenticated = false;
    createEffect(on(account.isAuthenticated, async (isAuthenticated) => {
      if (!isAuthenticated) return;
      if (authenticated) return;
      authenticated = true;
      if (!channelMessages()) {
        channelProperties.setMoreTopToLoad(params.channelId, true);
        channelProperties.setMoreBottomToLoad(params.channelId, false);
      }

      await fetchMessages();

    }))

    const channelId = params.channelId;

    document.addEventListener("paste", onPaste)

    socketClient.socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated);
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", onPaste)
      scrollTracker.forceUpdate();
      batch(() => {
        channelProperties.setScrolledBottom(channelId, scrollTracker.scrolledBottom());
        channelProperties.setScrollTop(channelId, scrollTracker.scrollTop());
      })
      socketClient.socket.off(ServerEvents.MESSAGE_CREATED, onMessageCreated);
    })

  })

  const onPaste = (event: ClipboardEvent) => {
    const file = event.clipboardData?.files[0];
    if (!file) return;
    channelProperties.setAttachment(params.channelId, file);
  }

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
  }


  const fetchMessages = async () => {
    if (channelMessages()) return;
    await messages.fetchAndStoreMessages(params.channelId);
  }



  // Load more top when scrolled to the top
  createEffect(on([scrollTracker.loadMoreTop, areMessagesLoading], ([loadMoreTop, alreadyLoading]) => {
    if (!channelMessages()) return;
    if (channelMessages()?.length! < env.MESSAGE_LIMIT) return;
    if (!properties()?.moreTopToLoad) return;
    if (alreadyLoading) return;
    if (!loadMoreTop) return;
    setAreMessagesLoading(true);

    const beforeSet = () => {
      scrollPositionRetainer.save("first");
    }

    const afterSet = ({ hasMore }: { hasMore: boolean }) => {
      scrollPositionRetainer.load();
      channelProperties.setMoreBottomToLoad(params.channelId, true);
      channelProperties.setMoreTopToLoad(params.channelId, hasMore);
      scrollTracker.forceUpdate();
      setAreMessagesLoading(false);

    }
    messages.loadMoreTopAndStoreMessages(params.channelId, beforeSet, afterSet);
  }))

  // Load more bottom when scrolled to the bottom
  createEffect(on([scrollTracker.loadMoreBottom, areMessagesLoading], ([loadMoreBottom, alreadyLoading]) => {
    if (!channelMessages()) return;
    if (channelMessages()?.length! < env.MESSAGE_LIMIT) return;
    if (!properties()?.moreBottomToLoad) return;
    if (alreadyLoading) return;
    if (!loadMoreBottom) return;
    setAreMessagesLoading(true);

    const beforeSet = () => {
      scrollPositionRetainer.save("last");
    }

    const afterSet = ({ hasMore }: { hasMore: boolean }) => {
      scrollPositionRetainer.load();
      channelProperties.setMoreTopToLoad(params.channelId, true);
      channelProperties.setMoreBottomToLoad(params.channelId, hasMore);
      scrollTracker.forceUpdate();
      setAreMessagesLoading(false);
    }
    messages.loadMoreBottomAndStoreMessages(params.channelId, beforeSet, afterSet);
  }))

  const removeUnreadMarker = () => {
    updateUnreadMarker(true);
  }


  const onContextMenu = (event: MouseEvent, message: Message) => {
    event.preventDefault();
    setMessageContextDetails({
      message,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    })
  }
  const onUserContextMenu = (event: MouseEvent, message: Message) => {
    event.preventDefault();
    event.stopPropagation();
    setUserContextMenuDetails({
      message,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    })
  }

  const quoteMessage = (message: Message) => {
    if (!props.textAreaEl) return;
    props.textAreaEl!.focus();
    props.textAreaEl!.setRangeText(`[q:${message.id}]`, props.textAreaEl!.selectionStart, props.textAreaEl.selectionEnd, "end")
    channelProperties.updateContent(params.channelId, props.textAreaEl.value)
  }

  const addReaction = async (shortcode: string, message: Message) => {
    props.textAreaEl?.focus();
    const customEmoji = servers.customEmojiNamesToEmoji()[shortcode];
    await addMessageReaction({
      channelId: message.channelId,
      messageId: message.id,
      name: !customEmoji ? emojiShortcodeToUnicode(shortcode) : shortcode,
      emojiId: customEmoji?.id,
      gif: customEmoji?.gif
    })
  }

  const reactionPickerClick = (event: MouseEvent, message: Message) => {
    createPortal(close => (
      <FloatingEmojiPicker
        onClick={shortcode => addReaction(shortcode, message)}
        close={close}
        x={event.clientX}
        y={event.clientY}
      />
    ))
  }

  return (
    <div class={styles.messageLogArea} ref={messageLogElement}>
      <Show when={messageContextDetails()}>
        <MessageContextMenu
          {...messageContextDetails()!}
          quoteMessage={() => quoteMessage(messageContextDetails()?.message!)}
          onClose={() => setMessageContextDetails(undefined)}
        />
      </Show>
      <Show when={userContextMenuDetails()?.position}>
        <MemberContextMenu
          user={userContextMenuDetails()?.message?.createdBy}
          position={userContextMenuDetails()!.position}
          serverId={params.serverId}
          userId={userContextMenuDetails()?.message?.createdBy?.id!}
          onClose={() => setUserContextMenuDetails({ position: undefined, message: userContextMenuDetails()?.message })} />
      </Show>
      <For each={channelMessages()}>
        {(message, i) => (
          <>
            <Show when={unreadMarker.messageId === message.id}>
              <UnreadMarker onClick={removeUnreadMarker} />
            </Show>
            <MessageItem
              reactionPickerClick={event => reactionPickerClick(event, message)}
              quoteClick={() => quoteMessage(message)}
              contextMenu={(event) => onContextMenu(event, message)}
              userContextMenu={(event) => onUserContextMenu(event, message)}
              message={message}
              beforeMessage={message.type === MessageType.CONTENT ? channelMessages()?.[i() - 1] : undefined}
              messagePaneEl={props.mainPaneEl}
              textAreaEl={props.textAreaEl}
            />
          </>
        )}
      </For>
    </div>
  );
}

const useScrollPositionRetainer = (scrollElement:() => HTMLDivElement, logElement:() => HTMLDivElement) => {
  let el: HTMLDivElement | undefined;

  let beforeTop: undefined | number;

  const save = (trackFrom: "first" | "last") => {
    if (beforeTop) return;
    el = logElement()?.querySelector(".messageItem") as HTMLDivElement;

    if (trackFrom === "last") {
      el = logElement().lastElementChild as HTMLDivElement;
    }

    beforeTop = el.getBoundingClientRect().top;
  }
  const load = () => {
    if (!el) return;
    const afterTop = el.getBoundingClientRect().top;
    const difference = afterTop - beforeTop!;
    scrollElement().scrollTop = scrollElement().scrollTop + difference;
    beforeTop = undefined;
  }
  return { save, load };
}



function createScrollTracker(scrollElement: HTMLElement) {
  const [loadMoreTop, setLoadMoreTop] = createSignal(false);
  const [loadMoreBottom, setLoadMoreBottom] = createSignal(true);
  const [scrolledBottom, setScrolledBottom] = createSignal(true);
  const [scrollTop, setScrollTop] = createSignal(scrollElement.scrollTop);

  const LOAD_MORE_LENGTH = 300;
  const SCROLLED_BOTTOM_LENGTH = 20;


  const onScroll = () => {
    const scrollBottom = scrollElement.scrollHeight - (scrollElement.scrollTop + scrollElement.clientHeight);

    const isLoadMoreTop = scrollElement.scrollTop <= LOAD_MORE_LENGTH;
    const isLoadMoreBottom = scrollBottom <= LOAD_MORE_LENGTH;
    const isScrolledBottom = scrollBottom <= SCROLLED_BOTTOM_LENGTH

    if (loadMoreTop() !== isLoadMoreTop) setLoadMoreTop(isLoadMoreTop);
    if (loadMoreBottom() !== isLoadMoreBottom) setLoadMoreBottom(isLoadMoreBottom);
    if (scrolledBottom() !== isScrolledBottom) setScrolledBottom(isScrolledBottom);
    setScrollTop(scrollElement.scrollTop);
  }

  onMount(() => {
    scrollElement.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => scrollElement.removeEventListener("scroll", onScroll));
  })
  return { loadMoreTop, loadMoreBottom, scrolledBottom, scrollTop, forceUpdate: onScroll, setLoadMoreBottom }
}


function UnreadMarker(props: { onClick: () => void }) {
  return (
    <div onclick={props.onClick} class={styles.unreadMarkerContainer}>
      <div class={styles.unreadMarker}>
        <Icon name='mark_chat_unread' size={12} />
        New Messages
        <Button class={styles.closeButton} iconName='close' color='white' />
      </div>
    </div>
  )
}


type MessageContextMenuProps = Omit<ContextMenuProps, 'items'> & {
  message: Message
  quoteMessage(): void;
}


function MessageContextMenu(props: MessageContextMenuProps) {
  const params = useParams<{ serverId?: string; }>();
  const { createPortal } = useCustomPortal();
  const { account, serverMembers } = useStore();
  const onDeleteClick = () => {
    createPortal?.(close => <DeleteMessageModal close={close} message={props.message} />)
  }

  const onEditClick = () => {
    const { channelProperties } = useStore();
    channelProperties.setEditMessage(props.message.channelId, props.message);
  }

  const showEdit = () => account.user()?.id === props.message.createdBy.id && props.message.type === MessageType.CONTENT;

  const showDelete = () => {
    if (account.user()?.id === props.message.createdBy.id) return true;
    if (!params.serverId) return false;

    const member = serverMembers.get(params.serverId, account.user()?.id!);
    if (member?.amIServerCreator()) return true;
    return member?.hasPermission?.(ROLE_PERMISSIONS.MANAGE_CHANNELS);
  }

  const showQuote = () => props.message.type === MessageType.CONTENT;

  const hasContent = () => props.message.content;

  return (
    <ContextMenu triggerClassName='floatingShowMore' {...props} items={[
      ...(showQuote() ? [{ icon: 'format_quote', label: "Quote Message", onClick: props.quoteMessage }] : []),
      ...(showEdit() ? [{ icon: 'edit', label: t('messageContextMenu.editMessage')!, onClick: onEditClick }] : []),
      ...(showDelete() ? [{ icon: 'delete', label: t('messageContextMenu.deleteMessage')!, onClick: onDeleteClick, alert: true }] : []),
      ...(showEdit() || showDelete() || showQuote() ? [{ separator: true }] : []),
      ...(hasContent() ? [{ icon: 'copy', label: t('messageContextMenu.copyMessage')!, onClick: () => copyToClipboard(props.message.content!) }] : []),
      { icon: 'copy', label: t('messageContextMenu.copyId')!, onClick: () => copyToClipboard(props.message.id!) }
    ]} />
  )
}