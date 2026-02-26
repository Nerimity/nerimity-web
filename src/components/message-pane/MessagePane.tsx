import styles from "./styles.module.scss";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  lazy,
  mapArray,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { A, useNavigate, useParams } from "solid-navigator";
import useStore from "../../chat-api/store/useStore";
import Button from "@/components/ui/Button";
import { useWindowProperties } from "../../common/useWindowProperties";
import {
  ChannelType,
  MessageType,
  RawBotCommand,
  RawCustomEmoji,
  RawMessage
} from "../../chat-api/RawData";
import socketClient from "../../chat-api/socketClient";
import { ServerEvents } from "../../chat-api/EventNames";
import Icon from "@/components/ui/icon/Icon";
import { postChannelTyping } from "@/chat-api/services/MessageService";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import {
  emojis,
  emojiShortcodeToUnicode,
  lazyLoadEmojis,
  unicodeToTwemojiUrl
} from "@/emoji";

import env from "@/common/env";
import Text from "../ui/Text";
import useChannels, { Channel } from "@/chat-api/store/useChannels";
import useServerMembers, {
  ServerMember
} from "@/chat-api/store/useServerMembers";

import { addToHistory } from "@nerimity/solid-emoji-picker";
import type EmojiType from "@/emoji/emojis.json";
import FileBrowser, { FileBrowserRef } from "../ui/FileBrowser";
import { fileToDataUrl } from "@/common/fileToDataUrl";
import { matchSorter } from "match-sorter";
import ItemContainer from "../ui/LegacyItem";
import useUsers, { User } from "@/chat-api/store/useUsers";
import Avatar from "../ui/Avatar";
import useChannelProperties from "@/chat-api/store/useChannelProperties";
import { Emoji } from "../markup/Emoji";
import { css } from "solid-styled-components";
import {
  CHANNEL_PERMISSIONS,
  hasBit,
  ROLE_PERMISSIONS
} from "@/chat-api/Bitwise";
import useAccount from "@/chat-api/store/useAccount";
import useServers from "@/chat-api/store/useServers";
import { EmojiPicker } from "../ui/emoji-picker/EmojiPicker";
import { toast, useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { setLastSelectedServerChannelId } from "@/common/useLastSelectedServerChannel";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { FlexRow } from "../ui/Flexbox";
import { Markup } from "../Markup";
import {
  getStorageBoolean,
  StorageKeys,
  useChatBarOptions
} from "@/common/localStorage";
import { randomKaomoji } from "@/common/kaomoji";
import { MessageLogArea } from "./message-log-area/MessageLogArea";
import { TenorImage } from "@/chat-api/services/TenorService";
import { useMicRecorder } from "@nerimity/solid-opus-media-recorder";
import { useNotice } from "@/common/useChannelNotice";
import { AdvancedMarkupOptions } from "../advanced-markup-options/AdvancedMarkupOptions";
import { prettyBytes } from "@/common/prettyBytes";
import Checkbox from "../ui/Checkbox";
import { ChannelIcon } from "../ChannelIcon";
import { MetaTitle } from "@/common/MetaTitle";
import { formatMillisRemainingNarrow, formatTimestampRelative } from "@/common/date";
import { useResizeObserver } from "@/common/useResizeObserver";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import { useCustomScrollbar } from "../custom-scrollbar/CustomScrollbar";
import { t } from "@nerimity/i18lite";
import useServerRoles from "@/chat-api/store/useServerRoles";
import { deleteServer } from "@/chat-api/services/ServerService";
import { ServerDeleteConfirmModal } from "../servers/settings/ServerGeneralSettings";
import { useSelectedSuggestion } from "@/common/useSelectedSuggestion";
import { Portal } from "solid-js/web";
import { Trans } from "@nerimity/solid-i18lite";
import { Rerun } from "@solid-primitives/keyed";
import { UnescapedTrans } from "../UnescapedTrans";
import { useLocalStorage } from "@/common/localStorage";
const [sendButtonRef, setSendButtonRef] = createSignal<HTMLButtonElement>();

const RemindersModal = lazy(() => import("../reminders-modal/RemindersModal"));

const DeleteMessageModal = lazy(
  () => import("./message-delete-modal/MessageDeleteModal")
);
const PhotoEditor = lazy(() => import("../ui/photo-editor/PhotoEditor"));

export default function MessagePaneMain() {
  const store = useStore();
  const params = useParams<{ channelId: string; serverId?: string }>();

  const server = () => store.servers.get(params.serverId!);

  const isScheduledDelete = createMemo(() => server()?.scheduledForDeletion);
  return (
    <Switch>
      <Match when={isScheduledDelete()}>
        <ScheduledDelete />
      </Match>
      <Match when={!isScheduledDelete()}>
        <MessagePane />
      </Match>
    </Switch>
  );
}

function MessagePane() {
  const mainPaneEl = document.querySelector(".main-pane-container")!;
  const { isMobileWidth } = useWindowProperties();
  const params = useParams<{ channelId: string; serverId?: string }>();
  const {
    channels,
    header,
    serverMembers,
    account,
    servers,
    channelProperties
  } = useStore();
  const { setMarginBottom, setMarginTop } = useCustomScrollbar();
  const [textAreaEl, setTextAreaEl] = createSignal<
    undefined | HTMLTextAreaElement
  >(undefined);
  const [isDragging, setIsDragging] = createSignal(false);

  const onDragOver = (event: DragEvent) => {
    const dataTransfer = event.dataTransfer;
    if (
      dataTransfer?.types.length !== 1 ||
      dataTransfer?.types[0] !== "Files"
    ) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent) => {
    if (event.relatedTarget == null) {
      event.preventDefault();
      setIsDragging(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (!event.dataTransfer?.files.length) return;
    if (!canSendMessage()) return;

    const file = event.dataTransfer.files[0];
    channelProperties.setAttachment(params.channelId, file);
  };

  const disabledAdvancedMarkup = getStorageBoolean(
    StorageKeys.DISABLED_ADVANCED_MARKUP,
    false
  );

  createEffect(
    on(isMobileWidth, () => {
      setMarginBottom(
        disabledAdvancedMarkup
          ? isMobileWidth()
            ? 48
            : 40
          : isMobileWidth()
            ? 84
            : 74
      );
    })
  );

  onMount(() => {
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);

    onCleanup(() => {
      setMarginBottom(0);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    });
  });
  const channel = () => channels.get(params.channelId!);
  createEffect(() => {
    if (!channel()) return;

    const userId = channel()!.recipient()?.id;

    header.updateHeader({
      title: channel()!.name,
      serverId: params.serverId!,
      channelId: params.channelId!,
      userId: userId,
      id: "MessagePane"
    });

    if (params.serverId) {
      setLastSelectedServerChannelId(params.serverId, params.channelId);
    }
  });

  const member = () =>
    serverMembers.get(channel()?.serverId!, account.user()?.id!);
  const isEmailNotConfirmed = () => !account.user()?.emailConfirmed;

  const muted = () =>
    member()?.muteExpireAt && new Date(member()?.muteExpireAt!) > new Date();

  const canSendMessage = () => channel()?.canSendMessage(account.user()?.id!);

  const server = () => servers.get(channel()?.serverId!);

  return (
    <div class={styles.messagePane}>
      <Portal>
        <Show when={isDragging()}>
          <DropOverlay />
        </Show>
      </Portal>
      <MetaTitle>
        {channel()?.name || channel()?.recipient()?.username}
        {params.serverId ? ` (${server()?.name})` : ""}
      </MetaTitle>
      <Rerun on={channel}>
        <MessageLogArea mainPaneEl={mainPaneEl} textAreaEl={textAreaEl()} />
      </Rerun>
      <Show when={muted()}>
        <MutedNotice member={member()!} />
      </Show>
      <Show when={isEmailNotConfirmed()}>
        <EmailUnconfirmedNotice />
      </Show>

      <Show when={canSendMessage()}>
        <MessageArea mainPaneEl={mainPaneEl} textAreaRef={setTextAreaEl} />
      </Show>
    </div>
  );
}

const EmailUnconfirmedNotice = () => {
  return (
    <div class={styles.emailUnconfirmedNotice}>
      <div class={styles.text}>{t("messageArea.emailNotice")}</div>
      <A href="/app/settings/account">
        <Button label={t("general.confirmButton")} primary />
      </A>
    </div>
  );
};
const MutedNotice = (props: { member: ServerMember }) => {
  const [expiresAt, setExpiresAt] = createSignal<string>("");

  const updateExpiresAt = () => {
    setExpiresAt(
      formatTimestampRelative(props.member.muteExpireAt ?? 0, "none")
    );
  };

  createEffect(
    on(
      () => props.member.muteExpireAt,
      () => {
        updateExpiresAt();
        const interval = setInterval(() => {
          updateExpiresAt();
        }, 1000);

        onCleanup(() => clearInterval(interval));
      }
    )
  );

  return (
    <div class={styles.mutedNotice}>
      <Icon name="volume_off" size={24} color="var(--alert-color)" />
      <div class={styles.text}>You are muted.</div>
      <div class={styles.expireDuration}>{expiresAt()}</div>
    </div>
  );
};

function MessageArea(props: {
  mainPaneEl: HTMLDivElement;
  textAreaRef(element?: HTMLTextAreaElement): void;
}) {
  const { channelProperties, account } = useStore();
  const params = useParams<{ channelId: string; serverId?: string }>();
  const [textAreaEl, setTextAreaEl] = createSignal<
    undefined | HTMLTextAreaElement
  >(undefined);
  const { isMobileAgent, paneWidth } = useWindowProperties();
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);
  const [showGifPicker, setShowGifPicker] = createSignal(false);
  const { createPortal } = useCustomPortal();

  const { height } = useResizeObserver(textAreaEl);

  const { channels, messages, serverMembers } = useStore();

  const setMessage = (content: string) => {
    channelProperties.updateContent(params.channelId, content);
  };
  createEffect(
    on(textAreaEl, () => {
      props.textAreaRef(textAreaEl());
    })
  );

  const channelProperty = () => channelProperties.get(params.channelId);
  const channel = () => channels.get(params.channelId!);
  const message = () => channelProperty()?.content || "";
  const editMessageId = () => channelProperty()?.editMessageId;

  let typingTimeoutId: null | number = null;

  createEffect(() => {
    if (editMessageId()) {
      textAreaEl()?.focus();
    }
  });

  createEffect(on([message, height], () => adjustHeight()));

  const cancelEdit = () => {
    channelProperties.setEditMessage(params.channelId, undefined);
    textAreaEl()?.focus();
  };

  const cancelAttachment = () => {
    channelProperties.setAttachment(params.channelId, undefined);
    textAreaEl()?.focus();
  };

  const cancelReplies = (all?: boolean) => {
    channelProperties.removeReplies(params.channelId);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const myId = account.user()?.id;
    if (event.key === "Escape") {
      cancelReplies();
      cancelEdit();
      cancelAttachment();
      return;
    }
    if (event.key === "ArrowUp") {
      if (message().trim().length) return;
      if (channelProperty()?.moreBottomToLoad) return;
      const msg = [...(messages.get(params.channelId) || [])]
        .reverse()
        ?.find(
          (m) =>
            m.type === MessageType.CONTENT &&
            m.createdBy.id === myId &&
            m.sentStatus === undefined
        );
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
  };

  const isAdmin = () => {
    if (!channel()?.serverId) return;
    const member = serverMembers.get(channel()?.serverId!, account.user()?.id!);
    return serverMembers.hasPermission(member!, ROLE_PERMISSIONS.ADMIN);
  };

  const sendMessage = () => {
    if (!editMessageId() && channelProperty()?.attachment) {
      const attachment = channelProperty()?.attachment!;

      const shouldUploadToGoogleDrive = attachment.uploadTo === "google_drive";
      if (
        shouldUploadToGoogleDrive &&
        !account.user()?.connections.find((c) => c.provider === "GOOGLE")
      ) {
        createPortal((close) => <GoogleDriveLinkModal close={close} />);
        return;
      }
    }
    if (
      !editMessageId() &&
      channelProperty()?.slowDownMode?.ttl &&
      !isAdmin()
    ) {
      return;
    }

    textAreaEl()?.focus();
    const trimmedMessage = message().trim();
    setMessage("");

    const formattedMessage = formatMessage(
      trimmedMessage,
      params.serverId,
      params.channelId,
      !!editMessageId()
    );

    if (editMessageId()) {
      if (!formattedMessage.trim()) {
        const message = messages
          .get(params.channelId)
          ?.find((m) => m.id === editMessageId());
        createPortal((close) => (
          <DeleteMessageModal close={close} message={message!} />
        ));
        channelProperties.setEditMessage(params.channelId, undefined);
        return;
      }

      if (!trimmedMessage) return;
      messages.editAndStoreMessage(
        params.channelId,
        editMessageId()!,
        formattedMessage
      );
      cancelEdit();
    } else {
      if (!trimmedMessage && !channelProperty()?.attachment) return;
      messages.sendAndStoreMessage(channel()!.id, formattedMessage);
      channelProperties.setAttachment(channel()!.id, undefined);
      !channelProperty()?.moreBottomToLoad &&
        (props.mainPaneEl!.scrollTop = props.mainPaneEl!.scrollHeight);
    }
    typingTimeoutId && clearTimeout(typingTimeoutId);
    typingTimeoutId = null;
  };

  const adjustHeight = () => {
    const bottomMargin = 5;
    const scrollEl = props.mainPaneEl;
    const scrollMax = scrollEl.scrollHeight - scrollEl.clientHeight;
    const wasAtBottom = scrollMax - scrollEl.scrollTop <= bottomMargin;

    const el = textAreaEl()!;
    const MAX_HEIGHT = 100;
    el.style.height = "0px";
    let newHeight = el.scrollHeight - 22;
    if (newHeight > MAX_HEIGHT) newHeight = MAX_HEIGHT;
    el.style.height = newHeight + "px";

    if (wasAtBottom) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  };

  createEffect(
    on(paneWidth, () => {
      adjustHeight();
    })
  );

  const onInput = (event: any) => {
    adjustHeight();
    setMessage(event.target?.value);
    if (typingTimeoutId) return;
    postChannelTyping(params.channelId);
    typingTimeoutId = window.setTimeout(() => {
      typingTimeoutId = null;
    }, 4000);
  };

  const onEmojiPicked = (shortcode: string, shiftDown?: boolean) => {
    if (!textAreaEl()) return;
    textAreaEl()!.focus();
    textAreaEl()!.setRangeText(
      `:${shortcode}: `,
      textAreaEl()!.selectionStart,
      textAreaEl()!.selectionEnd,
      "end"
    );
    setMessage(textAreaEl()!.value);
    if (!shiftDown) setShowEmojiPicker(false);
  };

  const onGifPicked = (gif: TenorImage) => {
    if (!textAreaEl()) return;
    textAreaEl()!.focus();
    textAreaEl()!.setRangeText(
      `${gif.gifUrl} `,
      textAreaEl()!.selectionStart,
      textAreaEl()!.selectionEnd,
      "end"
    );
    setMessage(textAreaEl()!.value);
    setShowEmojiPicker(false);
  };

  const htmlEnabled = () => channelProperty()?.htmlEnabled ?? false;
  const toggleHtml = () => {
    channelProperties.update(params.channelId, "htmlEnabled", !htmlEnabled());
  };

  return (
    <div
      class={classNames(
        "messageArea",
        styles.messageArea,
        conditionalClass(editMessageId(), styles.editing)
      )}
    >
      <Show when={showEmojiPicker()}>
        <FloatingMessageEmojiPicker
          gifPicked={onGifPicked}
          tab={showGifPicker() ? "GIF" : "EMOJI"}
          close={() => {
            setShowEmojiPicker(false);
            setShowGifPicker(false);
          }}
          onClick={onEmojiPicked}
        />
      </Show>
      <div class={styles.floatingItems}>
        <Show when={channel()?.slowModeSeconds}>
          <SlowModeIndicator />
        </Show>
        <FloatingSuggestions textArea={textAreaEl()} />
        <Show when={channelProperty()?.attachment}>
          <FloatingAttachment />
        </Show>
        <Show when={editMessageId()}>
          <EditIndicator messageId={editMessageId()!} />
        </Show>
        <FloatingReply />
      </div>
      <TypingIndicator />
      <Show
        when={!getStorageBoolean(StorageKeys.DISABLED_ADVANCED_MARKUP, false)}
      >
        <AdvancedMarkupOptions
          zeroBottomBorderRadius
          hideEmojiPicker
          inputElement={textAreaEl()!}
          updateText={setMessage}
          showHtml
          toggleHtml={toggleHtml}
          htmlEnabled={htmlEnabled()}
          class={styles.advancedMarkupOptions}
        />
      </Show>
      <CustomTextArea
        ref={setTextAreaEl}
        placeholder={
          channel()?.name
            ? t("messageArea.messageBoxChannelPlaceholder", {
                channelName: channel()!.name,
                interpolation: { escapeValue: false }
              })
            : channel()?.recipient()?.username
              ? t("messageArea.messageBoxPlaceholder", {
                  username: channel()?.recipient()?.username,
                  interpolation: { escapeValue: false }
                })
              : ""
        }
        onkeydown={onKeyDown}
        onInput={onInput}
        value={message()}
        isEditing={!!editMessageId()}
        onSendClick={sendMessage}
        onCancelEditClick={cancelEdit}
        onEmojiPickerClick={() => {
          if (showGifPicker()) {
            setShowGifPicker(false);
            setShowEmojiPicker(true);
            return;
          }
          setShowGifPicker(false);
          setShowEmojiPicker(!showEmojiPicker());
        }}
        onGifPickerClick={() => {
          if (showEmojiPicker() && !showGifPicker()) {
            setShowGifPicker(true);
            setShowEmojiPicker(true);
            return;
          }
          setShowGifPicker(!showGifPicker());
          setShowEmojiPicker(!showEmojiPicker());
        }}
      />
      <BackToBottomButton scrollElement={props.mainPaneEl} />
    </div>
  );
}
interface CustomTextAreaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isEditing: boolean;
  onSendClick: () => void;
  onEmojiPickerClick: () => void;
  onGifPickerClick: () => void;
  onCancelEditClick: () => void;
}

function CustomTextArea(props: CustomTextAreaProps) {
  const [chatBarOptions] = useChatBarOptions();

  const store = useStore();
  let textAreaRef: HTMLTextAreaElement | undefined;
  const params = useParams<{ channelId: string; serverId?: string }>();

  const value = () => props.value as string;

  const [isFocused, setFocused] = createSignal(false);
  const [attachmentFileBrowserRef, setAttachmentFileBrowserRef] = createSignal<
    FileBrowserRef | undefined
  >(undefined);
  const { createPortal, openedPortals } = useCustomPortal();

  const onKeyDown = (event: KeyboardEvent) => {
    if (openedPortals().length) return;
    if (event.target instanceof Element) {
      if (event.target.tagName === "TEXTAREA") return;
      if (event.target.tagName === "INPUT") return;
    }
    if (event.ctrlKey && event.key.toLowerCase() !== "v") return;
    if (event.key.length !== 1) return;
    textAreaRef?.focus();
  };
  onMount(() => {
    document.addEventListener("keydown", onKeyDown);

    onCleanup(() => {
      setSendButtonRef(undefined);
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  const { channelProperties } = useStore();
  const pickedFile = () => channelProperties.get(params.channelId)?.attachment;

  const onFilePicked = async (test: FileList) => {
    const file = test.item(0) || undefined;
    channelProperties.setAttachment(params.channelId, file);
    textAreaRef?.focus();
  };

  const onCancelAttachmentClick = () => {
    channelProperties.setAttachment(params.channelId, undefined);
    textAreaRef?.focus();
  };

  const advancedMarkupShown = !getStorageBoolean(
    StorageKeys.DISABLED_ADVANCED_MARKUP,
    false
  );

  const reminders = createMemo(() => store.account.reminders(params.channelId));

  const showRemindersModal = () => {
    createPortal(
      (close) => <RemindersModal close={close} channelId={params.channelId} />,
      "reminders-modal"
    );
  };

  return (
    <div
      class={classNames(
        styles.textAreaContainer,
        conditionalClass(isFocused(), styles.focused),
        conditionalClass(advancedMarkupShown, styles.advancedMarkupShown)
      )}
    >
      <BeforeYouChatNotice
        channelId={params.channelId}
        textAreaEl={() => textAreaRef}
      />
      <Show when={!props.isEditing && !pickedFile()}>
        <FileBrowser
          ref={setAttachmentFileBrowserRef}
          accept="any"
          onChange={onFilePicked}
        />
        <Button
          type="hover_border"
          onClick={() => attachmentFileBrowserRef()?.open()}
          class={styles.inputButtons}
          iconName="attach_file"
          padding={[8, 8, 8, 8]}
          margin={3}
          iconSize={18}
        />
      </Show>
      <Show when={props.isEditing}>
        <Button
          type="hover_border"
          onClick={props.onCancelEditClick}
          class={styles.inputButtons}
          iconName="close"
          color="var(--alert-color)"
          padding={[8, 8, 8, 8]}
          margin={3}
          iconSize={18}
        />
      </Show>
      <Show when={pickedFile() && !props.isEditing}>
        <Button
          type="hover_border"
          onClick={onCancelAttachmentClick}
          class={styles.inputButtons}
          iconName="close"
          color="var(--alert-color)"
          padding={[8, 8, 8, 8]}
          margin={3}
          iconSize={18}
        />
      </Show>
      <textarea
        {...props}
        ref={textAreaRef}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={2000}
        class={styles.textArea}
      />
      <div class={styles.inputRightButtons}>
        <Show when={reminders().length}>
          <Button
            type="hover_border"
            class={classNames(styles.inputButtons, styles.reminderButton)}
            iconName="calendar_month"
            title={`Reminders (${reminders().length})`}
            padding={[8, 8, 8, 8]}
            onClick={showRemindersModal}
            margin={0}
            iconSize={18}
            customChildren={<div class={styles.reminderDot} />}
          />
        </Show>

        <Show
          when={
            !value().trim() &&
            !pickedFile() &&
            !props.isEditing &&
            chatBarOptions().includes("vm")
          }
        >
          <MicButton
            onBlob={(blob) => {
              const file = new File([blob], "voice.ogg", { type: "audio/ogg" });
              channelProperties.setAttachment(params.channelId, file);
            }}
          />
        </Show>
        <Show when={chatBarOptions().includes("gif")}>
          <Button
            type="hover_border"
            class={classNames(styles.inputButtons, "emojiPickerButton")}
            onClick={props.onGifPickerClick}
            iconName="gif"
            padding={[5, 5, 5, 5]}
            margin={0}
            iconSize={24}
          />
        </Show>
        <Show when={chatBarOptions().includes("emoji")}>
          <Button
            type="hover_border"
            class={classNames(styles.inputButtons, "emojiPickerButton")}
            onClick={props.onEmojiPickerClick}
            iconName="face"
            padding={[8, 8, 8, 8]}
            margin={0}
            iconSize={18}
          />
        </Show>
        <Show
          when={
            chatBarOptions().includes("send") &&
            (pickedFile() || value().trim())
          }
        >
          <Button
            class={styles.inputButtons}
            ref={setSendButtonRef}
            type="hover_border"
            onClick={props.onSendClick}
            iconName={props.isEditing ? "edit" : "send"}
            padding={[8, 15, 8, 15]}
            margin={0}
            iconSize={18}
          />
        </Show>
        <Show when={!value().trim() && props.isEditing}>
          <Button
            class={styles.inputButtons}
            type="hover_border"
            ref={setSendButtonRef}
            onClick={props.onSendClick}
            color="var(--alert-color)"
            iconName="delete"
            primary
            padding={[8, 15, 8, 15]}
            margin={0}
            iconSize={18}
          />
        </Show>
      </div>
    </div>
  );
}

const MicButton = (props: { onBlob?: (blob: Blob) => void }) => {
  const { isMobileAgent } = useWindowProperties();
  let timer: number | null = null;
  let recordStartAt = 0;
  let recordEndAt = 0;

  const [isRecording, setRecording] = createSignal(false);
  const { record, stop } = useMicRecorder();
  const [currentDuration, setDuration] = createSignal("0:00");
  const [cancelRecording, setCancelRecording] = createSignal(false);

  const onTouchMove = (event: TouchEvent) => {
    if (!isMobileAgent()) return;
    const myLocation = event.changedTouches[0];
    const realTarget = document.elementFromPoint(
      myLocation.clientX,
      myLocation.clientY
    );
    setCancelRecording(!realTarget?.closest(".voice-recorder-button"));
  };

  const onMicHold = async () => {
    if (isRecording()) return;
    recordStartAt = Date.now();

    setRecording(true);
    const micPerms = await navigator.permissions.query({ name: "microphone" });
    if (micPerms.state === "denied") {
      toast("Unable to record audio.");
      return;
    }
    const blob = await record().catch((e) => {
      console.error(e);
      toast("Unable to record audio.");
    });
    if (!blob) return;

    const durationMs = recordEndAt - recordStartAt;
    if (durationMs < 400) return;
    if (cancelRecording()) return;

    props.onBlob?.(blob);

    setRecording(false);
    setCancelRecording(false);
  };

  const onMicRelease = () => {
    if (!isRecording()) return;

    setTimeout(() => {
      recordEndAt = Date.now();
      stop();
      setRecording(false);
    }, 200);
  };

  onMount(() => {
    document.addEventListener("pointerup", onMicRelease);

    onCleanup(() => {
      document.removeEventListener("pointerup", onMicRelease);
    });
  });

  createEffect(
    on(isRecording, () => {
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
    })
  );

  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "4px",
        "align-self": "end"
      }}
    >
      <Show when={isRecording()}>
        <div style={{ "font-size": "12px" }}>{currentDuration()}</div>
      </Show>
      <Button
        type="hover_border"
        styles={{ "touch-action": "none", "user-select": "none" }}
        class={classNames(styles.inputButtons, "voice-recorder-button")}
        onPointerDown={onMicHold}
        onTouchMove={onTouchMove}
        onContextMenu={(e) => e.preventDefault()}
        onPointerEnter={() => !isMobileAgent() && setCancelRecording(false)}
        onPointerLeave={() => !isMobileAgent() && setCancelRecording(true)}
        iconName={cancelRecording() && isRecording() ? "delete" : "mic"}
        padding={[8, 8, 8, 8]}
        margin={0}
        iconSize={18}
        primary={isRecording()}
        color={
          cancelRecording() && isRecording() ? "var(--alert-color)" : undefined
        }
      />
    </div>
  );
};

function msToTime(duration: number): string {
  let seconds: number | string = Math.floor((duration / 1000) % 60),
    minutes: number | string = Math.floor((duration / (1000 * 60)) % 60),
    hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24);

  seconds = seconds < 10 ? "0" + seconds : seconds;

  return (hours !== 0 ? hours + ":" : "") + minutes + ":" + seconds;
}

interface TypingPayload {
  userId: string;
  channelId: string;
}
function TypingIndicator() {
  const params = useParams<{ channelId: string; serverId: string }>();
  const { users, serverMembers, friends } = useStore();
  const { paneWidth } = useWindowProperties();

  const [typingUserIds, setTypingUserIds] = createStore<
    Record<string, number | undefined>
  >({});

  const onTyping = (event: TypingPayload) => {
    if (event.channelId !== params.channelId) return;
    if (typingUserIds[event.userId]) {
      clearTimeout(typingUserIds[event.userId]);
    }
    const timeoutId = window.setTimeout(
      () => setTypingUserIds(event.userId, undefined),
      5000
    );
    setTypingUserIds(event.userId, timeoutId);
  };

  const onMessageCreated = (event: { message: RawMessage }) => {
    if (event.message.channelId !== params.channelId) return;
    const timeoutId = typingUserIds[event.message.createdBy.id];
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTypingUserIds(event.message.createdBy.id, undefined);
    }
  };

  const onMessageUpdated = (evt: any) =>
    onMessageCreated({ message: evt.updated });

  createEffect(
    on(
      () => params.channelId,
      () => {
        Object.values(typingUserIds).forEach((timeoutId) =>
          clearTimeout(timeoutId)
        );
        setTypingUserIds(reconcile({}));
      }
    )
  );

  onMount(() => {
    socketClient.socket.on(ServerEvents.CHANNEL_TYPING, onTyping);
    socketClient.socket.on(ServerEvents.MESSAGE_CREATED, onMessageCreated);
    socketClient.socket.on(ServerEvents.MESSAGE_UPDATED, onMessageUpdated);

    onCleanup(() => {
      socketClient.socket.off(ServerEvents.CHANNEL_TYPING, onTyping);
      socketClient.socket.off(ServerEvents.MESSAGE_CREATED, onMessageCreated);
      socketClient.socket.off(ServerEvents.MESSAGE_UPDATED, onMessageUpdated);
    });
  });

  const typingUsers = createMemo(() =>
    Object.keys(typingUserIds)
      .filter((id) => !friends.hasBeenBlockedByMe(id))
      .map((userId) => users.get(userId)!)
  );

  const typingUserDisplayNames = createMemo(() => {
    return typingUsers().map((user) => {
      if (params.serverId) {
        const member = serverMembers.get(params.serverId, user.id);
        return member?.nickname || user.username;
      }
      return user.username;
    });
  });

  return (
    <Floating
      class={styles.floatingTypingContainer}
      style={{
        visibility: typingUsers().length ? "visible" : "hidden",

        padding: "0px",
        "padding-left": "5px",
        "padding-right": "5px",
        "z-index": "1"
      }}
    >
      <Text
        color="var(--typing-indicator-secondary-color)"
        size={paneWidth()! < 500 ? 10 : 12}
        class={styles.typingText}
      >
        <Switch>
          <Match when={typingUserDisplayNames().length === 1}>
            <UnescapedTrans
              key="typing.single"
              options={{ username: typingUserDisplayNames()[0] }}
            >
              <strong class={styles.username}>{"username"}</strong> is typing...
            </UnescapedTrans>
          </Match>
          <Match when={typingUserDisplayNames().length === 2}>
            <UnescapedTrans
              key="typing.multiple"
              options={{
                username: typingUserDisplayNames()[0],
                username2: typingUserDisplayNames()[1]
              }}
            >
              <strong class={styles.username} />a
              <strong class={styles.username} /> at
            </UnescapedTrans>
          </Match>
          <Match when={typingUserDisplayNames().length === 3}>
            <UnescapedTrans
              key="typing.tripple"
              options={{
                username: typingUserDisplayNames()[0],
                username2: typingUserDisplayNames()[1],
                username3: typingUserDisplayNames()[2]
              }}
            >
              <strong class={styles.username} />,
              <strong class={styles.username} />, a
              <strong class={styles.username} /> at
            </UnescapedTrans>
          </Match>
          <Match when={typingUserDisplayNames().length > 3}>
            <UnescapedTrans
              key="typing.andOthers"
              options={{
                count: typingUserDisplayNames().length
              }}
            >
              <strong class={styles.username} />
              at
            </UnescapedTrans>
          </Match>
        </Switch>
      </Text>
    </Floating>
  );
}

