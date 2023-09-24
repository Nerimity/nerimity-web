import styles from './styles.module.scss';
import { classNames, conditionalClass } from '@/common/classNames';
import { formatTimestamp } from '@/common/date';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/icon/Icon';
import { MessageType, RawMessage, RawMessageReaction, RawUser } from '@/chat-api/RawData';
import { Message, MessageSentStatus } from '@/chat-api/store/useMessages';
import { addMessageReaction, deleteMessage, fetchMessageReactedUsers, removeMessageReaction } from '@/chat-api/services/MessageService';
import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useNavigate, useParams } from '@solidjs/router';
import useStore from '@/chat-api/store/useStore';
import { createEffect, createSignal, For, Match, on, onCleanup, onMount, Show, Switch } from 'solid-js';
import { Markup } from '@/components/Markup';
import Modal from '@/components/ui/Modal';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import Button from '@/components/ui/Button';
import { ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import { ImageEmbed, ImagePreviewModal } from '@/components/ui/ImageEmbed';
import { CustomLink } from '@/components/ui/CustomLink';
import { MentionUser } from '@/components/markup/MentionUser';
import { Emoji } from '@/components/markup/Emoji';
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from '@/emoji';
import { FloatingEmojiPicker } from '@/components/ui/EmojiPicker';
import env from '@/common/env';
import { useWindowProperties } from '@/common/useWindowProperties';
import { DangerousLinkModal } from '@/components/ui/DangerousLinkModal';
import { useResizeObserver } from '@/common/useResizeObserver';
import { ServerWithMemberCount, joinPublicServer, joinServerByInviteCode, serverDetailsByInviteCode } from '@/chat-api/services/ServerService';
import { ServerVerifiedIcon } from '@/components/servers/ServerVerifiedIcon';


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
  textAreaEl?: HTMLTextAreaElement;
  contextMenu?: (event: MouseEvent) => void;
  userContextMenu?: (event: MouseEvent) => void
  reactionPickerClick?: (event: MouseEvent) => void
  quoteClick?: () => void
}

const MessageItem = (props: MessageItemProps) => {

  const params = useParams();
  const { serverMembers, servers, account } = useStore();
  const [hovered, setHovered] = createSignal(false);
  const serverMember = () => params.serverId ? serverMembers.get(params.serverId, props.message.createdBy.id) : undefined;

  const isServerCreator = () => params.serverId ? servers.get(params.serverId)?.createdById === props.message.createdBy.id : undefined;

  

  const Details = () => (
    <div class={classNames(styles.details)}>

      <CustomLink decoration onContextMenu={props.userContextMenu} class={styles.username} href={RouterEndpoints.PROFILE(props.message.createdBy.id)} style={{ color: serverMember()?.roleColor }}>
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

  const [isMentioned, setIsMentioned] = createSignal(false);

  createEffect(on([() => props.message.mentions?.length, () => props.message.quotedMessages.length], () => {
    setTimeout(() => {
      const isQuoted = props.message.quotedMessages?.find(m => m.createdBy?.id === account.user()?.id);
      const isMentioned = props.message.mentions?.find(u => u.id === account.user()?.id);
      setIsMentioned(!!isQuoted || !!isMentioned);
    });
  }))

  return (
    <div
      class={
        classNames(
          styles.messageItem, 
          conditionalClass(isCompact(), styles.compact), 
          conditionalClass(isMentioned(), styles.mentioned), 
          props.class, 
          "messageItem"
        )}
      onContextMenu={props.contextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      id={`message-${props.message.id}`}
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
            <Show when={props.message.uploadingAttachment}>
              <UploadAttachment message={props.message} />
            </Show>
            <Show when={props.message.reactions?.length}><Reactions textAreaEl={props.textAreaEl} reactionPickerClick={props.reactionPickerClick} hovered={hovered()} message={props.message} /></Show>
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
      <Show when={!props.message.uploadingAttachment || props.message.content?.trim()}>
        <SentStatus message={props.message} />
      </Show>
      <Embeds {...props} />
    </div>
  )
}


const UploadAttachment = (props: { message: Message }) => {
  const attachment = () => props.message.uploadingAttachment!;
  return (
    <div class={styles.uploadProgress}>
      <div class={styles.name}>{attachment().file.name}</div>
      <div class={styles.size}>{prettyBytes(attachment().file.size, 0)}</div>
      <div class={styles.progressBarContainer}>
        <div class={styles.currentProgress} style={{width: attachment().progress + "%"}}></div>
      </div>
    </div>
  )
}

const prettyBytes = (num: number, precision = 3, addSpace = true) => {
  const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  if (Math.abs(num) < 1) return num + (addSpace ? ' ' : '')
  const exponent = Math.min(Math.floor(Math.log10(num) / Math.log10(1024)), UNITS.length - 1);
  const n = Number(((num < 0 ? -1 : 1) * num) / Math.pow(1024, exponent));
  return (num < 0 ? '-' : '') + n.toFixed(precision) + ' ' + UNITS[exponent];
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
      case MessageType.CALL_STARTED:
        return { icon: "call", color: 'var(--success-color)', message: "started a call." }
      default:
        return undefined;
    }
  }

  return (
    <Show when={systemMessage()}>
      <div class={styles.systemMessage}>
        <div class={styles.iconContainer}><Icon name={systemMessage()?.icon} color={systemMessage()?.color} /></div>
        <div class="markup"><MentionUser user={props.message.createdBy} /></div>
        <span>
          <span>{systemMessage()?.message}</span>
          <span class={styles.date}>{formatTimestamp(props.message.createdAt)}</span>
        </span>
      </div>
    </Show>
  )
}

