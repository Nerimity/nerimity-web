import styles from './styles.module.scss';
import { createEffect, createMemo, createSignal, For, JSX, Match, on, onCleanup, onMount, Show, Switch} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useParams } from '@nerimity/solid-router';
import useStore from '../../chat-api/store/useStore';
import MessageItem from './message-item/MessageItem';
import Button from '@/components/ui/Button';
import { useWindowProperties } from '../../common/useWindowProperties';
import { MessageType, RawMessage } from '../../chat-api/RawData';
import socketClient from '../../chat-api/socketClient';
import { ServerEvents } from '../../chat-api/EventNames';
import Icon from '@/components/ui/icon/Icon';
import { postChannelTyping } from '@/chat-api/services/MessageService';
import { classNames } from '@/common/classNames';
import { emojiShortcodeToUnicode } from '@/emoji';
import env from '@/common/env';

export default function MessagePane(props: {mainPaneEl?: HTMLDivElement}) {
  const params = useParams();
  const {channels, header} = useStore();

  createEffect(() => {
    const channel = channels.get(params.channelId!);
    if (!channel) return;
    
    const userId = channel.recipient?.id;
    
    header.updateHeader({
      title: channel.name,
      serverId: params.serverId!,
      channelId: params.channelId!,
      userId: userId,
      iconName: params.serverId ? 'dns' : 'inbox',
    });

  })


  return (
    <div class={styles.messagePane}>
      <MessageLogArea mainPaneEl={props.mainPaneEl} />
      <MessageArea mainPaneEl={props.mainPaneEl} />
    </div>
  );
}

const saveScrollPosition = (scrollElement: HTMLDivElement, logElement: HTMLDivElement) => {

  const firstMessageEl = logElement?.querySelector(".messageItem") as HTMLDivElement;
  let beforeTop: undefined | number;

  const save = () => {
    beforeTop = firstMessageEl.getBoundingClientRect().top;
  }
  const load = () => {
    const afterTop = firstMessageEl.getBoundingClientRect().top;
    const difference = afterTop - beforeTop!;
    scrollElement.scrollTop = scrollElement.scrollTop + difference;
  }
  return {save, load};
}

