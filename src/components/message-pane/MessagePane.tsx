import styles from './styles.module.scss';
import { createEffect, createMemo, createSignal, For, JSX, Match, on, onCleanup, onMount, Show, Switch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { A, useNavigate, useParams } from '@solidjs/router';
import useStore from '../../chat-api/store/useStore';
import Button from '@/components/ui/Button';
import { useWindowProperties } from '../../common/useWindowProperties';
import { ChannelType, MessageType, RawChannelNotice, RawCustomEmoji, RawMessage } from '../../chat-api/RawData';
import socketClient from '../../chat-api/socketClient';
import { ServerEvents } from '../../chat-api/EventNames';
import Icon from '@/components/ui/icon/Icon';
import { postChannelTyping } from '@/chat-api/services/MessageService';
import { classNames, conditionalClass } from '@/common/classNames';
import { emojiShortcodeToUnicode, unicodeToTwemojiUrl } from '@/emoji';

import env from '@/common/env';
import Text from '../ui/Text';
import useChannels, { Channel } from '@/chat-api/store/useChannels';
import useServerMembers, { ServerMember } from '@/chat-api/store/useServerMembers';

import { addToHistory } from '@nerimity/solid-emoji-picker'
import emojis from '@/emoji/emojis.json';
import FileBrowser, { FileBrowserRef } from '../ui/FileBrowser';
import { fileToDataUrl } from '@/common/fileToDataUrl';
import { matchSorter } from 'match-sorter'
import ItemContainer from '../ui/Item';
import { User } from '@/chat-api/store/useUsers';
import Avatar from '../ui/Avatar';
import useChannelProperties from '@/chat-api/store/useChannelProperties';
import { Emoji } from '../markup/Emoji';
import { css } from 'solid-styled-components';
import { CHANNEL_PERMISSIONS, hasBit, ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import useAccount from '@/chat-api/store/useAccount';
import useServers from '@/chat-api/store/useServers';
import { EmojiPicker } from '../ui/emoji-picker/EmojiPicker';
import { useCustomPortal } from '../ui/custom-portal/CustomPortal';
import { ChannelIcon } from '../servers/drawer/ServerDrawer';
import { setLastSelectedServerChannelId } from '@/common/useLastSelectedServerChannel';
import Modal from '../ui/modal/Modal';
import { FlexRow } from '../ui/Flexbox';
import { Markup } from '../Markup';
import { getChannelNotice } from '@/chat-api/services/ChannelService';
import { getStorageObject, setStorageObject, StorageKeys } from '@/common/localStorage';
import { randomKaomoji } from '@/common/kaomoji';
import { MessageLogArea } from './message-log-area/MessageLogArea';
import { TenorImage } from '@/chat-api/services/TenorService';
import { useMicRecorder } from '@nerimity/solid-opus-media-recorder';
import { DeleteMessageModal } from './message-item/MessageItem';

export default function MessagePane(props: { mainPaneEl: HTMLDivElement }) {
  const params = useParams<{ channelId: string, serverId?: string }>();
  const { channels, header, serverMembers, account } = useStore();
  const [textAreaEl, setTextAreaEl] = createSignal<undefined | HTMLTextAreaElement>(undefined);
  const channel = () => channels.get(params.channelId!);
  createEffect(() => {
    if (!channel()) return;

    const userId = channel()!.recipient?.id;

    header.updateHeader({
      title: channel()!.name,
      serverId: params.serverId!,
      channelId: params.channelId!,
      userId: userId,
      iconName: params.serverId ? 'dns' : 'inbox',
      id: 'MessagePane'
    });

    if (params.serverId) {
      setLastSelectedServerChannelId(params.serverId, params.channelId);
    }
  })

  const isServerAndEmailNotConfirmed = () => channel()?.serverId && !account.user()?.emailConfirmed

  const canSendMessage = () => {
    if (isServerAndEmailNotConfirmed()) {
      return false;
    }
    if (!channel()?.serverId) return true;
    const member = serverMembers.get(channel()?.serverId!, account.user()?.id!);
    if (!member) return false;
    if (member.amIServerCreator()) return true;
    if (member.hasPermission(ROLE_PERMISSIONS.ADMIN)) return true;

    if (!hasBit(channel()?.permissions || 0, CHANNEL_PERMISSIONS.SEND_MESSAGE.bit)) {
      return false;
    }

    return member.hasPermission(ROLE_PERMISSIONS.SEND_MESSAGE);
  }

  return (
    <div class={styles.messagePane}>
      <MessageLogArea mainPaneEl={props.mainPaneEl} textAreaEl={textAreaEl()} />

      <Show when={isServerAndEmailNotConfirmed()}>
        <EmailUnconfirmedNotice />
      </Show>

      <Show when={canSendMessage()}>
        <MessageArea mainPaneEl={props.mainPaneEl} textAreaRef={setTextAreaEl} />
      </Show>
    </div>
  );
}

const EmailUnconfirmedNotice = () => {
  return (
    <div class={styles.emailUnconfirmedNotice}>
      <div class={styles.text}>Confirm your email to send messages.</div>
      <A href="/app/settings/account">
        <Button label='Confirm' primary />
      </A>
    </div>
  )
}

function MessageArea(props: { mainPaneEl: HTMLDivElement, textAreaRef(element?: HTMLTextAreaElement): void }) {
  const { channelProperties, account } = useStore();
  const params = useParams<{ channelId: string, serverId?: string; }>();
  let [textAreaEl, setTextAreaEl] = createSignal<undefined | HTMLTextAreaElement>(undefined);
  const { isMobileAgent, paneWidth } = useWindowProperties();
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const { channels, messages } = useStore();

  const setMessage = (content: string) => {
    channelProperties.updateContent(params.channelId, content)
  }
  createEffect(on(textAreaEl, () => {
    props.textAreaRef(textAreaEl())
  }))

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



    if (!editMessageId() && channelProperty()?.attachment) {
      const attachment = channelProperty()?.attachment!;
      const isImage = attachment?.type?.startsWith('image/');
      const isMoreThan12MB = attachment && attachment.size > 12 * 1024 * 1024;
      const shouldUploadToGoogleDrive = !isImage || isMoreThan12MB;
      if (shouldUploadToGoogleDrive && !account.user()?.connections.find(c => c.provider === 'GOOGLE')) {
        createPortal(close => <GoogleDriveLinkModal close={close} />)
        return;
      }
    }

    textAreaEl()?.focus();
    const trimmedMessage = message().trim();
    setMessage('')
    const channel = channels.get(params.channelId!)!;

    const formattedMessage = formatMessage(trimmedMessage, params.serverId, params.channelId, !!editMessageId());

    if (editMessageId()) {

      if (!formattedMessage.trim()) {
        const message = messages.get(params.channelId)?.find(m => m.id === editMessageId())
        createPortal(close => <DeleteMessageModal close={close} message={message!} />)
        channelProperties.setEditMessage(params.channelId, undefined);
        return;
      }

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

  createEffect(on(paneWidth, () => {
    adjustHeight();
  }))

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
    setShowEmojiPicker(false);

  }

  const onGifPicked = (gif: TenorImage) => {
    if (!textAreaEl()) return;
    textAreaEl()!.focus();
    textAreaEl()!.setRangeText(`${gif.url} `, textAreaEl()!.selectionStart, textAreaEl()!.selectionEnd, "end")
    setMessage(textAreaEl()!.value)
    setShowEmojiPicker(false);

  }

  return <div class={classNames("messageArea", styles.messageArea, conditionalClass(editMessageId(), styles.editing))}>
    <Show when={showEmojiPicker()}><FloatingMessageEmojiPicker gifPicked={onGifPicked} close={() => setShowEmojiPicker(false)} onClick={onEmojiPicked} /></Show>
    <div class={styles.floatingItems}>
      <FloatingSuggestions textArea={textAreaEl()} />
      <Show when={channelProperty()?.attachment}><FloatingAttachment /></Show>
      <Show when={editMessageId()}><EditIndicator messageId={editMessageId()!} /></Show>
    </div>
    <TypingIndicator />
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

  const value = () => props.value as string;

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
      <BeforeYouChatNotice channelId={params.channelId} textAreaEl={() => textAreaRef} />
      <Show when={!props.isEditing && !pickedFile()}>
        <FileBrowser ref={setAttachmentFileBrowserRef} accept='any' onChange={onFilePicked} />
        <Button
          onClick={() => attachmentFileBrowserRef()?.open()}
          class={styles.inputButtons}
          iconName='attach_file'
          padding={[8, 8, 8, 8]}
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
          padding={[8, 8, 8, 8]}
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
          padding={[8, 8, 8, 8]}
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
      <Show when={!value().trim() && !pickedFile() && !props.isEditing}>
        <MicButton onBlob={(blob) => {
          const file = new File([blob], "voice.ogg", {type: "audio/ogg"});
          channelProperties.setAttachment(params.channelId, file);
        }} />
      </Show>
      <Button
        class={classNames(styles.inputButtons, "emojiPickerButton")}
        onClick={props.onEmojiPickerClick}
        iconName="face"
        padding={[8, 8, 8, 8]}
        margin={[3, props.isEditing ? 0 : ((pickedFile() || value().trim()) ? 0 : 3), 3, 3]}
        iconSize={18}
      />
      <Show when={pickedFile() || value().trim()}>
        <Button
          class={styles.inputButtons}
          onClick={props.onSendClick}
          iconName={props.isEditing ? 'edit' : 'send'}
          padding={[8, 15, 8, 15]}
          margin={[3, 3, 3, 3]}
          iconSize={18}
        />
      </Show>
      <Show when={!value().trim() && props.isEditing}>
        <Button
          class={styles.inputButtons}
          onClick={props.onSendClick}
          color='var(--alert-color)'
          iconName={'delete'}
          padding={[8, 15, 8, 15]}
          margin={[3, 3, 3, 3]}
          iconSize={18}
        />
      </Show>

    </div>
  )
}


const MicButton = (props: {onBlob?: (blob: Blob) => void}) => {
  const {isMobileAgent} = useWindowProperties();
  let timer: number | null = null;
  let recordStartAt = 0;
  let recordEndAt = 0;

  const [isRecording, setRecording] = createSignal(false);
  const {record, stop} = useMicRecorder();
  const [currentDuration, setDuration] = createSignal("0:00");
  const [cancelRecording, setCancelRecording] = createSignal(false);


  const onTouchMove = (event: TouchEvent) => {
    if (!isMobileAgent()) return;
    const myLocation = event.changedTouches[0];
    const realTarget = document.elementFromPoint(myLocation.clientX, myLocation.clientY);
    setCancelRecording(!realTarget?.closest(".voice-recorder-button"))

  }

  const onMicHold = async () => {
    if (isRecording()) return;
    recordStartAt = Date.now();

    setRecording(true);
    const blob = await record();

    const durationMs = recordEndAt - recordStartAt;
    if (durationMs < 800) return;
    if (cancelRecording()) return;

    props.onBlob?.(blob);

    setRecording(false);
    setCancelRecording(false);
  }
  
  const onMicRelease = () => {
    if (!isRecording()) return;

    setTimeout(() => {
      recordEndAt = Date.now();
      stop();
      setRecording(false);
    }, 200);
  }

  onMount(() => {
    document.addEventListener("pointerup", onMicRelease);

    onCleanup(() => {
      document.removeEventListener("pointerup", onMicRelease);
    })
  })


  createEffect(on(isRecording, () => {

    if (isRecording()) {
      timer = window.setInterval(() => {
        const durationMs = Date.now() - recordStartAt;
        setDuration(msToTime(durationMs));
      }, 1000);
      return;
    } 

    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    setDuration("0:00");
  }))


  return (
    <div style={{"display": "flex", "align-items": "center", "gap": "4px", "align-self": "end"}}>
    <Show when={isRecording()}>
      <div style={{"font-size": "12px"}}>{currentDuration()}</div>
    </Show>
    <Button
        styles={{"touch-action": "none", "user-select": "none"}}
        class={classNames(styles.inputButtons, "voice-recorder-button")}
        onPointerDown={onMicHold}
        onTouchMove={onTouchMove}
        onContextMenu={e => e.preventDefault()}
        onPointerEnter={() => !isMobileAgent() && setCancelRecording(false)}
        onPointerLeave={() => !isMobileAgent() && setCancelRecording(true)}
        iconName={cancelRecording() && isRecording() ? "delete" : "mic"}
        padding={[8, 8, 8, 8]}
        margin={[3, 0, 3, 3]}
        iconSize={18}
        primary={isRecording()}
        color={cancelRecording() && isRecording() ? "var(--alert-color)" : undefined}
      />
    </div>
  )
}

function msToTime(duration: number): string {
  let seconds: number | string = Math.floor((duration / 1000) % 60),
      minutes: number | string = Math.floor((duration / (1000 * 60)) % 60),
      hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24);

  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return (hours !== 0 ? hours + ":" : "") + minutes + ":" + seconds;
}

