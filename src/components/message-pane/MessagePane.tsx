import styles from './styles.module.scss';
import { batch, createEffect, createMemo, createRenderEffect, createSignal, For, JSX, Match, on, onCleanup, onMount, Show, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { A, useParams } from '@solidjs/router';
import useStore from '../../chat-api/store/useStore';
import MessageItem from './message-item/MessageItem';
import Button from '@/components/ui/Button';
import { useWindowProperties } from '../../common/useWindowProperties';
import { ChannelType, MessageType, RawCustomEmoji, RawMessage } from '../../chat-api/RawData';
import socketClient from '../../chat-api/socketClient';
import { ServerEvents } from '../../chat-api/EventNames';
import Icon from '@/components/ui/icon/Icon';
import { postChannelTyping } from '@/chat-api/services/MessageService';
import { classNames, conditionalClass } from '@/common/classNames';
import { emojiShortcodeToUnicode, emojiUnicodeToShortcode, unicodeToTwemojiUrl } from '@/emoji';
import { Rerun } from '@solid-primitives/keyed';
import Spinner from '../ui/Spinner';
import env from '@/common/env';
import Text from '../ui/Text';
import useChannels, { Channel } from '@/chat-api/store/useChannels';
import useServerMembers, { ServerMember } from '@/chat-api/store/useServerMembers';
import { playMessageNotification } from '@/common/Sound';

import { CustomEmoji } from '@nerimity/solid-emoji-picker'
import categories from '@/emoji/categories.json';
import emojis from '@/emoji/emojis.json';
import FileBrowser, { FileBrowserRef } from '../ui/FileBrowser';
import { fileToDataUrl } from '@/common/fileToDataUrl';
import { matchSorter } from 'match-sorter'
import ItemContainer from '../ui/Item';
import { User } from '@/chat-api/store/useUsers';
import Avatar from '../ui/Avatar';
import useChannelProperties from '@/chat-api/store/useChannelProperties';
import { text } from 'stream/consumers';
import { Emoji } from '../markup/Emoji';
import { css } from 'solid-styled-components';
import { CHANNEL_PERMISSIONS, hasBit } from '@/chat-api/Bitwise';
import useAccount from '@/chat-api/store/useAccount';
import useServers, { avatarUrl } from '@/chat-api/store/useServers';
import { EmojiPicker } from '../ui/EmojiPicker';


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


  const onMessageCreated = (payload: { socketId: string, message: RawMessage }) => {
    if (socketClient.id() === payload.socketId) return;

    if (payload.message.channelId !== params.channelId) return;

    if (!scrollTracker.scrolledBottom()) {
      if (payload.message.createdBy.id !== account.user()?.id) {
        if (!hasFocus()) return;
        playMessageNotification();
      }
    }
  }


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
  let [textAreaEl, setTextAreaEl] = createSignal<undefined | HTMLTextAreaElement>(undefined);
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
      textAreaEl()?.focus();
    }
  })

  createEffect(on(message, () => adjustHeight()));

  const cancelEdit = () => {
    channelProperties.setEditMessage(params.channelId, undefined);
    textAreaEl()?.focus();
  };

  const cancelAttachment = () => {
    channelProperties.setAttachment(params.channelId, undefined);
    textAreaEl()?.focus();
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
    textAreaEl()?.focus();
    const trimmedMessage = message().trim();
    setMessage('')
    const channel = channels.get(params.channelId!)!;

    const formattedMessage = formatMessage(trimmedMessage, params.serverId, params.channelId);

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
    textAreaEl()!.style.height = '0px';
    let newHeight = (textAreaEl()!.scrollHeight - 24);
    if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;
    textAreaEl()!.style.height = newHeight + "px";
    textAreaEl()!.scrollTop = textAreaEl()!.scrollHeight;
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
    if (!textAreaEl()) return;
    textAreaEl()!.focus();
    textAreaEl()!.setRangeText(`:${shortcode}: `, textAreaEl()!.selectionStart, textAreaEl()!.selectionEnd, "end")
    setMessage(textAreaEl()!.value)

  }

  return <div class={classNames("messageArea", styles.messageArea, conditionalClass(editMessageId(), styles.editing))}>
    <TypingIndicator />
    <FloatingSuggestions textArea={textAreaEl()} />
    <Show when={channelProperty()?.attachment}><FloatingAttachment /></Show>
    <Show when={editMessageId()}><EditIndicator messageId={editMessageId()!} /></Show>
    <Show when={showEmojiPicker()}><FloatingEmojiPicker close={() => setShowEmojiPicker(false)} onClick={onEmojiPicked} /></Show>
    <CustomTextArea
      ref={setTextAreaEl}
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
        maxLength={2000}
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

  const onMessageCreated = (event: { message: RawMessage }) => {
    if (event.message.channelId !== params.channelId) return;
    const timeoutId = typingUserIds[event.message.createdBy.id];
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTypingUserIds(event.message.createdBy.id, undefined);
    }
  }

  const onMessageUpdated = (evt: any) => onMessageCreated({ message: evt.updated })

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

  return (
    <Floating class={styles.floatingEmojiPicker}>
      <EmojiPicker
        onClick={props.onClick}
        close={props.close}
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
    const getDataUrl = await fileToDataUrl(file);
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
    <div ref={floatingEl} class={classNames("floating", styles.floating, props.class)}>
      {props.children}
    </div>
  )
}

