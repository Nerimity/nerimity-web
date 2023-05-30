import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import { formatTimestamp } from '@/common/date';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/icon/Icon';
import { MessageType, RawMessage, RawMessageReaction } from '@/chat-api/RawData';
import { Message, MessageSentStatus } from '@/chat-api/store/useMessages';
import { addMessageReaction, deleteMessage } from '@/chat-api/services/MessageService';
import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { createEffect, createSignal, For, Match, on, Show, Switch } from 'solid-js';
import { Markup } from '@/components/Markup';
import Modal from '@/components/ui/Modal';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import Button from '@/components/ui/Button';
import { ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import { ImageEmbed } from '@/components/ui/ImageEmbed';
import { CustomLink } from '@/components/ui/CustomLink';
import { MentionUser } from '@/components/markup/MentionUser';
import { Emoji } from '@/components/markup/Emoji';
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from '@/emoji';
import { FloatingEmojiPicker } from '@/components/ui/EmojiPicker';
import env from '@/common/env';
import { useWindowProperties } from '@/common/useWindowProperties';


interface FloatingOptionsProps {
  message: RawMessage,
  isCompact?: boolean | number,
  showContextMenu?: (event: MouseEvent) => void,
  quoteClick?(): void;
  reactionPickerClick?(event: MouseEvent): void
}


function FloatOptions(props: FloatingOptionsProps) {
  const params = useParams<{ serverId: string }>();
  const { account, serverMembers } = useStore();
  const { createPortal } = useCustomPortal();

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
    return member?.hasPermission?.(ROLE_PERMISSIONS.MANAGE_CHANNELS);
  }

  const isContentType = () => props.message.type === MessageType.CONTENT;


  return (
    <div class={styles.floatOptions}>
      {props.isCompact && (<div class={styles.floatDate}>{formatTimestamp(props.message.createdAt)}</div>)}
      <Show when={isContentType()}><div class={styles.item} onclick={props.reactionPickerClick}><Icon size={18} name='face' class={styles.icon} /></div></Show>
      <Show when={isContentType()}><div class={styles.item} onclick={props.quoteClick}><Icon size={18} name='format_quote' class={styles.icon} /></div></Show>
      <Show when={showEdit()}><div class={styles.item} onclick={onEditClick}><Icon size={18} name='edit' class={styles.icon} /></div></Show>
      <Show when={showDelete()}><div class={styles.item} onClick={onDeleteClick}><Icon size={18} name='delete' class={styles.icon} color='var(--alert-color)' /></div></Show>
      <div class={classNames("floatingShowMore", styles.item)} onClick={props.showContextMenu}><Icon size={18} name='more_vert' class={styles.icon} /></div>
    </div>
  )
}

interface MessageItemProps {
  class?: string;
  message: Message;
  beforeMessage?: Message;
  animate?: boolean;
  hideFloating?: boolean;
  messagePaneEl?: HTMLDivElement;
  contextMenu?: (event: MouseEvent) => void;
  userContextMenu?: (event: MouseEvent) => void
  reactionPickerClick?: (event: MouseEvent) => void
  quoteClick?: () => void
}