const MessageLogArea = (props: {mainPaneEl?: HTMLDivElement}) => {
  let messageLogElement: undefined | HTMLDivElement;
  const params = useParams<{channelId: string}>();
  const {channels, messages, account, channelProperties} = useStore();

  const channelMessages = createMemo(() => messages.getMessagesByChannelId(params.channelId!));
  const [openedTimestamp, setOpenedTimestamp] = createSignal<null | number>(null);
  const [unreadMessageId, setUnreadMessageId] = createSignal<null | string>(null);
  const [unreadLastSeen, setUnreadLastSeen] = createSignal<null | number>(null);
  const [messagesLoading, setMessagesLoading] = createSignal(true);

  const channel = () => channels.get(params.channelId!)!;
  const {hasFocus} = useWindowProperties();
  const {loadMoreBottom, loadMoreTop, scrollTop, scrolledBottom, forceUpdateScroll} = createScrollTracker(props.mainPaneEl!);

  createEffect(on(channel, () => {
    setMessagesLoading(true);
    setOpenedTimestamp(null);
    if (!channel()) return;
    messages.fetchAndStoreMessages(channel().id).then(() => {
      setOpenedTimestamp(Date.now());
      channel()?.dismissNotification();
      const channelProperty = channelProperties.get(params.channelId);
      if (channelProperty?.isScrolledBottom === undefined || channelProperty?.isScrolledBottom) {
        props.mainPaneEl!.scrollTop = props.mainPaneEl!.scrollHeight;
      } else {
        props.mainPaneEl!.scrollTop = channelProperty?.scrollTop!;
      }
      forceUpdateScroll();
      setMessagesLoading(false);
    })
  }))
  
  createEffect(on(channelMessages, (messages) => {
    if (!messages) return;
    setUnreadMessageId(null);
    setUnreadLastSeen(null);
    updateLastReadIndex();

    const channelId = params.channelId;

    onCleanup(() => {
      channelProperties.setScrollTop(channelId, scrollTop())
      channelProperties.setScrolledBottom(channelId, scrolledBottom());
    })

  }))

  
  createEffect(on(hasFocus, () => {
    if (!hasFocus()) return;
    channel()?.dismissNotification();
  }, { defer: true }))
  
  const onMessage = (message: RawMessage) => {
    if (channelProperties.get(params.channelId)?.isScrolledBottom) {
      props.mainPaneEl!.scrollTop = props.mainPaneEl!.scrollHeight;
    }

    if (!channelMessages()) return;
    const selectedChannelId = params.channelId;
    const newMessageChannelId = message.channelId;
    if (selectedChannelId !== newMessageChannelId) return;
    if (message.createdBy.id === account.user()?.id) return;
    if (!hasFocus()) {
      const timestamp = channel().lastSeen!;
      if (timestamp !== unreadLastSeen()) {
        setUnreadMessageId(message.id);
        setUnreadLastSeen(timestamp);
      };
    }
    channel()?.dismissNotification();
  }

  onMount(() => {
    socketClient.socket.on(ServerEvents.MESSAGE_CREATED, onMessage);
    onCleanup(() => {
      socketClient.socket.off(ServerEvents.MESSAGE_CREATED, onMessage);
    })
  })
  

  const updateLastReadIndex = () => {
    if (!channel().hasNotifications) return;

    const lastRead = channel()?.lastSeen! || -1;
    if (lastRead === -1) {
      setUnreadMessageId(null);
      return;
    };
    
    const message = channelMessages()?.find(m => m.createdAt - lastRead >= 0 );
    setUnreadMessageId(message?.id || null);
  }

  createEffect(on([loadMoreTop, messagesLoading], () => {
    if (channelMessages()?.length! < env.MESSAGE_LIMIT) return;
    if (!loadMoreTop()) return;
    if (messagesLoading()) return;
    setMessagesLoading(true);
    const {save, load} = saveScrollPosition(props.mainPaneEl!, messageLogElement!)
    
    const beforeSet = () => {
      save();
    }

    const afterSet = ({hasMore}: {hasMore: boolean}) => {
      load();
      if (!hasMore) return;
      forceUpdateScroll();
      setMessagesLoading(false);
    }
    messages.loadMoreAndStoreMessages(params.channelId, beforeSet, afterSet);
  }));

  return <div class={styles.messageLogArea} ref={messageLogElement}>
    <For each={channelMessages()}>
      {(message, i) => (
        <>
          <Show when={unreadMessageId() === message.id}>
            <UnreadMarker/>
          </Show>
          <MessageItem
            animate={!!openedTimestamp() && message.createdAt > openedTimestamp()!}
            message={message}
            beforeMessage={ message.type === MessageType.CONTENT ? channelMessages()?.[i() - 1] : undefined}
          />
        </>
      )}
    </For>
  </div>
}

function createScrollTracker(scrollElement: HTMLElement) {
  const [loadMoreTop, setLoadMoreTop] = createSignal(false);
  const [loadMoreBottom, setLoadMoreBottom] = createSignal(true);
  const [scrolledBottom, setScrolledBottom] = createSignal(true);
  const [scrollTop, setScrollTop] = createSignal(scrollElement.scrollTop);

  const LOAD_MORE_LENGTH = 500;
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
    scrollElement.addEventListener("scroll", onScroll, {passive: true});
    onCleanup(() => scrollElement.removeEventListener("scroll", onScroll));
  })
  return { loadMoreTop, loadMoreBottom, scrolledBottom, scrollTop, forceUpdateScroll: onScroll }
}