function SlowModeIndicator() {
  const params = useParams<{ channelId: string; serverId: string }>();
  const { channels, account, channelProperties, serverMembers } = useStore();
  const channel = () => channels.get(params.channelId);
  const properties = () => channelProperties.get(params.channelId);
  const slowDownProperties = () => properties()?.slowDownMode;

  const isAdmin = () => {
    if (!channel()?.serverId) return;
    const member = serverMembers.get(channel()?.serverId!, account.user()?.id!);
    return (
      member && serverMembers.hasPermission(member, ROLE_PERMISSIONS.ADMIN)
    );
  };

  const [currentSlowModeMs, setCurrentSlowModeMs] = createSignal(0);

  const toMs = () => channel()?.slowModeSeconds! * 1000;
  const toReadable = () => formatMillisRemainingNarrow(toMs());

  const readableRemainingMs = () => formatMillisRemainingNarrow(currentSlowModeMs());

  createEffect(() => {
    if (!slowDownProperties() || isAdmin()) {
      channelProperties.updateSlowDownMode(params.channelId, undefined);
      setCurrentSlowModeMs(0);
      return;
    }

    const intervalId = setInterval(() => {
      updateRemaining(intervalId);
    }, 1000);
    updateRemaining(intervalId);

    onCleanup(() => clearTimeout(intervalId));
  });

  const updateRemaining = (intervalId: NodeJS.Timeout) => {
    const now = Date.now();
    const ttl = slowDownProperties()?.ttl!;
    const startedAt = slowDownProperties()?.startedAt!;

    const diff = now - startedAt;

    const remainingMs = ttl - diff;

    if (remainingMs < 0) {
      channelProperties.updateSlowDownMode(params.channelId, undefined);
      setCurrentSlowModeMs(0);
      clearInterval(intervalId);
      return;
    }
    setCurrentSlowModeMs(remainingMs);
  };

  return (
    <Floating class={styles.floatingSlowModeIndicator}>
      <Icon
        name="schedule"
        size={14}
        color={
          currentSlowModeMs() ? "var(--alert-color)" : "var(--primary-color)"
        }
      />
      <Text
        opacity={0.8}
        size={10}
        title={toReadable()}
        style={{ "font-variant-numeric": "tabular-nums" }}
      >
        {t("messageView.slowMode")}
        {" " + (currentSlowModeMs() ? `(${readableRemainingMs()})` : "")}
      </Text>
    </Floating>
  );
}