const MessageItem = (props: MessageItemProps) => {

  const params = useParams();
  const { serverMembers, servers } = useStore();
  const [hovered, setHovered] = createSignal(false);
  const serverMember = () => params.serverId ? serverMembers.get(params.serverId, props.message.createdBy.id) : undefined;

  const isServerCreator = () => params.serverId ? servers.get(params.serverId)?.createdById === props.message.createdBy.id : undefined;

  createEffect(on(() => props.message.attachments, () => {
    if (!props.messagePaneEl) return;
    props.messagePaneEl.scrollTop = props.messagePaneEl.scrollHeight;
  }, { defer: true }))

  const Details = () => (
    <div class={classNames(styles.details)}>

      <CustomLink decoration onContextMenu={props.userContextMenu} class={styles.username} href={RouterEndpoints.PROFILE(props.message.createdBy.id)} style={{ color: serverMember()?.roleColor() }}>
        {props.message.createdBy.username}
      </CustomLink>
      <Show when={isSystemMessage()}><SystemMessage message={props.message} /></Show>
      <Show when={isServerCreator()}>
        <div class={styles.ownerBadge}>Owner</div>
      </Show>
      <div class={styles.date}>{formatTimestamp(props.message.createdAt)}</div>
    </div>
  )

  const currentTime = props.message?.createdAt;
  const beforeMessageTime = () => props.beforeMessage?.createdAt!

  const isSameCreator = () => props.beforeMessage && props.beforeMessage?.createdBy?.id === props.message?.createdBy?.id;
  const isDateUnderFiveMinutes = () => beforeMessageTime() && (currentTime - beforeMessageTime()) < 300000;
  const isBeforeMessageContent = () => props.beforeMessage && props.beforeMessage.type === MessageType.CONTENT;


  const isCompact = () => isSameCreator() && isDateUnderFiveMinutes() && isBeforeMessageContent();
  const isSystemMessage = () => props.message.type !== MessageType.CONTENT;




  return (
    <div
      class={classNames(styles.messageItem, conditionalClass(isCompact(), styles.compact), props.class, "messageItem")}
      onContextMenu={props.contextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Show when={!props.hideFloating}><FloatOptions reactionPickerClick={props.reactionPickerClick} quoteClick={props.quoteClick} showContextMenu={props.contextMenu} isCompact={isCompact()} message={props.message} /></Show>
      <Switch>
        <Match when={isSystemMessage()}>
          <SystemMessage message={props.message} />
        </Match>
        <Match when={!isSystemMessage()}>
          <Show when={!isCompact()}>
            <Link onContextMenu={props.userContextMenu} href={RouterEndpoints.PROFILE(props.message.createdBy.id)} class={styles.avatar}>
              <Avatar animate={hovered()} user={props.message.createdBy} size={40} />
            </Link>
          </Show>
          <div class={styles.messageInner}>
            <Show when={!isCompact()}><Details /></Show>
            <Content message={props.message} hovered={hovered()} />
            <Show when={props.message.reactions?.length}><Reactions reactionPickerClick={props.reactionPickerClick} hovered={hovered()} message={props.message} /></Show>
          </div>
        </Match>
      </Switch>
    </div>
  );
};



const Content = (props: { message: Message, hovered: boolean }) => {
  return (
    <div class={styles.content}>
      <Markup message={props.message} text={props.message.content || ''} />
      <Show when={props.message.uploadingAttachment}>
        Uploading {props.message.uploadingAttachment?.name}
      </Show>
      <SentStatus message={props.message} />
      <Embeds {...props} />
    </div>
  )
}


const SentStatus = (props: { message: Message }) => {

  const editedAt = () => {
    if (!props.message.editedAt) return;
    return "Edited at " + formatTimestamp(props.message.editedAt);
  }

  return (
    <Switch>
      <Match when={props.message.sentStatus === MessageSentStatus.FAILED}>
        <div class={styles.sentStatus}>
          <Icon class={styles.icon} name='error_outline' size={14} color="var(--alert-color)" />
        </div>
      </Match>
      <Match when={props.message.sentStatus === MessageSentStatus.SENDING}>
        <div class={styles.sentStatus}>
          <Icon class={styles.icon} name='query_builder' size={14} color="rgba(255,255,255,0.4)" />
        </div>
      </Match>
      <Match when={editedAt()}>
        <div class={styles.sentStatus}>
          <Icon class={styles.icon} name='edit' size={14} color="rgba(255,255,255,0.4)" title={editedAt()} />
        </div>
      </Match>
    </Switch>
  )
}


const SystemMessage = (props: { message: Message }) => {
  const systemMessage = () => {
    switch (props.message.type) {
      case MessageType.JOIN_SERVER:
        return { icon: "login", color: 'var(--primary-color)', message: "has joined the server." }
      case MessageType.LEAVE_SERVER:
        return { icon: "logout", color: 'var(--alert-color)', message: "has left the server." }
      case MessageType.KICK_USER:
        return { icon: "logout", color: 'var(--alert-color)', message: "has been kicked." }
      case MessageType.BAN_USER:
        return { icon: "block", color: 'var(--alert-color)', message: "has been banned." }
      default:
        return undefined;
    }
  }

  return (
    <Show when={systemMessage()}>
      <div class={styles.systemMessage}>
        <div class={styles.iconContainer}><Icon name={systemMessage()?.icon} color={systemMessage()?.color} /></div>
        <div class="markup"><MentionUser user={props.message.createdBy} /></div>
        {systemMessage()?.message}
      </div>
    </Show>
  )
}

export default MessageItem;



function Embeds(props: { message: Message, hovered: boolean }) {
  return (
    <div class={styles.embeds}>
      <Show when={props.message.attachments?.[0]}>
        <ImageEmbed attachment={props.message.attachments?.[0]!} widthOffset={-60} />
      </Show>
    </div>
  )
}




function ReactionItem(props: { reaction: RawMessageReaction, message: Message }) {
  const { hasFocus } = useWindowProperties();

  const name = () => props.reaction.emojiId ? props.reaction.name : emojiUnicodeToShortcode(props.reaction.name)

  const url = () => {
    if (!props.reaction.emojiId) return unicodeToTwemojiUrl(props.reaction.name);
    return `${env.NERIMITY_CDN}/emojis/${props.reaction.emojiId}.${props.reaction.gif ? 'gif' : 'webp'}${props.reaction.gif ? (!hasFocus() ? '?type=webp' : '') : ''}`;
  }

  const addReaction = () => {
    addMessageReaction({
      channelId: props.message.channelId,
      messageId: props.message.id,
      name: props.reaction.name,
      emojiId: props.reaction.emojiId,
      gif: props.reaction.gif
    })
  }

  return (
    <Button
      margin={0}
      padding={[2, 8, 2, 2]}
      customChildrenLeft={
        <Emoji class={styles.emoji} name={name()} url={url()} />
      }
      onClick={addReaction}
      class={styles.reactionItem}
      label={props.reaction.count.toLocaleString()}
      textSize={15}
      color={!props.reaction.reacted ? 'white' : undefined}
    />
  )
}

function AddNewReactionButton(props: { onClick?(event: MouseEvent): void }) {
  return (
    <Button onClick={props.onClick} margin={0} padding={5} class={styles.reactionItem} iconName='add' iconSize={15} />
  )
}


function Reactions(props: { hovered: boolean, message: Message, reactionPickerClick?(event: MouseEvent): void }) {
  return (
    <div class={styles.reactions}>
      <For each={props.message.reactions}>
        {reaction => <ReactionItem message={props.message} reaction={reaction} />}
      </For>
      <Show when={props.hovered}><AddNewReactionButton onClick={props.reactionPickerClick} /></Show>
    </div>
  )
}







const DeleteMessageModalContainer = styled(FlexColumn)`
  overflow: auto;
`;
const deleteMessageItemContainerStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;
  background-color: var(--pane-color);
  &&{
    &:hover {
      background-color: var(--pane-color);
    }

  }
`

const deleteMessageModalStyles = css`
  max-width: 600px;
  max-height: 600px;
  overflow: hidden;
`

export function DeleteMessageModal(props: { message: Message, close: () => void }) {

  const onDeleteClick = () => {
    props.close();
    deleteMessage({ channelId: props.message.channelId, messageId: props.message.id });
  }

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} iconName="close" label="Cancel" />
      <Button onClick={onDeleteClick} iconName="delete" color='var(--alert-color)' label="Delete" />
    </FlexRow>
  )

  return (
    <Modal close={props.close} title='Delete Message?' icon='delete' class={deleteMessageModalStyles} actionButtons={ActionButtons}>
      <DeleteMessageModalContainer>
        <Text>Are you sure you would like to delete this message?</Text>
        <MessageItem class={deleteMessageItemContainerStyles} hideFloating message={props.message} />
      </DeleteMessageModalContainer>
    </Modal>
  )
}