function MessageArea(props: {mainPaneEl?: HTMLDivElement}) {
  const {channelProperties, account} = useStore();
  const params = useParams<{channelId: string}>();
  let textAreaEl: undefined | HTMLTextAreaElement;
  const {isMobileAgent} = useWindowProperties();

  const {channels, messages} = useStore();

  const setMessage = (content: string) => {
    channelProperties.updateContent(params.channelId, content)
  }

  const channelProperty = () => channelProperties.get(params.channelId);
  const message = () => channelProperty()?.content || '';
  const editMessageId = () => channelProperty()?.editMessageId;

  let typingTimeoutId: null | number = null;

  createEffect(() => {
    if (editMessageId()) {
      textAreaEl?.focus();
    }
  })

  createEffect(on(message, () => adjustHeight()));
  
  const cancelEdit = () => {
    channelProperties.setEditMessage(params.channelId, undefined);
    textAreaEl?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const myId = account.user()?.id;
    if (event.key === "Escape") {
      cancelEdit();
      return;
    }
    if(event.key === "ArrowUp") {
      if (message().trim().length) return;
      const msg = [...messages.get(params.channelId) || []].reverse()?.find(m => m.type === MessageType.CONTENT && m.createdBy.id === myId);
      if (msg) {
        channelProperties.setEditMessage(params.channelId, msg);
        event.preventDefault();
      }
      return;
    }
    if (event.key === "Enter" && !isMobileAgent()) {
      if (event.shiftKey) return;
      event.preventDefault();
      sendMessage(); 
    }
  }

  const sendMessage = () => {
    textAreaEl?.focus();
    const trimmedMessage = message().trim();
    setMessage('')
    if (!trimmedMessage) return;
    const channel = channels.get(params.channelId!)!;

    const formattedMessage = formatMessage(trimmedMessage);

    if (editMessageId()) {
      messages.editAndStoreMessage(params.channelId, editMessageId()!, formattedMessage);
      cancelEdit();
    } else {
      messages.sendAndStoreMessage(channel.id, formattedMessage);
      props.mainPaneEl!.scrollTop = props.mainPaneEl!.scrollHeight;
    }
    typingTimeoutId && clearTimeout(typingTimeoutId)
    typingTimeoutId = null;
  }

  const adjustHeight = () => {
    let MAX_HEIGHT = 100;
    textAreaEl!.style.height = '0px';
    let newHeight = (textAreaEl!.scrollHeight - 19);
    if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;
    textAreaEl!.style.height = newHeight + "px";
    textAreaEl!.scrollTop = textAreaEl!.scrollHeight;
  }
  
  const onInput = (event: any) => {
    adjustHeight();
    setMessage(event.target?.value);
    if (typingTimeoutId) return;
    postChannelTyping(params.channelId);
    typingTimeoutId = window.setTimeout(() => {
      typingTimeoutId = null;
    }, 4000)
  }

  return <div class={styles.messageArea}>
    <Show when={editMessageId()}><Button iconName='close' color='var(--alert-color)' onClick={cancelEdit} class={styles.button}/></Show>
    <div class={styles.textareaContainer}>
      <TypingIndicator/>
      <Show when={editMessageId()}><EditIndicator messageId={editMessageId()!}/></Show>
      <textarea ref={textAreaEl} placeholder='Message' class={styles.textArea} onkeydown={onKeyDown} onInput={onInput} value={message()}></textarea>
    </div>
    <Button iconName={editMessageId() ? 'edit' : 'send'} onClick={sendMessage} class={styles.button}/>
  </div>
}

function UnreadMarker() {
  return (
    <div class={styles.unreadMarkerContainer}>
      <div class={styles.unreadMarker}>
        <Icon name='mark_chat_unread' class={styles.icon} size={12} />
        New Messages
      </div>
    </div>
  )
}