export default MessageItem;



const inviteLinkRegex = new RegExp(
  `${env.APP_URL}/i/([\\S]+)`
);

function Embeds(props: { message: Message, hovered: boolean }) {
  
  const inviteEmbedCode = () => props.message.content?.match(inviteLinkRegex)?.[1];
  

  return (
    <div class={styles.embeds}>
      <Show when={inviteEmbedCode()}>
        {code => <ServerInviteEmbed code={code()} />}
      </Show>
      <Show when={props.message.attachments?.[0]}>
        <ImageEmbed attachment={props.message.attachments?.[0]!} widthOffset={-70} />
      </Show>
      <Show when={props.message.embed}>
        <OGEmbed message={props.message} />
      </Show>
    </div>
  )
}



const inviteCache = new Map<string, ServerWithMemberCount | false>();


function ServerInviteEmbed(props: { code: string }) {
  const navigate = useNavigate();
  const {servers} = useStore();
  const [invite, setInvite] = createSignal<ServerWithMemberCount | null | false>(null);
  const [joining, setJoining] = createSignal(false);
  
  onMount(async () => {
    if (inviteCache.has(props.code)) return setInvite(inviteCache.get(props.code)!);
    const invite = await serverDetailsByInviteCode(props.code).catch(() => {});
    setInvite(invite || false);
    inviteCache.set(props.code, invite || false);
  })

  const cachedServer = () => {
    const _invite = invite();
    if (!_invite) return;
    return servers.get(_invite.id);
  }

  createEffect(() => {
    if (joining() && cachedServer()) {
      navigate(RouterEndpoints.SERVER_MESSAGES(cachedServer()!.id, cachedServer()!.defaultChannelId));
    }
  })

  const joinOrVisitServer = () => {
    const _invite = invite();
    if (!_invite) return;
    if (cachedServer()) return navigate(RouterEndpoints.SERVER_MESSAGES(_invite.id, _invite.defaultChannelId));

    if (joining()) return;
    setJoining(true);

    joinServerByInviteCode(props.code).catch((err) => {
      alert(err.message)
    }).finally(() => setJoining(false))
  }


  return (
    <div class={styles.serverInviteEmbed}>
      <Show when={invite()} fallback={<div class={styles.serverInviteLoading}><Show when={invite() === false}><Icon name='error' color='var(--alert-color)' /></Show>{invite() === false ? "Invalid Invite Code" : "Loading Invite..."}</div>}>
        {invite => (
        <>
         <Avatar server={invite()} size={40} />
         <div class={styles.serverInfo}>
          <div class={styles.serverName}>
            <span class={styles.serverNameOnly}>{invite()?.name}</span>
            <Show when={invite().verified}><ServerVerifiedIcon /></Show>
          </div>
          
          <div class={styles.serverMemberCount}>
            <Icon name='people' size={14} color='var(--primary-color)' />
            {invite().memberCount} member(s)
          </div>
         </div>
         <Button label={joining() ? 'Joining...' : cachedServer() ? 'Visit' : 'Join'} iconName='login' onClick={joinOrVisitServer} />
         </>
        )}
      </Show>
    </div>
  )
}