interface TypingPayload {
  userId: string;
  channelId: string;
}
function TypingIndicator() {
  const params = useParams<{ channelId: string }>();
  const { users } = useStore();
  const { paneWidth } = useWindowProperties();

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
    <Floating style={{
      visibility: typingUsers().length ? 'visible' : 'hidden',
      position: 'absolute',
      padding: "0px",
      top: "-25px",
      height: "20px",
      "padding-left": '5px',
      "padding-right": '5px',
      overflow: 'hidden',
      "white-space": 'nowrap',
      "margin-bottom": "5px",
      "z-index": "1"
    }}>
      <Text size={paneWidth()! < 500 ? 10 : 12}>
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
  )
}

function FloatingMessageEmojiPicker(props: { close: () => void; onClick: (shortcode: string) => void; gifPicked: (gif: TenorImage) => void }) {

  return (
    <Floating class={styles.floatingMessageEmojiPicker}>
      <EmojiPicker
      showGifPicker
        onClick={props.onClick}
        gifPicked={props.gifPicked}
        close={props.close}
        heightOffset={-60}
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
  const isImage = () => getAttachmentFile()?.type.startsWith('image/');

  createEffect(async () => {
    const file = getAttachmentFile();
    if (!file) return;
    if (!isImage()) return;
    const getDataUrl = await fileToDataUrl(file);
    setDataUrl(getDataUrl)
  })



  return (
    <Floating class={styles.floatingAttachment}>
      <Icon name='attach_file' size={17} color='var(--primary-color)' class={styles.attachIcon} />
      <Show when={isImage()}><img class={styles.attachmentImage} src={dataUrl()} alt="" /></Show>
      <div class={styles.attachmentFilename}>{getAttachmentFile()?.name}</div>
    </Floating>
  )
}


function Floating(props: { style?: JSX.CSSProperties; class?: string, children: JSX.Element, offset?: number; readjust?: boolean }) {
  let floatingEl: undefined | HTMLDivElement;
  const offset = props.offset !== undefined ? props.offset : 6;

  const readjust = () => {
    if (!props.readjust) return;
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
    <div ref={floatingEl} style={props.style} class={classNames("floating", styles.floating, props.class)}>
      {props.children}
    </div>
  )
}

const emojiRegex = /:[\w+-]+:/g;
const channelMentionRegex = /#([^#]+)#/g;
const userMentionRegex = /@([^@:]+):([a-zA-Z0-9]+)/g;

function randomIndex(arrLength: number) {
  return Math.floor(Math.random() * arrLength);
}

export function formatMessage(message: string, serverId?: string, channelId?: string, isEditing?: boolean): string {

  const isSomeoneMentioned = !isEditing && (message.includes("@someone") || false);

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

  // DM Channel
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

    if (isSomeoneMentioned) {
        finalString = finalString.replaceAll("@someone", () => `[@:s] **${randomKaomoji()} (${dmUsers[randomIndex(dmUsers.length)].username})**`)
    }
  }
  // Server Channel
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

    if (isSomeoneMentioned) {
      finalString = finalString.replaceAll("@someone", () => `[@:s] **${randomKaomoji()} (${members[randomIndex(members.length)]?.user.username})**`)
    }

  }

  finalString = finalString.replaceAll("@everyone", "[@:e]");

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
  const suggestEmojis = () => textBefore().startsWith(":") && textBefore().length >= 3;

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


  const serverChannels = createMemo(() => channels.getChannelsByServerId(params.serverId!, true).filter(c => c?.type !== ChannelType.CATEGORY) as Channel[]);
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
    <ItemContainer selected={props.selected} onmousemove={props.onHover} onclick={() => props.onclick(props.channel)} class={styles.suggestionItem}>
      <ChannelIcon icon={props.channel.icon} type={props.channel.type} hovered={props.selected} />
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
  const hasPermissionToMentionEveryone = () => {
    if (!params.serverId) return false;
    const member = serverMembers.get(params.serverId, account.user()?.id!);
    if (!member) return false;
    if (member.amIServerCreator()) return true;
    return member.hasPermission?.(ROLE_PERMISSIONS.MENTION_EVERYONE);
  }

  const searchedServerUsers = () => matchSorter([
    ...members(),
    ...(hasPermissionToMentionEveryone() ? [{
      user: {
        special: true,
        id: "e",
        username: "everyone"
      }
    }] : []),
    {
      user: {
        special: true,
        id: "s",
        username: "someone"
      }
    }
  ] as (ServerMember & {user: {special: boolean}})[],
    props.search,
    {
      keys: ["user.username"]
    }).slice(0, 10).sort((a, b) => {
      // move all special users to the bottom
      if (a.user.special && !b.user.special) return 1;
      if (!a.user.special && b.user.special) return -1;
      return 0;
    });


  const channel = () => channels.get(params.channelId);
  const DMUsers = () => !channel() ? [] : [channel()?.recipient, account.user()] as User[];
  const searchedDMUsers = () => matchSorter(DMUsers(), props.search, { keys: ["username"] }).slice(0, 10);

  const searched = () => !params.serverId ? searchedDMUsers() : searchedServerUsers();


  createEffect(on(() => props.search, () => {
    setCurrent(0);
  }))

  const onUserClick = (user: User) => {
    if (!props.textArea) return;
    if (!user.tag) {
      appendText(params.channelId, props.textArea, props.search, `${user.username} `)
      return;
    }
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

function UserSuggestionItem(props: { onHover: () => void; selected: boolean; user: User & { special?: boolean }, onclick(user: User): void; }) {
  return (
    <ItemContainer onmousemove={props.onHover} selected={props.selected} class={styles.suggestionItem} onclick={() => props.onclick(props.user)}>
      <Show when={!props.user?.special} fallback={<div>@</div>}><Avatar user={props.user} animate={props.selected} size={15} /></Show>
      <div class={styles.suggestLabel}>{props.user.username}</div>
      <Show when={props.user?.special && props.user.id === "e"}><div class={styles.suggestionInfo}>Mention everyone.</div></Show>
      <Show when={props.user?.special && props.user.id === "s"}><div class={styles.suggestionInfo}>Mentions someone.</div></Show>
    </ItemContainer>
  )
}

type Emoji = typeof emojis[number];

function FloatingEmojiSuggestions(props: { search: string, textArea?: HTMLTextAreaElement }) {
  const params = useParams<{ channelId: string }>();
  const { servers } = useStore();


  const searchedEmojis = () => matchSorter([...emojis, ...servers.emojisUpdatedDupName()], props.search, { keys: ["short_names.*", "name"] }).slice(0, 10);



  createEffect(on(searchedEmojis, () => {
    setCurrent(0);
  }))

  const onItemClick = (emoji: Emoji | RawCustomEmoji) => {
    if (!props.textArea) return;
    addToHistory((emoji as RawCustomEmoji).name || (emoji as Emoji).short_names[0], 20)
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
    <ItemContainer onmousemove={props.onHover} selected={props.selected} class={styles.suggestionItem} onclick={() => props.onclick(props.emoji)}>
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




const GoogleDriveLinkModal = (props: { close: () => void }) => {
  const navigate = useNavigate();
  const actionButtons = (
    <FlexRow style={{ width: "100%" }}>
      <Button styles={{ flex: 1 }} iconName='close' label="Don't link" color='var(--alert-color)' onClick={props.close} />
      <Button styles={{ flex: 1 }} label='Link now' iconName='link' primary onClick={() => {
        navigate('/app/settings/connections');
        props.close();
      }} />
    </FlexRow>
  )
  return (
    <Modal title='Google Drive' icon='link' actionButtons={actionButtons} ignoreBackgroundClick close={props.close} maxWidth={300}>
      <Text size={14} style={{ padding: '10px', "padding-top": 0 }}>
        You must link your account to Google Drive to upload large images, videos or files.
      </Text>
    </Modal>
  )
}





let noticeCache: Record<string, RawChannelNotice | null> = {};

const useNotice = (channelId: string) => {

  const [notice, setNotice] = createSignal<RawChannelNotice | null>(null);

  onMount(async () => {
    if (noticeCache[channelId] !== undefined) {
      setNotice(noticeCache[channelId]);
      return;
    }
    const noticeRes = await getChannelNotice(channelId).catch(() => { });
    if (!noticeRes) {
      noticeCache[channelId] = null;
      return;
    }
    noticeCache[channelId] = noticeRes.notice;
    setNotice(noticeRes.notice);
  })

  const hasAlreadySeenNotice = () => {
    if (!notice()) return;
    const lastSeenObj = getStorageObject<Record<string, number>>(StorageKeys.LAST_SEEN_CHANNEL_NOTICES, {});
    const lastSeen = lastSeenObj[channelId];
    if (!lastSeen) return false;
    return lastSeen > notice()!.updatedAt
  }
  const updateLastSeen = () => {
    if (!notice()) return;
    let lastSeenObj = getStorageObject<Record<string, number>>(StorageKeys.LAST_SEEN_CHANNEL_NOTICES, {});
    lastSeenObj[channelId] = Date.now();
    // keep the top 50 last seen notices
    const sorted = Object.entries(lastSeenObj).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 50) {
      sorted.splice(50, sorted.length - 50);
    }
    lastSeenObj = Object.fromEntries(sorted);
    setStorageObject(StorageKeys.LAST_SEEN_CHANNEL_NOTICES, lastSeenObj);
  }

  return { notice, setNotice, hasAlreadySeenNotice, updateLastSeen }
}


function BeforeYouChatNotice(props: { channelId: string, textAreaEl(): HTMLInputElement | undefined }) {
  const { notice, setNotice, hasAlreadySeenNotice, updateLastSeen } = useNotice(props.channelId);
  const [textAreaFocus, setTextAreaFocus] = createSignal(false);
  const { isMobileWidth } = useWindowProperties();

  const showNotice = () => notice() && !hasAlreadySeenNotice();

  const onDocClick = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      if (e.target.closest(`.messageArea`)) return;
      setTextAreaFocus(false)
    }
  }


  createEffect(on(showNotice, (show) => {
    show && document.addEventListener("click", onDocClick);
    onCleanup(() => {
      document.removeEventListener("click", onDocClick);
    })
  }))


  const understoodClick = () => {
    updateLastSeen();
    setNotice(null);
    props.textAreaEl()?.focus();
  }

  return (
    <>
      <Show when={showNotice()}><div class={styles.disableChatArea} onClick={() => setTextAreaFocus(true)} style={{ cursor: textAreaFocus() ? 'not-allowed' : 'initial' }} /></Show>
      <Show when={showNotice() && textAreaFocus()}>
        <div class={classNames(styles.beforeYouChatNotice, conditionalClass(isMobileWidth(), styles.mobile))}>
          <div class={styles.title}>
            <Icon name='info' color='var(--primary-color)' size={18} />
            Before you chat...
          </div>
          <div class={styles.info}>
            <Markup inline text={notice()!.content} />
          </div>
          <Button label='Understood' iconName='done' onClick={understoodClick} class={styles.noticeButton} primary />
        </div>
      </Show>
    </>
  )
}