import styles from './styles.module.scss';
import { batch, createEffect, createMemo, createRenderEffect, createSignal, For, JSX, Match, on, onCleanup, onMount, Show, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { A, useParams } from '@nerimity/solid-router';
import useStore from '../../chat-api/store/useStore';
import MessageItem from './message-item/MessageItem';
import Button from '@/components/ui/Button';
import { useWindowProperties } from '../../common/useWindowProperties';
import { MessageType, RawMessage } from '../../chat-api/RawData';
import socketClient from '../../chat-api/socketClient';
import { ServerEvents } from '../../chat-api/EventNames';
import Icon from '@/components/ui/icon/Icon';
import { postChannelTyping } from '@/chat-api/services/MessageService';
import { classNames, conditionalClass } from '@/common/classNames';
import { emojiShortcodeToUnicode } from '@/emoji';
import { Rerun } from '@solid-primitives/keyed';
import Spinner from '../ui/Spinner';
import env from '@/common/env';
import Text from '../ui/Text';
import useChannels from '@/chat-api/store/useChannels';
import { runWithContext } from '@/common/runWithContext';
import useUsers from '@/chat-api/store/useUsers';
import useServerMembers from '@/chat-api/store/useServerMembers';
import { playMessageNotification } from '@/common/Sound';
import { css } from 'solid-styled-components';

import { EmojiPicker } from '@nerimity/solid-emoji-picker'
import categories from '@/emoji/categories.json';
import emojis from '@/emoji/emojis.json';
import FileBrowser, { FileBrowserRef } from '../ui/FileBrowser';
import { fileToDataUrl } from '@/common/fileToDataUrl';


export default function MessagePane(props: { mainPaneEl: HTMLDivElement }) {
  const params = useParams();
  const { channels, header } = useStore();

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
      id: 'MessagePane'
    });

  })


  return (
    <Rerun on={() => params.channelId}>
      <div class={styles.messagePane}>
        <MessageLogArea mainPaneEl={props.mainPaneEl} />
        <MessageArea mainPaneEl={props.mainPaneEl} />
      </div>
    </Rerun>
  );
}

const saveScrollPosition = (scrollElement: HTMLDivElement, logElement: HTMLDivElement, element: "first" | "last") => {

  let el = logElement?.querySelector(".messageItem") as HTMLDivElement;

  if (element === "last") {
    el = logElement.lastElementChild as HTMLDivElement;
  }

  let beforeTop: undefined | number;

  const save = () => {
    beforeTop = el.getBoundingClientRect().top;
  }
  const load = () => {
    const afterTop = el.getBoundingClientRect().top;
    const difference = afterTop - beforeTop!;
    scrollElement.scrollTop = scrollElement.scrollTop + difference;
  }
  return { save, load };
}