function OGEmbed(props: { message: RawMessage }) {
  const { hasFocus } = useWindowProperties();

  const embed = () => props.message.embed!;
  const { createPortal } = useCustomPortal();

  const onLinkClick = (e: MouseEvent) => {
    e.preventDefault();
    createPortal(close => <DangerousLinkModal unsafeUrl={embed().url} close={close} />)
  }

  const imageUrl = () => `${env.NERIMITY_CDN}proxy/${encodeURIComponent(embed().imageUrl!)}/embed.${embed().imageMime?.split("/")[1]}`;
  const isGif = () => imageUrl().endsWith(".gif")

  const url = (ignoreFocus?: boolean) => {
    let url = new URL(imageUrl());
    if (ignoreFocus) return url.href;
    if (!isGif()) return url.href;
    if (!hasFocus()) {
      url.searchParams.set("type", "webp")
    }
    return url.href;
  }
  const onImageClick = () => {
    createPortal(close => <ImagePreviewModal close={close} url={url(true)} />)
  }


  return (
    <Switch fallback={
      <div class={styles.ogEmbedContainer}>
        <Show when={embed().imageUrl}>
          <img onClick={onImageClick} src={url()} class={styles.ogEmbedImage} loading='lazy' />
        </Show>
        <div>
          <CustomLink decoration class={styles.ogEmbedTitle} href={embed().url || "#"} onclick={onLinkClick} target="_blank" rel="noopener noreferrer">{embed().title}</CustomLink>

          <div class={styles.ogEmbedDescription}>{embed().description}</div>
        </div>
      </div>
    }>
      <Match when={embed().type === "image"}>
        <ImageEmbed
          attachment={{
            id: "",
            path: `proxy/${encodeURIComponent(embed().imageUrl!)}/embed.${embed().imageMime?.split("/")[1]}`,
            width: embed().imageWidth,
            height: embed().imageHeight
          }}
          widthOffset={-70}
        />
      </Match>
    </Switch>
  )
}


interface ReactionItemProps {
  textAreaEl?: HTMLTextAreaElement;
  reaction: RawMessageReaction,
  message: Message,
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event?: MouseEvent) => void;
}


function ReactionItem(props: ReactionItemProps) {
  const { hasFocus } = useWindowProperties();


  let isHovering = false;

  const onMouseEnter = (e: any) => {
    isHovering = true;
    props.onMouseEnter?.(e)
  }
  
  const onMouseLeave = (e: any) => {
    isHovering = false;
    props.onMouseLeave?.(e);
  }
  onCleanup(() => {
    if (isHovering) props.onMouseLeave?.();
  })

  const name = () => props.reaction.emojiId ? props.reaction.name : emojiUnicodeToShortcode(props.reaction.name)

  const url = () => {
    if (!props.reaction.emojiId) return unicodeToTwemojiUrl(props.reaction.name);
    return `${env.NERIMITY_CDN}/emojis/${props.reaction.emojiId}.${props.reaction.gif ? 'gif' : 'webp'}${props.reaction.gif ? (!hasFocus() ? '?type=webp' : '') : ''}`;
  }

  const addReaction = () => {
    props.textAreaEl?.focus();
    if (props.reaction.reacted) {
      removeMessageReaction({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId,
      })
      return;
    }
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      margin={0}
      padding={[2, 8, 2, 2]}
      customChildrenLeft={
        <Emoji class={styles.emoji} name={name()} url={url()} />
      }
      onClick={addReaction}
      class={classNames(styles.reactionItem, conditionalClass(props.reaction.reacted, styles.reacted))}
      label={props.reaction.count.toLocaleString()}
      textSize={12}
      color={!props.reaction.reacted ? 'white' : undefined}
    />
  )
}