function FloatingMessageEmojiPicker(props: {
  close: () => void;
  onClick: (shortcode: string) => void;
  gifPicked: (gif: TenorImage) => void;
  tab?: "EMOJI" | "GIF";
}) {
  const [chatBarOptions] = useChatBarOptions();

  const showTabs = () => {
    const opts = chatBarOptions();
    if (opts.includes("gif") && opts.includes("emoji")) return false;
    return true;
  };

  return (
    <Floating class={styles.floatingMessageEmojiPicker}>
      <EmojiPicker
        showGifPicker={showTabs()}
        onClick={props.onClick}
        gifPicked={props.gifPicked}
        close={props.close}
        heightOffset={-60}
        tab={props.tab}
      />
    </Floating>
  );
}

const [globalMention, setGlobalMention] = useLocalStorage<boolean>(
  StorageKeys.MENTION_REPLIES,
  true
);

function FloatingReply() {
  const params = useParams<{ channelId: string }>();
  const { channelProperties } = useStore();

  const property = () => channelProperties.get(params.channelId);
  const messages = () => property()?.replyToMessages || [];

  createEffect(() => {
    const value = globalMention();
    if (property() && property()!.mentionReplies !== value) {
      channelProperties.toggleMentionReplies(params.channelId);
    }
  });

  const toggleMention = (value: boolean) => {
    setGlobalMention(value);
  };

  return (
    <Show when={messages().length}>
      <Floating class={styles.replyIndicator}>
        <div class={styles.replyIndicatorHeader}>
          <Text class={styles.replyIndicatorTitle} size={12} opacity={0.6}>
            {t("messageArea.replying", { count: messages().length })}
          </Text>
          <Checkbox
            checked={globalMention()}
            onChange={toggleMention}
            style={{ gap: "4px" }}
            boxStyles={{ "font-size": "8px", "border-radius": "4px" }}
            label={t("messageArea.mention")}
            labelSize={12}
          />
        </div>
        <For each={messages()}>
          {(message, i) => (
            <div
              class={styles.replyIndicatorInner}
              style={{
                "border-top": "solid 1px rgba(255, 255, 255, 0.1)"
              }}
            >
              <Icon
                name="reply"
                size={17}
                color="var(--primary-color)"
                class={styles.editIcon}
              />
              <Avatar size={16} user={message.createdBy} />
              <div class={styles.message}>{message.content}</div>
              <Button
                iconName="close"
                color="var(--alert-color)"
                onClick={() =>
                  channelProperties.removeReply(params.channelId, message.id)
                }
                padding={0}
                iconSize={16}
                margin={0}
              />
            </div>
          )}
        </For>
      </Floating>
    </Show>
  );
}