const emojiRegex = /:[\w+-]+:/g;
const channelMentionRegex = /#([a-zA-Z]+( [a-zA-Z]+)?)#/g;
const userMentionRegex = /@([^@:]+):([a-zA-Z0-9]+)/g;

export function formatMessage(message: string, serverId?: string, channelId?: string): string {

  const channels = useChannels();
  const serverMembers = useServerMembers();
  const account = useAccount();
  const servers = useServers();

  const serverChannels = channels.getChannelsByServerId(serverId!)
  const members = serverMembers.array(serverId!)
  let finalString = message;

  // replace emoji
  finalString = finalString.replace(emojiRegex, val => {
    const emojiName = val.substring(1, val.length - 1);
    const emojiUnicode = emojiShortcodeToUnicode(emojiName);
    if (emojiUnicode) return emojiUnicode;

    const customEmoji = servers.customEmojiNamesToEmoji()[emojiName];
    if (customEmoji) return `[${customEmoji.gif ? 'ace' : 'ce'}:${customEmoji.id}:${emojiName}]`


    return val;
  });

  if (!serverId && channelId) {
    const channel = channels.get(channelId);
    const dmUsers = !channel ? [] : [channel?.recipient, account.user()] as User[];
    // replace user mentions
    finalString = finalString.replace(userMentionRegex, (match, username, tag) => {
      if (!dmUsers) return match;

      const user = dmUsers.find(member => member?.username === username && member?.tag === tag);
      if (!user) return match;
      return `[@:${user.id}]`;
    });
  }


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

function FloatingSuggestions(props: { textArea?: HTMLTextAreaElement }) {
  const { channelProperties } = useStore();
  const params = useParams<{ serverId?: string, channelId: string }>();

  const [textBefore, setTextBefore] = createSignal("");
  const [isFocus, setIsFocus] = createSignal(false);

  const content = () => channelProperties.get(params.channelId)?.content || "";
  const onFocus = () => setIsFocus(true);

  const onClick = (e: any) => {
    setIsFocus(e.target.closest("." + styles.textArea))
  };

  const update = () => {
    if (props.textArea?.selectionStart !== props.textArea?.selectionEnd) return setIsFocus(false)
    setIsFocus(true);
    const textBefore = getTextBeforeCursor(props.textArea);
    setTextBefore(textBefore);
  }

  const onSelectionChange = () => {
    if (!isFocus()) return;
    update();
  }

  createEffect(() => {
    props.textArea?.addEventListener("focus", onFocus)
    document.addEventListener("click", onClick)
    document.addEventListener("selectionchange", onSelectionChange)
    onCleanup(() => {
      props.textArea?.removeEventListener("focus", onFocus)
      document.removeEventListener("click", onClick)
      document.removeEventListener("selectionchange", onSelectionChange)
    })
  })

  createEffect(on(content, update));


  const suggestChannels = () => textBefore().startsWith("#");
  const suggestUsers = () => textBefore().startsWith("@");
  const suggestEmojis = () => textBefore().startsWith(":");

  return (
    <Show when={isFocus()}>
      <Switch>
        <Match when={suggestChannels()}><FloatingChannelSuggestions search={textBefore().substring(1)} textArea={props.textArea} /></Match>
        <Match when={suggestUsers()}><FloatingUserSuggestions search={textBefore().substring(1)} textArea={props.textArea} /></Match>
        <Match when={suggestEmojis()}><FloatingEmojiSuggestions search={textBefore().substring(1)} textArea={props.textArea} /></Match>
      </Switch>
    </Show>
  )
}

function useSelectedSuggestion(length: () => number, textArea: HTMLTextAreaElement, onEnterClick: (i: number) => void) {
  const [current, setCurrent] = createSignal(0);

  createEffect(() => {
    textArea.addEventListener("keydown", onKey);
    onCleanup(() => {
      textArea.removeEventListener("keydown", onKey);
    })
  })

  const next = () => {
    if (current() + 1 >= length()) {
      setCurrent(0);
    } else {
      setCurrent(current() + 1);
    }
  }

  const previous = () => {
    if (current() - 1 < 0) {
      setCurrent(length() - 1);
    } else {
      setCurrent(current() - 1);
    }
  }

  const onKey = (event: KeyboardEvent) => {
    if (!length()) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      previous();
    }
    if (event.key === "Enter") {
      event.stopPropagation();
      event.preventDefault();
      onEnterClick(current());
    }
  }

  return [current, next, previous, setCurrent] as const
}