function AddNewReactionButton(props: { show?: boolean; onClick?(event: MouseEvent): void }) {
  const { isMobileAgent } = useWindowProperties();
  const show = () => {
    if (isMobileAgent()) return true;
    if (props.show) return true;
  }
  return (
    <Button onClick={props.onClick} margin={0} padding={6} class={styles.reactionItem} styles={{ visibility: show() ? 'visible' : 'hidden' }} iconName='add' iconSize={15} />
  )
}


function Reactions(props: { hovered: boolean, textAreaEl?: HTMLTextAreaElement; message: Message, reactionPickerClick?(event: MouseEvent): void }) {
  const { createPortal, closePortalById } = useCustomPortal();

  const onHover = (event: MouseEvent, reaction: RawMessageReaction) => {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    createPortal(() => (<WhoReactedModal {...{ x: rect.x + (rect.width/2) , y: rect.y, reaction, message: props.message }} />), "whoReactedModal")
  }
  const onBlur = () => {
    closePortalById("whoReactedModal")
  }

  return (
    <div class={styles.reactions}>
      <For each={props.message.reactions}>
        {reaction => <ReactionItem onMouseEnter={e => onHover(e, reaction)} onMouseLeave={onBlur} textAreaEl={props.textAreaEl} message={props.message} reaction={reaction} />}
      </For>
      <AddNewReactionButton show={props.hovered} onClick={props.reactionPickerClick} />
    </div>
  )
}


function WhoReactedModal(props: { x: number, y: number; reaction: RawMessageReaction, message: Message }) {
  const [users, setUsers] = createSignal<null | RawUser[]>(null);
  const [el, setEL] = createSignal<undefined | HTMLDivElement>(undefined);
  const {width, height} = useResizeObserver(el)


  onMount(() => {
    const timeoutId = window.setTimeout(async () => {
      const newUsers = await fetchMessageReactedUsers({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId,
      })
      setUsers(newUsers)
    }, 500)

    onCleanup(() => {
      clearTimeout(timeoutId);
    })
  })

  const style = () => {
    if (!height()) return {pointerEvents: 'none'};
    return {top: (props.y - height() - 5) + "px", left: (props.x - width() /2) + "px"};
  }

  const reactionCount = props.reaction.count;

  const plusCount = () =>  reactionCount - users()?.length!;

  return (
    <Show when={users()}>
      <div ref={setEL} class={styles.whoReactedModal} style={style()}>
        <For each={users()!}>
          {user => (
            <div class={styles.whoReactedItem}>
              <Avatar size={15} user={user} />
              <div>{user.username}</div>
            </div>
          )}
        </For>
        <Show when={plusCount()}><div class={styles.whoReactedPlusCount}>+{plusCount()}</div></Show>
      </div>
    </Show>
  )
}








const DeleteMessageModalContainer = styled(FlexColumn)`
  overflow: auto;
  padding: 10px;
`;
const deleteMessageItemContainerStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;
  background-color: rgba(0,0,0,0.3);
  &&{
    &:hover {
      background-color: rgba(0,0,0,0.3);
    }
  }
`

const deleteMessageModalStyles = css`
  max-height: 800px;
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
    <Modal close={props.close} title='Delete Message?' icon='delete' class={deleteMessageModalStyles} actionButtons={ActionButtons} maxWidth={500}>
      <DeleteMessageModalContainer>
        <Text>Are you sure you would like to delete this message?</Text>
        <MessageItem class={deleteMessageItemContainerStyles} hideFloating message={props.message} />
      </DeleteMessageModalContainer>
    </Modal>
  )
}