const MessageLogArea = (props: { mainPaneEl: HTMLDivElement }) => {
  const params = useParams<{ channelId: string }>();
  const { hasFocus } = useWindowProperties();
  const { channels, messages, account, channelProperties } = useStore();
  let messageLogElement: undefined | HTMLDivElement;
  const channelMessages = createMemo(() => messages.getMessagesByChannelId(params.channelId!));
  let loadedTimestamp: number | undefined;
  const [unreadMarker, setUnreadMarker] = createStore<{ lastSeenAt: number | null, messageId: string | null }>({ lastSeenAt: null, messageId: null });

  const [loadingMessages, setLoadingMessages] = createStore({ top: false, bottom: true });
  const scrollTracker = createScrollTracker(props.mainPaneEl);

  const channel = () => channels.get(params.channelId!)!;

  const properties = () => channelProperties.get(params.channelId);


  const updateUnreadMarker = (ignoreFocus = false) => {
    if (!ignoreFocus && hasFocus()) return;
    const lastSeenAt = channel().lastSeen || -1;
    const message = channelMessages()?.find(m => m.createdAt - lastSeenAt >= 0);
    setUnreadMarker({
      lastSeenAt,
      messageId: message?.id || null
    });
    setTimeout(() => {
      if (scrollTracker.scrolledBottom()) {
        props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
      }
    });
  }

  createEffect(on(() => channelMessages()?.length, (length, prevLength) => {
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
    channel()?.dismissNotification();
  }


  const onMessageCreated = (message: RawMessage) => {
    if (message.channelId !== params.channelId) return;
    if (scrollTracker.scrolledBottom()) {
      props.mainPaneEl.scrollTop = props.mainPaneEl.scrollHeight;
    }
    if (!scrollTracker.scrolledBottom()) {
      if (message.createdBy.id !== account.user()?.id) {
        if (!hasFocus()) return;
        playMessageNotification();
      }
    }
  }

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
      setLoadingMessages('bottom', false);
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

      dismissNotification();
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
    if (!file.type.startsWith("image")) return;
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
    loadedTimestamp = Date.now();
    if (channelMessages()) return;
    await messages.fetchAndStoreMessages(params.channelId);
  }

  const areMessagesLoading = () => loadingMessages.top || loadingMessages.bottom;

  // Load more top when scrolled to the top
  createEffect(on([scrollTracker.loadMoreTop, areMessagesLoading], ([loadMoreTop, alreadyLoading]) => {
    if (!channelMessages()) return;
    if (channelMessages()?.length! < env.MESSAGE_LIMIT) return;
    if (!properties()?.moreTopToLoad) return;
    if (alreadyLoading) return;
    if (!loadMoreTop) return;
    setLoadingMessages('top', true);
    const { save, load } = saveScrollPosition(props.mainPaneEl!, messageLogElement!, "first");

    const beforeSet = () => {
      save();
    }

    const afterSet = ({ hasMore }: { hasMore: boolean }) => {
      load();
      channelProperties.setMoreBottomToLoad(params.channelId, true);
      channelProperties.setMoreTopToLoad(params.channelId, hasMore);
      scrollTracker.forceUpdate();
      setLoadingMessages('top', false);
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
    setLoadingMessages('bottom', true);
    const { save, load } = saveScrollPosition(props.mainPaneEl!, messageLogElement!, "last");

    const beforeSet = () => {
      save();
    }

    const afterSet = ({ hasMore }: { hasMore: boolean }) => {
      load();
      channelProperties.setMoreTopToLoad(params.channelId, true);
      channelProperties.setMoreBottomToLoad(params.channelId, hasMore);
      scrollTracker.forceUpdate();
      setLoadingMessages('bottom', false);
    }
    messages.loadMoreBottomAndStoreMessages(params.channelId, beforeSet, afterSet);
  }))

  const removeUnreadMarker = () => {
    updateUnreadMarker(true);
  }


  return (
    <div class={styles.messageLogArea} ref={messageLogElement}>
      <For each={channelMessages()}>
        {(message, i) => (
          <>
            <Show when={unreadMarker.messageId === message.id}>
              <UnreadMarker onClick={removeUnreadMarker} />
            </Show>
            <MessageItem
              animate={!!loadedTimestamp && message.createdAt > loadedTimestamp}
              message={message}
              beforeMessage={message.type === MessageType.CONTENT ? channelMessages()?.[i() - 1] : undefined}
              messagePaneEl={props.mainPaneEl}
            />
          </>
        )}
      </For>
    </div>
  );
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
  return { loadMoreTop, loadMoreBottom, scrolledBottom, scrollTop, forceUpdate: onScroll }
}

function MessageArea(props: { mainPaneEl: HTMLDivElement }) {
  const { channelProperties, account } = useStore();
  const params = useParams<{ channelId: string, serverId?: string; }>();
  let textAreaEl: undefined | HTMLTextAreaElement;
  const { isMobileAgent } = useWindowProperties();
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);

  const { channels, messages } = useStore();

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

  const cancelAttachment = () => {
    channelProperties.setAttachment(params.channelId, undefined);
    textAreaEl?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const myId = account.user()?.id;
    if (event.key === "Escape") {
      cancelEdit();
      cancelAttachment();
      return;
    }
    if (event.key === "ArrowUp") {
      if (message().trim().length) return;
      if (channelProperty()?.moreBottomToLoad) return;
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
    const channel = channels.get(params.channelId!)!;
    
    const formattedMessage = formatMessage(trimmedMessage, params.serverId);
    
    if (editMessageId()) {
      if (!trimmedMessage) return;
      messages.editAndStoreMessage(params.channelId, editMessageId()!, formattedMessage);
      cancelEdit();
    } else {
      if (!trimmedMessage && !channelProperty()?.attachment) return;
      messages.sendAndStoreMessage(channel.id, formattedMessage);
      channelProperties.setAttachment(channel.id, undefined)
      !channelProperty()?.moreBottomToLoad && (props.mainPaneEl!.scrollTop = props.mainPaneEl!.scrollHeight);
    }
    typingTimeoutId && clearTimeout(typingTimeoutId)
    typingTimeoutId = null;
  }

  const adjustHeight = () => {
    let MAX_HEIGHT = 100;
    textAreaEl!.style.height = '0px';
    let newHeight = (textAreaEl!.scrollHeight - 24);
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

  const onEmojiPicked = (shortcode: string) => {
    if (!textAreaEl) return;
    textAreaEl.focus();
    textAreaEl.setRangeText(`:${shortcode}: `, textAreaEl.selectionStart, textAreaEl.selectionEnd, "end")
    setMessage(textAreaEl.value)

  }

  return <div class={classNames(styles.messageArea, conditionalClass(editMessageId(), styles.editing))}>
    <TypingIndicator />
    <Show when={channelProperty()?.attachment}><FloatingAttachment /></Show>
    <Show when={editMessageId()}><EditIndicator messageId={editMessageId()!} /></Show>
    <Show when={showEmojiPicker()}><FloatingEmojiPicker close={() => setShowEmojiPicker(false)} onClick={onEmojiPicked} /></Show>
    <CustomTextArea
      ref={textAreaEl}
      placeholder='Message'
      onkeydown={onKeyDown}
      onInput={onInput}
      value={message()}
      isEditing={!!editMessageId()}
      onSendClick={sendMessage}
      onCancelEditClick={cancelEdit}
      onEmojiPickerClick={() => setShowEmojiPicker(!showEmojiPicker())}
    />
    <BackToBottomButton scrollElement={props.mainPaneEl} />
  </div>
}

interface CustomTextAreaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isEditing: boolean;
  onSendClick: () => void;
  onEmojiPickerClick: () => void;
  onCancelEditClick: () => void;
}

function CustomTextArea(props: CustomTextAreaProps) {
  let textAreaRef: HTMLInputElement | undefined;
  const params = useParams<{ channelId: string, serverId?: string; }>();
  

  const [isFocused, setFocused] = createSignal(false);
  const [attachmentFileBrowserRef, setAttachmentFileBrowserRef] = createSignal<FileBrowserRef | undefined>(undefined);

  const { channelProperties } = useStore();

  const onFilePicked = (test: FileList) => {
    const file = test.item(0) || undefined;
    channelProperties.setAttachment(params.channelId, file);
    textAreaRef?.focus();
  }

  const pickedFile = () => channelProperties.get(params.channelId)?.attachment;
  const onCancelAttachmentClick = () => {
    channelProperties.setAttachment(params.channelId, undefined);
    textAreaRef?.focus();
  }


  return (
    <div class={classNames(styles.textAreaContainer, conditionalClass(isFocused(), styles.focused))}>
      <Show when={!props.isEditing && !pickedFile()}>
        <FileBrowser ref={setAttachmentFileBrowserRef} accept='images' onChange={onFilePicked} />
        <Button
          onClick={() => attachmentFileBrowserRef()?.open()}
          class={styles.inputButtons}
          iconName='attach_file'
          padding={[8, 15, 8, 15]}
          margin={3}
          iconSize={18}
        />
      </Show>
      <Show when={props.isEditing}>
        <Button
          onClick={props.onCancelEditClick}
          class={styles.inputButtons}
          iconName='close'
          color='var(--alert-color)'
          padding={[8, 15, 8, 15]}
          margin={3}
          iconSize={18}
        />
      </Show>
      <Show when={pickedFile() && !props.isEditing}>
        <Button
          onClick={onCancelAttachmentClick}
          class={styles.inputButtons}
          iconName='close'
          color='var(--alert-color)'
          padding={[8, 15, 8, 15]}
          margin={3}
          iconSize={18}
        />
      </Show>
      <textarea
        {...props}
        ref={textAreaRef}
        onfocus={() => setFocused(true)}
        onblur={() => setFocused(false)}
        class={styles.textArea}
      />
      <Button
        class={classNames(styles.inputButtons, "emojiPickerButton")}
        onClick={props.onEmojiPickerClick}
        iconName="face"
        padding={[8, 15, 8, 15]}
        margin={[3, 0, 3, 3]}
        iconSize={18}
      />
      <Button
        class={styles.inputButtons}
        onClick={props.onSendClick}
        iconName={props.isEditing ? 'edit' : 'send'}
        padding={[8, 15, 8, 15]}
        margin={[3, 3, 3, 3]}
        iconSize={18}
      />

    </div>
  )

}

function UnreadMarker(props: { onClick: () => void }) {
  return (
    <div onclick={props.onClick} class={styles.unreadMarkerContainer}>
      <div class={styles.unreadMarker}>
        <Icon name='mark_chat_unread' class={styles.icon} size={12} />
        New Messages
        <Button class={styles.closeButton} iconName='close' color='white' />
      </div>
    </div>
  )
}

interface TypingPayload {
  userId: string;
  channelId: string;
}
function TypingIndicator() {
  const params = useParams<{ channelId: string }>();
  const { users } = useStore();

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
        <Text size={12}>
          <Switch>
            <Match when={typingUsers().length === 1}>
              <strong>{typingUsers()[0]?.username}</strong> is typing...
            </Match>
            <Match when={typingUsers().length === 2}>
              <strong>{typingUsers()[0]?.username}</strong> and <strong>{typingUsers()[1]?.username}</strong> are typing...
            </Match>
            <Match when={typingUsers().length === 3}>
              <strong>{typingUsers()[0]?.username}</strong>, <strong>{typingUsers()[1]?.username}</strong> and <strong>{typingUsers()[2]?.username}</strong> are typing...
            </Match>
            <Match when={typingUsers().length > 3}>
              <strong>{typingUsers()[0]?.username}</strong>, <strong>{typingUsers()[1]?.username}</strong>,  <strong>{typingUsers()[2]?.username}</strong> and <strong>{typingUsers().length - 3}</strong> others are typing...
            </Match>
          </Switch>
        </Text>
      </Floating>
    </Show>
  )
}


function FloatingEmojiPicker(props: { close: () => void; onClick: (shortcode: string) => void }) {
  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside)
    onCleanup(() => {
      document.removeEventListener("mousedown", handleClickOutside)
    })
  })

  const handleClickOutside = (e: MouseEvent & { target: any }) => {
    if (e.target.closest(`.${styles.floatingEmojiPicker}`)) return;
    if (e.target.closest(`.emojiPickerButton`)) return;
    props.close();
  }


  return (
    <Floating class={styles.floatingEmojiPicker}>
      <EmojiPicker
        class={styles.emojiPicker}
        spriteUrl="/assets/emojiSprites.png"
        categories={categories}
        emojis={emojis}
        onEmojiClick={(e) => props.onClick(e.short_names[0])}
        primaryColor='var(--primary-color)'
      />
    </Floating>
  )
}


