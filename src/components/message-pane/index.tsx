import styles from './styles.module.scss';

import { createEffect, createMemo, createSignal, For, JSX, Match, on, onCleanup, onMount, Show, Switch} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useParams } from 'solid-named-router';
import useStore from '../../chat-api/store/useStore';
import MessageItem from './message-item';
import Button from '@/components/ui/button';
import { useWindowProperties } from '../../common/useWindowProperties';
import { MessageType, RawMessage } from '../../chat-api/RawData';
import socketClient from '../../chat-api/socketClient';
import { ServerEvents } from '../../chat-api/EventNames';
import Icon from '@/components/ui/icon';
import { postChannelTyping } from '@/chat-api/services/MessageService';
import { className } from 'solid-js/web';
import { classNames } from '@/common/classNames';

export default function MessagePane() {
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
      <MessageLogArea />
      <MessageArea />
    </div>
  );
}





const MessageLogArea = () => {
  let messageLogElement: undefined | HTMLDivElement;
  const params = useParams();
  const {channels, messages, account} = useStore();

  const channelMessages = () => messages.getMessagesByChannelId(params.channelId!);
  const [openedTimestamp, setOpenedTimestamp] = createSignal<null | number>(null);

  const [unreadMessageId, setUnreadMessageId] = createSignal<null | string>(null);
  const [unreadLastSeen, setUnreadLastSeen] = createSignal<null | number>(null);

  const channel = () => channels.get(params.channelId!)!;
  const {hasFocus} = useWindowProperties();

  createEffect(on(channel, () => {
    setOpenedTimestamp(null);
    if (!channel()) return;
    messages.fetchAndStoreMessages(channel().id).then(() => {
      setOpenedTimestamp(Date.now());
      channel()?.dismissNotification();
    })
  }))
  
  createEffect(on(channelMessages, (messages) => {
    if (!messages) return;
    setUnreadMessageId(null);
    setUnreadLastSeen(null);
    updateLastReadIndex();
  }))
  
  createEffect(on(() => channelMessages()?.length, () => {
    if (messageLogElement) {
      messageLogElement!.scrollTop = messageLogElement!.scrollHeight;
    }
  }))
  
  createEffect(on(hasFocus, () => {
    if (hasFocus()) {
      channel()?.dismissNotification();
    }
  }, { defer: true }))
  
  const onMessage = (message: RawMessage) => {
    if (!channelMessages()) return;
    const selectedChannelId = params.channelId;
    const newMessageChannelId = message.channelId;
    if (selectedChannelId !== newMessageChannelId) return;
    if (message.createdBy.id === account.user()?.id) return;
    if (!hasFocus()) {
      if ((channel().lastSeen || null) !== unreadLastSeen()) {
        setUnreadMessageId(message.id);
        setUnreadLastSeen(channel().lastSeen ? new Date(channel().lastSeen!).getTime() : null);
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

    const lastRead = channel()?.lastSeen ? new Date(channel()?.lastSeen!).getTime() : -1;
    if (lastRead === -1) {
      setUnreadMessageId(null);
      return;
    };
    
    const message = channelMessages()?.find(m => new Date(m.createdAt).getTime() - lastRead >= 0 );
    setUnreadMessageId(message?.id || null);
  }

  

  return <div class={styles.messageLogArea} ref={messageLogElement} >
    <For each={channelMessages()}>
      {(message, i) => (
        <>
          <Show when={unreadMessageId() === message.id}>
            <UnreadMarker/>
          </Show>

            <MessageItem
              animate={!!openedTimestamp() && new Date(message.createdAt).getTime() > openedTimestamp()!}
              message={message}
              beforeMessage={ message.type === MessageType.CONTENT && channelMessages()?.[i() - 1]}
            />

        </>
      )}
    </For>
  </div>
}



function MessageArea() {
  const {input} = useStore();
  const params = useParams<{channelId: string}>();
  let textAreaEl: undefined | HTMLTextAreaElement;
  const {isMobileAgent} = useWindowProperties();

  const {channels, messages} = useStore();

  const setMessage = (content: string) => {
    input.updateContent(params.channelId, content)
  }

  const channelInput = () => input.getInput(params.channelId);
  const message = () => channelInput()?.content || '';
  const editMessageId = () => channelInput()?.editMessageId;

  let typingTimeoutId: null | number = null;

  createEffect(() => {
    if (editMessageId()) {
      textAreaEl?.focus();
    }
  })
  
  const cancelEdit = () => {
    input.setEditMessage(params.channelId, undefined);
    textAreaEl?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      cancelEdit();
      return;
    }
    if(event.key === "ArrowUp") {
      const msg = [...messages.get(params.channelId) || []].reverse()?.find(m => m.type === MessageType.CONTENT);
      if (msg) {
        input.setEditMessage(params.channelId, msg);
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
    if (editMessageId()) {
      messages.editAndStoreMessage(params.channelId, editMessageId()!, trimmedMessage);
      cancelEdit();
    } else {
      messages.sendAndStoreMessage(channel.id, trimmedMessage);
    }
    typingTimeoutId && clearTimeout(typingTimeoutId)
    typingTimeoutId = null;
  }
  
  const onInput = (event: any) => {
    setMessage(event.target?.value);
    if (typingTimeoutId) return;
    postChannelTyping(params.channelId);
    typingTimeoutId = window.setTimeout(() => {
      typingTimeoutId = null;
    }, 4000)

  }


  return <div class={styles.messageArea}>
    <Show when={editMessageId()}><Button iconName='close' color='var(--alert-color)' onClick={cancelEdit} class={styles.cancelEditButton}/></Show>
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

  createEffect(on(() => params.channelId, () => {
    Object.values(typingUserIds).forEach(timeoutId => 
      clearTimeout(timeoutId)
    )
    setTypingUserIds(reconcile({}));
  }))

  onMount(() => {
    socketClient.socket.on(ServerEvents.CHANNEL_TYPING, onTyping)
    socketClient.socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated)
    
    onCleanup(() => {
      socketClient.socket.off(ServerEvents.CHANNEL_TYPING, onTyping)
      socketClient.socket.off(ServerEvents.MESSAGE_CREATED, onMessageCreated)
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
  const {messages, input} = useStore();

  const message = () => messages.get(params.channelId)?.find(m => m.id === props.messageId);

  createEffect(() => {    
    if (!message()) {
      input.setEditMessage(params.channelId, undefined);
    }
  })



  return (
    <Floating class={styles.editIndicator}>
      <Icon name='edit' size={17} color='var(--primary-color)' class={styles.editIcon} />
      {message()?.content}
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