function FloatingChannelSuggestions(props: { search: string, textArea?: HTMLTextAreaElement }) {
  const params = useParams<{ serverId?: string, channelId: string }>();
  const { channels } = useStore();


  const serverChannels = createMemo(() => channels.getChannelsByServerId(params.serverId!, true).filter(c => c?.type === ChannelType.SERVER_TEXT) as Channel[]);
  const searchedChannels = () => matchSorter(serverChannels(), props.search, { keys: ["name"] }).slice(0, 10);


  createEffect(on(searchedChannels, () => {
    setCurrent(0);
  }))

  const onChannelClick = (channel: Channel) => {
    if (!props.textArea) return;
    appendText(params.channelId, props.textArea, props.search, channel.name + "# ")
  }

  const onEnterClick = (i: number) => {
    onChannelClick(searchedChannels()[i]);
  }

  const [current, , , setCurrent] = useSelectedSuggestion(() => searchedChannels().length, props.textArea!, onEnterClick)

  return (
    <Show when={params.serverId && searchedChannels().length}>
      <Floating class={styles.floatingSuggestion}>
        <For each={searchedChannels()}>
          {(channel, i) => <ChannelSuggestionItem onHover={() => setCurrent(i())} selected={current() === i()} onclick={onChannelClick} channel={channel} />}
        </For>
      </Floating>
    </Show>
  )
}

function ChannelSuggestionItem(props: { onHover: () => void; selected: boolean; channel: Channel, onclick(channel: Channel): void; }) {


  const isPrivateChannel = () => hasBit(props.channel.permissions || 0, CHANNEL_PERMISSIONS.PRIVATE_CHANNEL.bit);

  return (
    <ItemContainer selected={props.selected} onmouseover={props.onHover} onclick={() => props.onclick(props.channel)} class={styles.suggestionItem}>
      <span class={styles.channelIcon}>#</span>
      <Show when={isPrivateChannel()}>
        <Icon name='lock' size={14} style={{ opacity: 0.3 }} />
      </Show>
      <div class={styles.suggestLabel}>{props.channel.name}</div>
    </ItemContainer>
  )
}

function FloatingUserSuggestions(props: { search: string, textArea?: HTMLTextAreaElement }) {
  const params = useParams<{ serverId?: string, channelId: string }>();
  const { serverMembers, channels, account } = useStore();

  const members = createMemo(() => serverMembers.array(params.serverId!) as ServerMember[]);

  const searchedServerUsers = () => matchSorter(members(), props.search, { keys: ["user.username"] }).slice(0, 10);


  const channel = () => channels.get(params.channelId);
  const DMUsers = () => !channel() ? [] : [channel()?.recipient, account.user()] as User[];
  const searchedDMUsers = () => matchSorter(DMUsers(), props.search, { keys: ["username"] }).slice(0, 10);

  const searched = () => !params.serverId ? searchedDMUsers() : searchedServerUsers();


  createEffect(on(() => props.search, () => {
    setCurrent(0);
  }))

  const onUserClick = (user: User) => {
    if (!props.textArea) return;
    appendText(params.channelId, props.textArea, props.search, `${user.username}:${user.tag} `)
  }

  const onEnterClick = (i: number) => {
    onUserClick((searched()[i] as ServerMember)?.user || searched()[i]);
  }

  const [current, , , setCurrent] = useSelectedSuggestion(() => searched().length, props.textArea!, onEnterClick)

  return (
    <Show when={searched().length}>
      <Floating class={styles.floatingSuggestion}>
        <For each={searched()}>
          {(member, i) => <UserSuggestionItem onHover={() => setCurrent(i())} selected={current() === i()} user={(member as ServerMember)?.user || member} onclick={onUserClick} />}
        </For>
      </Floating>
    </Show>
  )
}