function EditIndicator(props: { messageId: string }) {
  const params = useParams<{ channelId: string }>();
  const { messages, channelProperties } = useStore();

  const message = () =>
    messages.get(params.channelId)?.find((m) => m.id === props.messageId);

  createEffect(() => {
    if (!message()) {
      channelProperties.setEditMessage(params.channelId, undefined);
    }
  });

  return (
    <Floating class={styles.editIndicator}>
      <Icon
        name="edit"
        size={17}
        color="var(--primary-color)"
        class={styles.editIcon}
      />
      <div class={styles.message}>{message()?.content}</div>
    </Floating>
  );
}

function FloatingAttachment(props: {}) {
  const params = useParams<{ channelId: string }>();
  const { createPortal } = useCustomPortal();
  const { channelProperties } = useStore();
  const [dataUrl, setDataUrl] = createSignal<string | undefined>(undefined);
  const { paneWidth } = useWindowProperties();

  const getAttachmentFile = () =>
    channelProperties.get(params.channelId)?.attachment;
  const isImage = () => getAttachmentFile()?.file.type.startsWith("image/");

  const isMoreThan12MB = () =>
    getAttachmentFile()!.file.size > 12 * 1024 * 1024;
  const isMoreThan50MB = () =>
    getAttachmentFile()!.file.size > 50 * 1024 * 1024;

  createEffect(async () => {
    const file = getAttachmentFile()?.file;
    if (!file) return;
    if (!isImage()) return;
    const getDataUrl = await fileToDataUrl(file);
    setDataUrl(getDataUrl);
  });

  const editDone = (file: File) => {
    channelProperties.setAttachment(params.channelId, file);
  };
  const showImageEditor = () => {
    createPortal((close) => (
      <PhotoEditor done={editDone} src={dataUrl()!} close={close} />
    ));
  };

  const uploadToOptions = () => {
    return [
      ...(isMoreThan50MB()
        ? []
        : [{ id: "nerimity_cdn", label: "Nerimity CDN" }]),
      { id: "google_drive", label: "Google Drive" }
    ] satisfies DropDownItem[];
  };

  const isMobileWidth = () => (paneWidth() || 0) <= 400;

  return (
    <Floating
      class={cn(styles.floatingAttachment, !!isMobileWidth() && styles.mobile)}
    >
      <div class={styles.attachmentContent}>
        <Show when={isImage() && !isMoreThan12MB()}>
          <div class={styles.attachmentImageContainer}>
            <img
              onClick={showImageEditor}
              class={styles.attachmentImage}
              src={dataUrl()}
              alt=""
            />
            <Button
              onClick={showImageEditor}
              class={styles.attachmentEditImageButton}
              margin={0}
              padding={6}
              iconSize={18}
              primary
              styles={{ "margin-left": "auto" }}
              iconName="brush"
            />
          </div>
        </Show>
        <div class={styles.attachmentInfo}>
          <div class={styles.attachmentFilename}>
            {getAttachmentFile()?.file.name}
          </div>
          <div class={styles.attachmentSize}>
            {prettyBytes(getAttachmentFile()!.file.size, 0)}
          </div>

          <DropDown
            class={styles.attachmentUploadToDropDown}
            title={t("messageArea.uploadTo")}
            onChange={(item) =>
              channelProperties.setAttachment(
                params.channelId,
                undefined,
                item.id
              )
            }
            items={uploadToOptions()}
            selectedId={getAttachmentFile()?.uploadTo}
          />
        </div>
      </div>
    </Floating>
  );
}