interface TypingPayload {
  userId: string;
  channelId: string;
}
function TypingIndicator() {
  const params = useParams<{channelId: string}>();
  const {users} = useStore();

  const [typingUserIds, setTypingUserIds] = createStore<Record<string, number | undefined>>({})

  const onTyping = (event: TypingPayload) => {
    if (event.channelId !== params.channelId) return;
    if (typingUserIds[event.userId]) {
      clearTimeout(typingUserIds[event.userId]);
    }
    const timeoutId = window.setTimeout(() => setTypingUserIds(event.userId, undefined), 5000);
    setTypingUserIds(event.userId, timeoutId);
  }

  const onMessageCreated = (event: RawMessage) => {
    if (event.channelId !== params.channelId) return;
    const timeoutId = typingUserIds[event.createdBy.id];
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTypingUserIds(event.createdBy.id, undefined);
    }
  }

  const onMessageUpdated = (evt: any) => onMessageCreated(evt.updated)

  createEffect(on(() => params.channelId, () => {
    Object.values(typingUserIds).forEach(timeoutId => 
      clearTimeout(timeoutId)
    )
    setTypingUserIds(reconcile({}));
  }))

  onMount(() => {
    socketClient.socket.on(ServerEvents.CHANNEL_TYPING, onTyping)
    socketClient.socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated)
    socketClient.socket.on(ServerEvents.MESSAGE_UPDATED, onMessageUpdated)
    
    onCleanup(() => {
      socketClient.socket.off(ServerEvents.CHANNEL_TYPING, onTyping)
      socketClient.socket.off(ServerEvents.MESSAGE_CREATED, onMessageCreated)
      socketClient.socket.off(ServerEvents.MESSAGE_UPDATED, onMessageUpdated)
    })
  })

  const typingUsers = createMemo(() => Object.keys(typingUserIds).map(userId => 
    users.get(userId)
  ))



  return (
    <Show when={typingUsers().length}>
      <Floating>
        <Switch>
          <Match when={typingUsers().length === 1}>
            <b>{typingUsers()[0]?.username}</b> is typing...
          </Match>
          <Match when={typingUsers().length === 2}>
            <b>{typingUsers()[0]?.username}</b> and <b>{typingUsers()[1]?.username}</b> are typing...
          </Match>
          <Match when={typingUsers().length === 3}>
            <b>{typingUsers()[0]?.username}</b>, <b>{typingUsers()[1]?.username}</b> and <b>{typingUsers()[2]?.username}</b> are typing...
          </Match>
          <Match when={typingUsers().length > 3}>
            <b>{typingUsers()[0]?.username}</b>, <b>{typingUsers()[1]?.username}</b>,  <b>{typingUsers()[2]?.username}</b> and <b>{typingUsers().length - 3}</b> others are typing...
          </Match>
        </Switch>
      </Floating>
    </Show>
  )
}

function EditIndicator(props: {messageId: string}) {
  const params = useParams<{channelId: string}>();
  const {messages, channelProperties} = useStore();

  const message = () => messages.get(params.channelId)?.find(m => m.id === props.messageId);

  createEffect(() => {    
    if (!message()) {
      channelProperties.setEditMessage(params.channelId, undefined);
    }
  })



  return (
    <Floating class={styles.editIndicator}>
      <Icon name='edit' size={17} color='var(--primary-color)' class={styles.editIcon} />
      <div class={styles.message}>{message()?.content}</div>
    </Floating>
  )
}

function Floating (props: {class?: string, children: JSX.Element}) {
  let floatingEl: undefined | HTMLDivElement;

  const readjust = () => {
    if (!floatingEl) return;
    const height = floatingEl?.clientHeight;
    floatingEl.style.top = (-height + 5) + 'px';
  }

  
  onMount(() => {
    const observer = new ResizeObserver(readjust)
    observer.observe(floatingEl!);
    onCleanup(() => {
      observer.disconnect()
    })
  })


  return (
    <div ref={floatingEl} class={classNames(styles.floating, props.class)}>
      {props.children}
    </div>
  )
}

function formatMessage (message: string) {
  const regex = /:([\w]+):/g;

  return message.replace(regex, val => {
    const emojiName = val.substring(1, val.length - 1);
    return emojiShortcodeToUnicode(emojiName) || val;
  })
}