function UserSuggestionItem(props: { onHover: () => void; selected: boolean; user: User, onclick(user: User): void; }) {
  return (
    <ItemContainer onmouseover={props.onHover} selected={props.selected} class={styles.suggestionItem} onclick={() => props.onclick(props.user)}>
      <Avatar user={props.user} animate={props.selected} size={15} />
      <div class={styles.suggestLabel}>{props.user.username}</div>
    </ItemContainer>
  )
}

type Emoji = typeof emojis[number];

function FloatingEmojiSuggestions(props: { search: string, textArea?: HTMLTextAreaElement }) {
  const params = useParams<{ channelId: string }>();
  const {servers} = useStore();


  const searchedEmojis = () => matchSorter([...emojis, ...servers.emojisUpdatedDupName()], props.search, { keys: ["short_names.*", "name"] }).slice(0, 10);



  createEffect(on(searchedEmojis, () => {
    setCurrent(0);
  }))

  const onItemClick = (emoji: Emoji | RawCustomEmoji) => {
    if (!props.textArea) return;
    appendText(params.channelId, props.textArea, props.search, `${(emoji as RawCustomEmoji).name || (emoji as Emoji).short_names[0]}: `)
  }

  const onEnterClick = (i: number) => {
    onItemClick(searchedEmojis()[i]);
  }

  const [current, , , setCurrent] = useSelectedSuggestion(() => searchedEmojis().length, props.textArea!, onEnterClick)

  return (
    <Show when={searchedEmojis().length}>
      <Floating class={styles.floatingSuggestion}>
        <For each={searchedEmojis()}>
          {(emoji, i) => <EmojiSuggestionItem onHover={() => setCurrent(i())} selected={current() === i()} emoji={emoji} onclick={onItemClick} />}
        </For>
      </Floating>
    </Show>
  )
}

function EmojiSuggestionItem(props: { onHover: () => void; selected: boolean; emoji: Emoji | RawCustomEmoji, onclick(emoji: Emoji): void; }) {
  const name = () => (props.emoji as RawCustomEmoji).name || (props.emoji as Emoji).short_names[0];
  const url = () => {
    if ((props.emoji as RawCustomEmoji).id) {
      const emoji = props.emoji as RawCustomEmoji;
      const extName = emoji.gif ? '.gif' : '.webp'
      return `${env.NERIMITY_CDN}emojis/${emoji.id}${extName}`
    }
    return unicodeToTwemojiUrl((props.emoji as Emoji).emoji)

  }
  return (
    <ItemContainer onmouseover={props.onHover} selected={props.selected} class={styles.suggestionItem} onclick={() => props.onclick(props.emoji)}>
      <Emoji class={css`height: 15px; width: 15px;`} name={name()} url={url()} />
      <div class={styles.suggestLabel}>{name()}</div>
    </ItemContainer>
  )
}

function getTextBeforeCursor(element?: HTMLTextAreaElement) {
  if (!element) return "";
  const cursorPosition = element.selectionStart;
  const textBeforeCursor = element.value.substring(0, cursorPosition);
  const lastWord = textBeforeCursor.split(/\s+/).reverse()[0];
  return lastWord;
}

function appendText(channelId: string, textArea: HTMLTextAreaElement, query: string, name: string) {
  const channelProperties = useChannelProperties();
  const content = channelProperties.get(channelId)?.content || "";

  const cursorPosition = textArea.selectionStart!;
  const removeCurrentQuery = removeByIndex(content, cursorPosition - query.length, query.length);
  const result = removeCurrentQuery.slice(0, cursorPosition - query.length) + name + removeCurrentQuery.slice(cursorPosition - query.length);

  channelProperties.updateContent(channelId, result);

  textArea.focus();
  textArea.selectionStart = cursorPosition + (name.length - query.length)
  textArea.selectionEnd = cursorPosition + (name.length - query.length)
}

function removeByIndex(val: string, index: number, remove: number) {
  return val.substring(0, index) + val.substring(index + remove);
}