function Floating(props: {
  style?: JSX.CSSProperties;
  class?: string;
  children: JSX.Element;
  offset?: number;
  readjust?: boolean;
}) {
  let floatingEl: undefined | HTMLDivElement;
  const offset = props.offset !== undefined ? props.offset : 6;

  const readjust = () => {
    if (!props.readjust) return;
    if (!floatingEl) return;
    const height = floatingEl?.clientHeight;
    floatingEl.style.top = -height + offset + "px";
  };

  onMount(() => {
    const observer = new ResizeObserver(readjust);
    observer.observe(floatingEl!);
    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <div
      ref={floatingEl}
      style={props.style}
      class={classNames("floating", styles.floating, props.class)}
    >
      {props.children}
    </div>
  );
}

const emojiRegex = /:[\w+-]+:/g;
const channelMentionRegex = /#([^#]+)#/gu;
const userMentionRegex = /@([^@:]+):([a-zA-Z0-9]+)/gu;
const roleMentionRegex = /@([^#]+)@/gu;

function randomIndex(arrLength: number) {
  return Math.floor(Math.random() * arrLength);
}

export function formatMessage(
  message: string,
  serverId?: string,
  channelId?: string,
  isEditing?: boolean
): string {
  const isSomeoneMentioned =
    !isEditing && (message.includes("@someone") || false);

  const channels = useChannels();
  const serverMembers = useServerMembers();
  const account = useAccount();
  const servers = useServers();
  const roles = useServerRoles();
  const users = useUsers();

  const serverRoles = roles.getAllByServerId(serverId!);

  const serverChannels = channels.getChannelsByServerId(serverId!);
  const members = serverMembers.array(serverId!);
  let finalString = message;

  // replace emoji
  finalString = finalString.replace(emojiRegex, (val) => {
    const emojiName = val.substring(1, val.length - 1);
    const emojiUnicode = emojiShortcodeToUnicode(emojiName);
    if (emojiUnicode) return emojiUnicode;

    const customEmoji = servers.customEmojiNamesToEmoji()[emojiName];
    if (customEmoji)
      return `[${customEmoji.gif ? (customEmoji.webp ? "wace" : "ace") : "ce"}:${
        customEmoji.id
      }:${emojiName}]`;

    return val;
  });

  // DM Channel
  if (!serverId && channelId) {
    const channel = channels.get(channelId);
    const dmUsers = !channel
      ? []
      : ([channel?.recipient(), account.user()] as User[]);
    // replace user mentions
    finalString = finalString.replace(
      userMentionRegex,
      (match, username, tag) => {
        if (!dmUsers) return match;

        const user = dmUsers.find(
          (user) => user?.username === username && user?.tag === tag
        );
        if (!user) return match;
        return `[@:${user.id}]`;
      }
    );

    if (isSomeoneMentioned) {
      finalString = finalString.replaceAll(
        "@someone",
        () =>
          `[@:s] **${randomKaomoji()} (${
            dmUsers[randomIndex(dmUsers.length)]?.username
          })**`
      );
    }
  }
  // Server Channel
  if (serverId) {
    // replace user mentions
    finalString = finalString.replace(
      userMentionRegex,
      (match, username, tag) => {
        const member = members.find((member) => {
          const user = users.get(member?.userId!);
          return user && user.username === username && user.tag === tag;
        });
        if (!member) return match;
        const user = users.get(member.userId!);
        return `[@:${user?.id}]`;
      }
    );
    finalString = finalString.replace(roleMentionRegex, (match, group) => {
      const channel = serverRoles.find((c) => c!.name === group);
      if (!channel) return match;
      return `[r:${channel.id}]`;
    });
    // replace channel mentions
    finalString = finalString.replaceAll(
      channelMentionRegex,
      (match, group) => {
        const channel = serverChannels.find((c) => c!.name === group);
        if (!channel) return match;
        return `[#:${channel.id}]`;
      }
    );

    if (isSomeoneMentioned) {
      finalString = finalString.replaceAll("@someone", () => {
        const randomMember = members[randomIndex(members.length)];
        const user = users.get(randomMember?.userId!);
        return `[@:s] **${randomKaomoji()} (${user?.username})**`;
      });
    }
  }

  finalString = finalString.replaceAll("@everyone", "[@:e]");

  return finalString;
}

function BackToBottomButton(props: { scrollElement: HTMLDivElement }) {
  const { channelProperties, channels, messages } = useStore();
  const params = useParams<{ channelId: string }>();

  const properties = () => channelProperties.get(params.channelId);
  const scrolledUp = () =>
    !properties()?.isScrolledBottom || properties()?.moreBottomToLoad;

  const newMessages = createMemo(() =>
    channels.get(params.channelId)?.hasNotifications()
  );

  const onClick = async () => {
    if (properties()?.moreBottomToLoad) {
      await messages.fetchAndStoreMessages(params.channelId, true);
    }
    props.scrollElement.scrollTop = props.scrollElement.scrollHeight;
  };

  return (
    <Show when={scrolledUp()}>
      <div class={styles.backToBottom} onClick={onClick}>
        <Show when={newMessages()}>
          <Text class={styles.text} size={14}>
            {t("messageView.newMessages")}
          </Text>
        </Show>
        <Icon
          size={34}
          color={newMessages() ? "var(--alert-color)" : "var(--primary-color)"}
          name="keyboard_arrow_down"
        />
      </div>
    </Show>
  );
}

const normalizeText = (str?: string) => str?.normalize("NFKC") || "";

function FloatingSuggestions(props: { textArea?: HTMLTextAreaElement }) {
  const { channelProperties } = useStore();
  const params = useParams<{ serverId?: string; channelId: string }>();

  const [textBefore, setTextBefore] = createSignal("");
  const [isFocus, setIsFocus] = createSignal(false);

  const properties = () => channelProperties.get(params.channelId);

  const content = () => properties()?.content || "";
  const onFocus = () => setIsFocus(true);

  const onClick = (e: any) => {
    setIsFocus(
      e.target.closest("." + styles.textArea) ||
        e.target.closest(".clickableCommandSuggestionItem")
    );
  };

  const update = () => {
    if (props.textArea?.selectionStart !== props.textArea?.selectionEnd)
      return setIsFocus(false);
    setIsFocus(true);
    const textBefore = getTextBeforeCursor(props.textArea);
    setTextBefore(normalizeText(textBefore));
  };

  const onSelectionChange = () => {
    if (!isFocus()) return;
    update();
  };

  createEffect(() => {
    props.textArea?.addEventListener("focus", onFocus);
    document.addEventListener("click", onClick);
    document.addEventListener("selectionchange", onSelectionChange);
    onCleanup(() => {
      props.textArea?.removeEventListener("focus", onFocus);
      document.removeEventListener("click", onClick);
      document.removeEventListener("selectionchange", onSelectionChange);
    });
  });

  createEffect(on(content, update));

  const suggestChannels = () => textBefore().startsWith("#");
  const suggestUsers = () => textBefore().startsWith("@");
  const suggestEmojis = () =>
    textBefore().startsWith(":") && textBefore().length >= 3;

  const suggestCommands = () =>
    content().startsWith("/") || properties()?.selectedBotCommand;

  return (
    <>
      <Show when={isFocus()}>
        <Switch>
          <Match when={suggestChannels()}>
            <FloatingChannelSuggestions
              search={normalizeText(textBefore().substring(1))}
              textArea={props.textArea}
            />
          </Match>
          <Match when={suggestUsers()}>
            <FloatingUserSuggestions
              search={normalizeText(textBefore().substring(1))}
              textArea={props.textArea}
            />
          </Match>
          <Match when={suggestEmojis()}>
            <FloatingEmojiSuggestions
              search={normalizeText(textBefore().substring(1))}
              textArea={props.textArea}
            />
          </Match>
        </Switch>
      </Show>
      <Show when={suggestCommands() && !properties()?.editMessageId}>
        <FloatingCommandSuggestions
          focused={isFocus()}
          search={normalizeText(content().substring(1).split(" ")[0] || "")}
          textArea={props.textArea}
          content={normalizeText(content())}
        />
      </Show>
    </>
  );
}

function FloatingChannelSuggestions(props: {
  search: string;
  textArea?: HTMLTextAreaElement;
}) {
  const params = useParams<{ serverId?: string; channelId: string }>();
  const { channels } = useStore();

  const serverChannels = createMemo(
    () =>
      channels
        .getChannelsByServerId(params.serverId!, true)
        .filter((c) => c?.type !== ChannelType.CATEGORY) as Channel[]
  );

  const searchedChannels = () =>
    matchSorter(serverChannels(), normalizeText(props.search), {
      keys: [(c) => normalizeText(c.name)]
    }).slice(0, 10);

  createEffect(on(searchedChannels, () => setCurrent(0)));

  const onChannelClick = (channel: Channel) => {
    if (!props.textArea) return;
    appendText(
      params.channelId,
      props.textArea,
      props.search,
      normalizeText(channel.name) + "# "
    );
  };

  const onEnterClick = (i: number) => onChannelClick(searchedChannels()[i]);

  const [current, , , setCurrent] = useSelectedSuggestion(
    () => searchedChannels().length,
    () => props.textArea!,
    onEnterClick,
    sendButtonRef
  );

  return (
    <Show when={params.serverId && searchedChannels().length}>
      <Floating class={styles.floatingSuggestion}>
        <For each={searchedChannels()}>
          {(channel, i) => (
            <ChannelSuggestionItem
              onHover={() => setCurrent(i())}
              selected={current() === i()}
              onclick={onChannelClick}
              channel={channel}
            />
          )}
        </For>
      </Floating>
    </Show>
  );
}

function ChannelSuggestionItem(props: {
  onHover: () => void;
  selected: boolean;
  channel: Channel;
  onclick(channel: Channel): void;
}) {
  const isPrivateChannel = () =>
    !props.channel.hasPermission(CHANNEL_PERMISSIONS.PUBLIC_CHANNEL, true);

  return (
    <ItemContainer
      selected={props.selected}
      onmousemove={props.onHover}
      onclick={() => props.onclick(props.channel)}
      class={styles.suggestionItem}
    >
      <ChannelIcon
        icon={props.channel.icon}
        type={props.channel.type}
        hovered={props.selected}
      />
      <Show when={isPrivateChannel()}>
        <Icon name="lock" size={14} style={{ opacity: 0.3 }} />
      </Show>
      <div class={styles.suggestLabel}>{props.channel.name}</div>
      <Show when={props.selected}>
        <Icon class={styles.suggestIcon} name="keyboard_return" />
      </Show>
    </ItemContainer>
  );
}

function FloatingUserSuggestions(props: {
  search: string;
  textArea?: HTMLTextAreaElement;
}) {
  const params = useParams<{ serverId?: string; channelId: string }>();
  const { serverMembers, channels, account, serverRoles, servers, users } =
    useStore();

  const server = createMemo(() => servers.get(params.serverId!));

  const members = () => serverMembers.array(params.serverId!);
  const roles = () =>
    serverRoles
      .getAllByServerId(params.serverId!)
      .filter((r) => r.id !== server()?.defaultRoleId);

  const hasPermissionToMentionEveryone = () => {
    if (!params.serverId) return false;
    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return (
      member &&
      serverMembers.hasPermission(member, ROLE_PERMISSIONS.MENTION_EVERYONE)
    );
  };

  const hasPermissionToMentionRoles = () => {
    if (!params.serverId) return false;
    const member = serverMembers.get(params.serverId, account.user()?.id!);
    return (
      member &&
      serverMembers.hasPermission(member, ROLE_PERMISSIONS.MENTION_ROLES)
    );
  };

  const searchedServerUsers = () =>
    matchSorter(
      [
        ...members(),
        ...(hasPermissionToMentionRoles() ? roles() : []),
        ...(hasPermissionToMentionEveryone()
          ? [
              {
                user: () => ({
                  special: true,
                  id: "e",
                  username: "everyone"
                })
              }
            ]
          : []),
        {
          user: () => ({
            special: true,
            id: "s",
            username: "someone"
          })
        },
        {
          user: () => ({
            special: true,
            id: "si",
            username: "silent"
          })
        }
      ] as any[],
      normalizeText(props.search),
      {
        keys: [
          (e) => normalizeText(e.user?.()?.username),
          (e) => normalizeText(users.get(e.userId)?.username),
          (e) => normalizeText(e.nickname),
          (e) => normalizeText(e.name)
        ]
      }
    )
      .slice(0, 10)
      .sort((a, b) => {
        // move all special users to the bottom
        if (a.user?.().special && !b.user?.().special) return 1;
        if (!a.user?.().special && b.user?.().special) return -1;
        return 0;
      });

  const channel = () => channels.get(params.channelId);
  const DMUsers = () =>
    !channel() ? [] : ([channel()?.recipient(), account.user()] as User[]);
  const searchedDMUsers = () =>
    matchSorter(DMUsers(), normalizeText(props.search), {
      keys: [(u) => normalizeText(u.username)]
    }).slice(0, 10);

  const searched = () =>
    !params.serverId ? searchedDMUsers() : searchedServerUsers();

  const onUserClick = (user: User & { name?: string }) => {
    if (!props.textArea) return;
    if (!user.tag) {
      appendText(
        params.channelId,
        props.textArea,
        props.search,
        `${normalizeText(user.username || user.name)}${user.name ? "@" : ""} `
      );
      return;
    }
    appendText(
      params.channelId,
      props.textArea,
      props.search,
      `${normalizeText(user.username)}:${normalizeText(user.tag)} `
    );
  };

  const onEnterClick = (i: number) => {
    const member = searched()[i] as ServerMember;
    const user = member.user?.() || users.get(member?.userId!);
    onUserClick(user || searched()[i]);
  };

  const [current, , , setCurrent] = useSelectedSuggestion(
    () => searched().length,
    () => props.textArea!,
    onEnterClick,
    sendButtonRef
  );

  return (
    <Show when={searched().length}>
      <Floating class={styles.floatingSuggestion}>
        <For each={searched()}>
          {(member, i) => (
            <UserSuggestionItem
              onHover={() => setCurrent(i())}
              selected={current() === i()}
              nickname={normalizeText(member?.nickname)}
              user={member.user?.() || users.get(member?.userId!) || member}
              onclick={onUserClick}
            />
          )}
        </For>
      </Floating>
    </Show>
  );
}

function UserSuggestionItem(props: {
  nickname?: string;
  onHover: () => void;
  selected: boolean;
  user: User & { special?: boolean; name?: string };
  onclick(user: User): void;
}) {
  return (
    <ItemContainer
      onmousemove={props.onHover}
      selected={props.selected}
      class={styles.suggestionItem}
      onclick={() => props.onclick(props.user)}
      style={{ color: props.user.name ? props.user.hexColor : undefined }}
    >
      <Show
        when={props.user.username && !props.user?.special}
        fallback={<div>@</div>}
      >
        <Avatar user={props.user} animate={props.selected} size={15} />
      </Show>
      <div class={styles.suggestLabel}>
        {props.nickname || props.user.username || props.user.name}
      </div>
      <Show when={props.nickname}>
        <div class={styles.suggestionInfo}>{props.user.username}</div>
      </Show>
      <Show when={props.user?.special && props.user.id === "e"}>
        <div class={styles.suggestionInfo}>
          {t("messageArea.specialMentions.everyone")}
        </div>
      </Show>
      <Show when={props.user?.special && props.user.id === "s"}>
        <div class={styles.suggestionInfo}>
          {t("messageArea.specialMentions.someone")}
        </div>
      </Show>
      <Show when={props.user?.special && props.user.id === "si"}>
        <div class={styles.suggestionInfo}>
          {t("messageArea.specialMentions.silent")}
        </div>
      </Show>
      <Show when={!props.user?.special && props.selected}>
        <Icon class={styles.suggestIcon} name="keyboard_return" />
      </Show>
    </ItemContainer>
  );
}

type Emoji = (typeof EmojiType)[number];

function FloatingEmojiSuggestions(props: {
  search: string;
  textArea?: HTMLTextAreaElement;
}) {
  const params = useParams<{ channelId: string }>();
  const { servers } = useStore();
  onMount(() => {
    lazyLoadEmojis();
  });
  const allEmojis = createMemo(() => {
    const combined = [...emojis(), ...servers.emojisUpdatedDupName()];
    return combined;
  });
  const searchedEmojis = () =>
    matchSorter(allEmojis(), normalizeText(props.search), {
      keys: ["short_names.*", "name"],
      baseSort: (a, b) => {
        const recentlyUsed: string[] = JSON.parse(
          localStorage["nerimity-solid-emoji-pane"] || "[]"
        );

        const getName = (e: any): string => {
          if (e.item.name) return e.item.name;
          if (
            Array.isArray(e.item.short_names) &&
            e.item.short_names.length > 0
          ) {
            return e.item.short_names[0];
          }
          return "";
        };

        const nameA = getName(a);
        const nameB = getName(b);

        const recencyA = recentlyUsed.indexOf(nameA);
        const recencyB = recentlyUsed.indexOf(nameB);

        if (recencyA !== -1 || recencyB !== -1) {
          if (recencyA !== -1 && recencyB !== -1) return recencyA - recencyB;
          return recencyA !== -1 ? -1 : 1;
        }

        return nameA.localeCompare(nameB);
      }
    }).slice(0, 10);

  const onItemClick = (emoji: Emoji | RawCustomEmoji) => {
    if (!props.textArea) return;
    const name =
      (emoji as RawCustomEmoji).name || (emoji as Emoji).short_names[0];
    addToHistory(name, 20);
    appendText(
      params.channelId,
      props.textArea,
      props.search,
      normalizeText(name) + ": "
    );
  };

  const onEnterClick = (i: number) => onItemClick(searchedEmojis()[i]);

  const [current, , , setCurrent] = useSelectedSuggestion(
    () => searchedEmojis().length,
    () => props.textArea!,
    onEnterClick,
    sendButtonRef
  );

  return (
    <Show when={searchedEmojis().length}>
      <Floating class={styles.floatingSuggestion}>
        <For each={searchedEmojis()}>
          {(emoji, i) => (
            <EmojiSuggestionItem
              onHover={() => setCurrent(i())}
              selected={current() === i()}
              emoji={emoji}
              onclick={onItemClick}
            />
          )}
        </For>
      </Floating>
    </Show>
  );
}

function FloatingCommandSuggestions(props: {
  search: string;
  textArea?: HTMLTextAreaElement;
  content: string;
  focused: boolean;
}) {
  const params = useParams<{ channelId: string; serverId?: string }>();
  const { servers, serverMembers, channelProperties, account } = useStore();

  const server = () => servers.get(params.serverId!);

  const channelProperty = () => channelProperties.get(params.channelId);
  const selectedBotCommand = () => channelProperty()?.selectedBotCommand;
  const member = () => serverMembers.get(params.serverId!, account.user()?.id!);

  createEffect(() => {
    if (!params.serverId || !server()) return;
    servers.fetchAndStoreServerBotCommands(params.serverId);
  });

  createEffect(
    on([() => props.search, () => props.content], (now, prev) => {
      if (!selectedBotCommand()) return;
      if (props.content.length < `/${selectedBotCommand()!.name} `.length) {
        setTimeout(() => {
          channelProperties.updateSelectedBotCommand(
            params.channelId,
            undefined
          );
        });
      }
      if (prev?.[0] === undefined) return;
      if (now?.[0] === prev?.[0]) return;
      setTimeout(() => {
        channelProperties.updateSelectedBotCommand(params.channelId, undefined);
      });
    })
  );

  const commands = () => {
    const cmds = server()?.botCommands || [];
    if (props.content !== `/${props.search}`) return [];

    const availableCmds = cmds.filter((cmd) => {
      const bot = serverMembers.get(params.serverId!, cmd.botUserId);
      if (!bot) return false;
      if (cmd.permissions === null) return true;

      return (
        member() &&
        serverMembers.hasPermission(member()!, { bit: cmd.permissions })
      );
    });

    return availableCmds;
  };

  const searched = () =>
    matchSorter(commands(), props.search, {
      keys: ["name"]
    }).slice(0, 8);

  createEffect(
    on(searched, () => {
      setCurrent(0);
    })
  );

  const onItemClick = (cmd: RawBotCommand) => {
    if (!props.textArea) return;
    props.textArea.focus();

    setTimeout(() => {
      channelProperties.updateSelectedBotCommand(params.channelId, cmd);
    });

    channelProperties.updateContent(params.channelId, `/${cmd.name} `);
  };

  const onEnterClick = (i: number) => {
    onItemClick(searched()[i]!);
  };

  const [current, , , setCurrent] = useSelectedSuggestion(
    () => searched().length,
    () => props.textArea!,
    onEnterClick,
    sendButtonRef
  );

  const onInput = (event: InputEvent) => {
    const exactMatch = searched().find((cmd) => cmd.name === props.search);
    if (exactMatch && searched().length && event.data === " ") {
      event.stopPropagation();
      event.preventDefault();
      onItemClick(searched()[0]!);
    }
  };

  createEffect(() => {
    props.textArea?.addEventListener("input", onInput as () => void);
    onCleanup(() => {
      props.textArea?.removeEventListener("input", onInput as () => void);
    });
  });

  return (
    <>
      <Show when={selectedBotCommand()}>
        <Floating class={styles.floatingSuggestion}>
          <CommandSuggestionItem
            selected={false}
            onHover={() => {}}
            onclick={() => {}}
            cmd={selectedBotCommand()!}
          />
        </Floating>
      </Show>

      <Show when={props.focused && searched().length}>
        <Floating class={styles.floatingSuggestion}>
          <For each={searched()}>
            {(cmd, i) => (
              <CommandSuggestionItem
                class="clickableCommandSuggestionItem"
                selected={current() === i()}
                onHover={() => setCurrent(i())}
                cmd={cmd}
                onclick={onItemClick}
              />
            )}
          </For>
        </Floating>
      </Show>
    </>
  );
}

function CommandSuggestionItem(props: {
  onHover: () => void;
  selected: boolean;
  cmd: RawBotCommand;
  onclick(cmd: RawBotCommand): void;
  class?: string;
}) {
  const { users } = useStore();
  const user = () => users.get(props.cmd.botUserId);
  return (
    <ItemContainer
      onmousemove={props.onHover}
      selected={props.selected}
      class={cn(
        styles.suggestionItem,
        styles.commandSuggestionItem,
        props.class
      )}
      onclick={() => props.onclick(props.cmd)}
    >
      <Avatar size={32} user={user()!} />
      <div class={styles.suggestContent}>
        <div class={styles.suggestHeader}>
          <div class={styles.suggestLabel}>/{props.cmd.name}</div>
          <div class={styles.suggestArgs}>{props.cmd.args}</div>
        </div>
        <div class={styles.suggestDescription}>{props.cmd.description}</div>
      </div>
      <Show when={props.selected}>
        <Icon class={styles.suggestIcon} name="keyboard_return" />
      </Show>
    </ItemContainer>
  );
}

function EmojiSuggestionItem(props: {
  onHover: () => void;
  selected: boolean;
  emoji: Emoji | RawCustomEmoji;
  onclick(emoji: Emoji): void;
}) {
  const name = () =>
    (props.emoji as RawCustomEmoji).name ||
    (props.emoji as Emoji).short_names[0];
  const url = () => {
    if ((props.emoji as RawCustomEmoji).id) {
      const emoji = props.emoji as RawCustomEmoji;
      const extName = emoji.gif ? ".gif" : ".webp";
      return `${env.NERIMITY_CDN}emojis/${emoji.id}${extName}`;
    }
    return unicodeToTwemojiUrl((props.emoji as Emoji).emoji);
  };
  return (
    <ItemContainer
      onmousemove={props.onHover}
      selected={props.selected}
      class={styles.suggestionItem}
      onclick={() => props.onclick(props.emoji)}
    >
      <Emoji
        class={css`
          height: 20px;
          width: 20px;
          object-fit: contain;
        `}
        name={name()}
        url={url()}
        resize={96}
        custom={props.emoji.id}
      />
      <div class={styles.suggestLabel}>{name()}</div>
      <Show when={props.selected}>
        <Icon class={styles.suggestIcon} name="keyboard_return" />
      </Show>
    </ItemContainer>
  );
}

function getTextBeforeCursor(element?: HTMLTextAreaElement) {
  if (!element) return "";
  const cursorPosition = element.selectionStart;
  const textBeforeCursor = element.value.substring(0, cursorPosition);
  const lastWord = textBeforeCursor.split(/\s+/).reverse()[0];
  return lastWord;
}

function appendText(
  channelId: string,
  textArea: HTMLTextAreaElement,
  query: string,
  name: string
) {
  const channelProperties = useChannelProperties();
  const content = channelProperties.get(channelId)?.content || "";

  const cursorPosition = textArea.selectionStart!;
  const removeCurrentQuery = removeByIndex(
    content,
    cursorPosition - query.length,
    query.length
  );
  const result =
    removeCurrentQuery.slice(0, cursorPosition - query.length) +
    name +
    removeCurrentQuery.slice(cursorPosition - query.length);

  channelProperties.updateContent(channelId, result);

  textArea.focus();
  textArea.selectionStart = cursorPosition + (name.length - query.length);
  textArea.selectionEnd = cursorPosition + (name.length - query.length);
}

function removeByIndex(val: string, index: number, remove: number) {
  return val.substring(0, index) + val.substring(index + remove);
}

const GoogleDriveLinkModal = (props: { close: () => void }) => {
  const navigate = useNavigate();
  const actionButtons = (
    <FlexRow style={{ width: "100%" }}>
      <Button
        styles={{ flex: 1 }}
        iconName="close"
        label={t("messageArea.linkToGoogleDrive.cancelButton")}
        color="var(--alert-color)"
        onClick={props.close}
      />
      <Button
        styles={{ flex: 1 }}
        label={t("messageArea.linkToGoogleDrive.linkButton")}
        iconName="link"
        primary
        onClick={() => {
          navigate("/app/settings/connections");
          props.close();
        }}
      />
    </FlexRow>
  );
  return (
    <LegacyModal
      title="Google Drive"
      icon="link"
      actionButtons={actionButtons}
      ignoreBackgroundClick
      close={props.close}
      maxWidth={300}
    >
      <Text size={14} style={{ padding: "10px", "padding-top": 0 }}>
        {t("messageArea.linkToGoogleDrive.body")}
      </Text>
    </LegacyModal>
  );
};

function BeforeYouChatNotice(props: {
  channelId: string;
  textAreaEl(): HTMLInputElement | undefined;
}) {
  const { notice, setNotice, hasAlreadySeenNotice, updateLastSeen } = useNotice(
    () => props.channelId
  );
  const [textAreaFocus, setTextAreaFocus] = createSignal(false);
  const { isMobileWidth } = useWindowProperties();
  const [buttonClickable, setButtonClickable] = createSignal(false);

  const { openedPortals } = useCustomPortal();

  const showNotice = () => notice() && !hasAlreadySeenNotice();

  const onDocClick = (e: MouseEvent) => {
    if (e.target instanceof Element) {
      if (e.target.closest(".messageArea")) return;
      setTextAreaFocus(false);
    }
  };

  const onInput = (event: Event) => {
    if (openedPortals().length) return;
    if (event.target instanceof Element) {
      event.preventDefault();
      event.stopPropagation();
      setTextAreaFocus(true);
    }
  };
  createEffect(
    on([textAreaFocus, showNotice], () => {
      setButtonClickable(false);
      if (showNotice() && textAreaFocus()) {
        setTimeout(() => {
          setButtonClickable(true);
        }, 1000);
      }
    })
  );

  createEffect(
    on(showNotice, (show) => {
      show && document.addEventListener("keypress", onInput);
      show && document.addEventListener("click", onDocClick);
      onCleanup(() => {
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keypress", onInput);
      });
    })
  );

  const understoodClick = () => {
    if (!buttonClickable()) return;
    updateLastSeen();
    setNotice(null);
    props.textAreaEl()?.focus();
  };

  return (
    <>
      <Show when={showNotice()}>
        <div
          class={styles.disableChatArea}
          onClick={() => setTextAreaFocus(true)}
          style={{ cursor: textAreaFocus() ? "not-allowed" : "initial" }}
        />
      </Show>
      <Show when={showNotice() && textAreaFocus()}>
        <div
          class={classNames(
            styles.beforeYouChatNotice,
            conditionalClass(isMobileWidth(), styles.mobile)
          )}
        >
          <div class={styles.title}>
            <Icon name="info" color="var(--primary-color)" size={18} />
            {t("messageArea.channelNotice.title")}
          </div>
          <div class={styles.info}>
            <Markup inline text={notice()!.content} />
          </div>
          <Button
            styles={{ opacity: buttonClickable() ? 1 : 0.5 }}
            label={t("settings.account.understoodButton")}
            iconName="check"
            onClick={understoodClick}
            class={styles.noticeButton}
            primary
          />
        </div>
      </Show>
    </>
  );
}

function ScheduledDelete() {
  const params = useParams<{ serverId?: string }>();
  const store = useStore();
  const server = () => store.servers.get(params.serverId!);
  const isCreator = () => server()?.isCurrentUserCreator();
  const { createPortal } = useCustomPortal();

  const onLeaveClick = () => {
    if (isCreator()) {
      createPortal((close) => (
        <ServerDeleteConfirmModal server={server()!} close={close} />
      ));
      return;
    }
    server()?.leave();
  };

  return (
    <div class={styles.scheduledDeleteContainer}>
      <div class={styles.scheduledDeleteTitle}>
        {t("messageView.flaggedServer.title")}
      </div>
      <div class={styles.scheduledDeleteDesc}>
        {t("messageView.flaggedServer.description")}
      </div>
      <Button
        onclick={onLeaveClick}
        iconName={isCreator() ? "delete" : "logout"}
        label={
          isCreator()
            ? t("messageView.flaggedServer.deleteButton")
            : t("messageView.flaggedServer.leaveButton")
        }
        color="var(--alert-color)"
        primary
      />
    </div>
  );
}

function DropOverlay() {
  return (
    <div class={styles.dropOverlayContainer}>
      <div class={styles.dropOverlayInnerContainer}>
        <Icon name="place_item" color="var(--primary-color)" size={40} />
        <div>{t("messageArea.dropFile")}</div>
      </div>
    </div>
  );
}
