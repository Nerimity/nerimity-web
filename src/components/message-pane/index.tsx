import styles from './styles.module.scss';
import RouterEndpoints from '../../common/RouterEndpoints';

import { createEffect, createSignal, For, on, onCleanup, onMount, Show} from 'solid-js';
import { useLocation, useParams } from '@solidjs/router';
import useStore from '../../chat-api/store/useStore';
import MessageItem from './message-item';
import Button from '@/components/ui/button';
import { useWindowProperties } from '../../common/useWindowProperties';
import { RawMessage } from '../../chat-api/RawData';
import socketClient from '../../chat-api/socketClient';
import { ServerEvents } from '../../chat-api/EventNames';
import Icon from '@/components/ui/icon';

export default function MessagePane() {
  const params = useParams();
  const {channels, tabs} = useStore();

  createEffect(() => {
    const channel = channels.get(params.channelId!);
    if (!channel) return;
  
    const path = params.serverId ? RouterEndpoints.SERVER_MESSAGES(params.serverId!, params.channelId!) : RouterEndpoints.INBOX_MESSAGES(params.channelId!);
  
    const userId = channel.recipient?.id;
    
    tabs.openTab({
      title: channel.name,
      type: 'message_pane',
      serverId: params.serverId!,
      channelId: params.channelId!,
      userId: userId,
      iconName: params.serverId ? 'dns' : 'inbox',
      path: path,
    }, {update: true});

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
            beforeMessage={channelMessages()?.[i() - 1]}
          />
        </>
      )}
    </For>
  </div>
}



function MessageArea() {
  const params = useParams();
  const location = useLocation();

  const [message, setMessage] = createSignal('');
  const {tabs, channels, messages} = useStore();

  const onKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const trimmedMessage = message().trim();
      setMessage('')
      if (!trimmedMessage) return;
      const channel = channels.get(params.channelId!)!;
      tabs.updateTab(location.pathname!, {isPreview: false})
      messages.sendAndStoreMessage(channel.id, trimmedMessage);
    }
  }
  
  const onInput = (event: any) => {
    setMessage(event.target?.value);
  }


  return <div class={styles.messageArea}>
    <textarea placeholder='Message' class={styles.textArea} onkeydown={onKeyDown} onInput={onInput} value={message()}></textarea>
    <Button iconName='send' class={styles.button}/>
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