function EditIndicator(props: { messageId: string }) {
  const params = useParams<{ channelId: string }>();
  const { messages, channelProperties } = useStore();

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


function FloatingAttachment(props: {}) {
  const params = useParams<{ channelId: string }>();
  const { channelProperties } = useStore();
  const [dataUrl, setDataUrl] = createSignal<string | undefined>(undefined);

  const getAttachmentFile = () => channelProperties.get(params.channelId)?.attachment;

  createEffect(async () => {
    const file = getAttachmentFile();
    if (!file) return;
    const getDataUrl = await fileToDataUrl(file) as string;
    setDataUrl(getDataUrl)
  })


  return (
    <Floating class={styles.floatingAttachment}>
      <Icon name='attach_file' size={17} color='var(--primary-color)' class={styles.attachIcon} />
      <img class={styles.attachmentImage} src={dataUrl()} alt="" />
      <div class={styles.attachmentFilename}>{getAttachmentFile().name}</div>
    </Floating>
  )
}


function Floating(props: { class?: string, children: JSX.Element }) {
  let floatingEl: undefined | HTMLDivElement;
  const offset = 8;

  const readjust = () => {
    if (!floatingEl) return;
    const height = floatingEl?.clientHeight;
    floatingEl.style.top = (-height + offset) + 'px';
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

const emojiRegex = /:([\w]+):/g;
const channelMentionRegex = /#([^#\n]+)#/g;
const userMentionRegex = /@([a-zA-Z0-9 ]+):([a-zA-Z0-9]+)/g;

function formatMessage(message: string, serverId?: string): string {

  const channels = useChannels();
  const serverMembers = useServerMembers();

  const serverChannels = channels.getChannelsByServerId(serverId!)
  const members = serverMembers.array(serverId!)
  let finalString = message;

  // replace emoji
  finalString = finalString.replace(emojiRegex, val => {
    const emojiName = val.substring(1, val.length - 1);
    return emojiShortcodeToUnicode(emojiName) || val;
  });


  if (serverId) {
    // replace user mentions
    finalString = finalString.replace(userMentionRegex, (match, username, tag) => {
      const member = members.find(member => member?.user.username === username && member?.user.tag === tag);
      if (!member) return match;
      return `[@:${member.user.id}]`;
    });
    // replace channel mentions
    finalString = finalString.replaceAll(channelMentionRegex, ((match, group) => {
      const channel = serverChannels.find(c => c!.name === group);
      if (!channel) return match;
      return `[#:${channel.id}]`
    }))
  }


  return finalString


}

function BackToBottomButton(props: { scrollElement: HTMLDivElement }) {
  const { channelProperties, channels, messages } = useStore();
  const params = useParams<{ channelId: string }>();

  const properties = () => channelProperties.get(params.channelId);
  const scrolledUp = () => !properties()?.isScrolledBottom || properties()?.moreBottomToLoad;

  const newMessages = createMemo(() => channels.get(params.channelId)?.hasNotifications);

  const onClick = async () => {
    if (properties()?.moreBottomToLoad) {
      await messages.fetchAndStoreMessages(params.channelId, true);
    }
    props.scrollElement.scrollTop = props.scrollElement.scrollHeight;
  }

  return (
    <Show when={scrolledUp()}>
      <div class={styles.backToBottom} onclick={onClick}>
        <Show when={newMessages()}><Text class={styles.text}>New messages</Text></Show>
        <Icon size={34} color={newMessages() ? 'var(--alert-color)' : "var(--primary-color)"} name="expand_more" />
      </div>
    </Show>
  )
}