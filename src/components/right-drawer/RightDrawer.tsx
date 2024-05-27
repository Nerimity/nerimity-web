import styles from "./styles.module.scss";
import Avatar from "@/components/ui/Avatar";
import UserPresence from "@/components/user-presence/UserPresence";
import {useParams} from "solid-navigator";
import useStore from "@/chat-api/store/useStore";
import {createEffect, createMemo, createSignal, For, JSX, mapArray, on, onCleanup, onMount, Show} from "solid-js";
import {ServerMember} from "@/chat-api/store/useServerMembers";
import MemberContextMenu from "../member-context-menu/MemberContextMenu";
import {DrawerHeader} from "@/components/drawer-header/DrawerHeader";
import {useCustomPortal} from "@/components/ui/custom-portal/CustomPortal";
import {css} from "solid-styled-components";
import {bannerUrl} from "@/chat-api/store/useUsers";
import Text from "@/components/ui/Text";
import Icon from "@/components/ui/icon/Icon";
import Button from "@/components/ui/Button";
import {Banner} from "@/components/ui/Banner";
import {fetchChannelAttachments} from "@/chat-api/services/MessageService";
import {RawAttachment, RawMessage} from "@/chat-api/RawData";
import env from "@/common/env";
import {classNames, conditionalClass} from "@/common/classNames";
import socketClient from "@/chat-api/socketClient";
import {ServerEvents} from "@/chat-api/EventNames";
import { emitScrollToMessage } from "@/common/GlobalEvents";
import { Skeleton } from "../ui/skeleton/Skeleton";
import { ProfileFlyout } from "../floating-profile/FloatingProfile";
import { Delay } from "@/common/Delay";
import { getCachedNotice } from "@/common/useChannelNotice";
import { Emoji } from "../ui/Emoji";
import { Markup } from "../Markup";

const MemberItem = (props: { member: ServerMember }) => {
  const params = useParams<{ serverId: string }>();
  const user = () => props.member.user();
  let elementRef: undefined | HTMLDivElement;
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>(undefined);
  const [hovering, setHovering] = createSignal(false);
  const { createPortal, isPortalOpened } = useCustomPortal();

  const isProfileFlyoutOpened = () => {
    return isPortalOpened("profile-pane-flyout-" + user().id);
  };


  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  const onClick = (e: MouseEvent) => {
    const rect = elementRef?.getBoundingClientRect()!;
    return createPortal(close => <ProfileFlyout triggerEl={e.target as HTMLElement} position={{ left: rect.left, top: rect.top }} serverId={params.serverId} close={close} userId={user().id} />, "profile-pane-flyout-" + user().id, true);
  };

  return (
    <div class="trigger-profile-flyout" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} >
      <MemberContextMenu position={contextPosition()} serverId={props.member.serverId} userId={props.member.userId} onClose={() => setContextPosition(undefined)} />
      <div onClick={onClick} ref={elementRef} class={styles.memberItem} onContextMenu={onContextMenu} >
        <Avatar resize={96} animate={hovering() || !!isProfileFlyoutOpened()} size={30} user={user()} />
        <div class={styles.memberInfo}>
          <div class={styles.username} style={{ color: props.member.roleColor() }} >{user().username}</div>
          <UserPresence animate={hovering() || !!isProfileFlyoutOpened()} userId={user().id} showOffline={false} />
        </div>
      </div>
    </div>
  );
};


const Header = () => {

  return (<DrawerHeader text={"Information"} />);
};


const RightDrawer = () => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const [showAttachments, setShowAttachments] = createSignal(false);

  createEffect(on(() => params.channelId, () => {
    setShowAttachments(false);
  }));

  return (
    <div class={styles.drawerContainer}>
      <Header />
      <Show when={!showAttachments()}><MainDrawer onShowAttachmentClick={() => setShowAttachments(true)} /></Show>
      <Show when={showAttachments()}><AttachmentDrawer onHideAttachmentClick={() => setShowAttachments(false)} /></Show>
    </div>
  );
};



const AttachmentDrawer = (props: { onHideAttachmentClick(): void }) => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const { channels } = useStore();

  const [attachments, setAttachments] = createSignal<RawAttachment[] | null>(null);

  const incrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 0);
    channel?.update({ _count: { attachments: count + 1 } });
  };
  const decrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 1);
    channel?.update({ _count: { attachments: count - 1 } });
  };

  onMount(async () => {
    const newAttachments = await fetchChannelAttachments(params.channelId!);
    setAttachments(newAttachments);
  });

  const onMessage = (payload: { message: RawMessage }) => {
    if (!attachments()) return;
    if (payload.message.channelId !== params.channelId) return;
    const attachment = payload?.message.attachments?.[0];
    if (!attachment) return;
    setAttachments([
      { ...attachment, messageId: payload.message.id },
      ...attachments()!
    ]);
    incrAttachments(params.channelId);
  };
  socketClient.useSocketOn(ServerEvents.MESSAGE_CREATED, onMessage);

  const onDelete = (payload: { messageId: string, channelId: string }) => {
    if (!attachments()) return;
    if (payload.channelId !== params.channelId) return;
    setAttachments(attachments()!.filter(attachment => attachment.messageId !== payload.messageId));
    decrAttachments(params.channelId);
  };
  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete);

  return (
    <>
      <Button
        label="Back"
        iconName='navigate_before'
        iconSize={16}
        onClick={props.onHideAttachmentClick}
        class={css`justify-content: start;`}
        padding={5} />



      <div class={styles.attachmentList}>

        <Show when={!attachments()}>
          <For each={Array(50).fill(undefined)}>
            {() => (
              <Skeleton.Item width='100%' style={{"aspect-ratio": "1/1"}} />
            )}
          </For>
        </Show>
        <Show when={attachments()}>
          <For each={attachments()}>
            {item => (
              <AttachmentImage attachment={item} />
            )}
          </For>
        </Show>
      </div>
    </>
  );
};

const AttachmentImage = (props: { attachment: RawAttachment }) => {

  const isFile = () => props.attachment.fileId;
  const isGif = () => props.attachment.path?.endsWith(".gif");

  const url = (ignoreFocus?: boolean) => {
    let url = `${env.NERIMITY_CDN}${props.attachment.path}`;
    if (ignoreFocus) return url;
    if (isGif()) return url += "?type=webp";
    return url;
  };

  const onClicked = () => {
    if (!props.attachment.messageId) return;
    emitScrollToMessage({
      messageId: props.attachment.messageId
    });
  };

  return (
    <div class={classNames(styles.attachmentImageContainer, conditionalClass(isGif(), styles.gif))}>
      
      <div class={styles.attachmentHover} onClick={onClicked}>
        <Icon name='visibility' color='var(--primary-color)' />
      </div>
      
      <Show when={!isFile()}>
        <img class={styles.attachmentImage}
          loading="lazy"
          src={url()}
        />
      </Show>
      <Show when={isFile()}>
        <div class={styles.fileAttachment}>
          <Icon name='insert_drive_file' color='var(--primary-color)' size={40} />
        </div>
      </Show>
    </div>
  );
};



const MainDrawer = (props: { onShowAttachmentClick(): void }) => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const { channels } = useStore();


  const channel = () => channels.get(params.channelId!);

  const incrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 0);
    channel?.update({ _count: { attachments: count + 1 } });
  };

  const decrAttachments = (channelId: string) => {
    const channel = channels.get(channelId);

    const count = (channel?._count?.attachments || 1);
    channel?.update({ _count: { attachments: count - 1 } });
  };

  const onMessage = (payload: { message: RawMessage }) => {
    const attachment = payload?.message.attachments?.[0];
    if (!attachment) return;
    incrAttachments(payload.message.channelId);
  };
  socketClient.useSocketOn(ServerEvents.MESSAGE_CREATED, onMessage);

  const onDelete = (payload: { messageId: string, channelId: string }) => {
    decrAttachments(payload.channelId);
  };
  socketClient.useSocketOn(ServerEvents.MESSAGE_DELETED, onDelete);


  const cachedNotice = () => params.channelId ? getCachedNotice(() => params.channelId!) : undefined;

  return <>
    <Show when={channel()?.serverId}><BannerItem /></Show>
    <Show when={channel()?.serverId}>
      <ServerChannelNotice/>
    </Show>
    <Show when={channel()?.recipientId}>
      <ProfileFlyout channelNotice={cachedNotice()?.content} dmPane userId={channel()?.recipientId!} />
    </Show>
    <Show when={channel()}>
      <Button
        label="Attachments"
        customChildren={
          <>
            <div class={styles.attachmentCount}>{channel()?._count?.attachments?.toLocaleString?.() ?? "..."}</div>
            <Icon size={16} color="var(--primary-color)" name='navigate_next' />
          </>
        }
        iconName='attach_file'
        iconSize={16}
        onClick={props.onShowAttachmentClick}
        class={css`justify-content: start;`}
        
        padding={5} />
    </Show>
    <Show when={params.serverId}><ServerDrawer /></Show>
  </>;
};


const BannerItem = () => {
  const params = useParams<{ serverId?: string; channelId?: string; }>();
  const { servers, channels } = useStore();

  const server = () => servers.get(params.serverId!);

  const channel = () => channels.get(params.channelId!)?.recipient();

  const bannerData = () => server() || channel() as { hexColor: string, banner?: string; };

  return (
    <Show when={bannerData()?.banner}>
      <Banner class={css`margin-left: 5px; margin-right: 5px;`} margin={0} brightness={100} hexColor={bannerData()?.hexColor} url={bannerUrl(bannerData()!)} />
    </Show>
  );
};


const ServerDrawer = () => {
  const params = useParams();
  const { servers, serverMembers, serverRoles } = useStore();
  const server = () => servers.get(params.serverId!);

  const roles = () => serverRoles.getAllByServerId(params.serverId);

  const members = () => serverMembers.array(params.serverId);

  const roleMembers = mapArray(roles, role => {

    const membersInThisRole = () => members().filter(member => {
      if (!member?.user()) return false;
      if (!member?.user().presence()?.status) return false;
      if (server()?.defaultRoleId === role!.id && !member?.unhiddenRole()) return true;
      if (member?.unhiddenRole()?.id === role!.id) return true;
    });

    return { role, members: createMemo(() => membersInThisRole()) };
  });

  const offlineMembers = createMemo(() => members().filter(member => !member?.user().presence()?.status));
  const defaultRole = () => serverRoles.get(server()?.id!, server()?.defaultRoleId!);
  return (
    <Show when={server()?.id} keyed={true}>
      <Delay ms={10}>
        <>
          <div style={{ "margin-left": "8px", display: "flex" }}>
            <Text size={14}>Members</Text>
            <div class={styles.memberCount}>{members().length.toLocaleString()}</div>
          </div>
          <div class={styles.roleContainer}>
            <For each={roleMembers()}>
              {(item) => (
                <Show when={!item.role!.hideRole && item.members().length}>
                  <RoleItem members={item.members().sort((a, b) => a?.user().username.localeCompare(b?.user().username))} roleName={item.role?.name!} roleIcon={item.role?.icon!} />
                </Show>
              )}
            </For>

            {/* Offline */}
            <RoleItem members={offlineMembers().sort((a, b) => a?.user().username.localeCompare(b?.user().username))} roleName="Offline" roleIcon={defaultRole()?.icon} />
          </div>
        </>
      </Delay>

    </Show>
  );
};

function RoleItem(props: { roleName: string, members: ServerMember[], roleIcon?: string }) {
  const [expanded, setExpanded] = createSignal(props.members.length <= 20);
  const [hovered, setHovered] = createSignal(false);
  return (
    <div class={styles.roleItem} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div class={styles.roleTitle} onClick={() => setExpanded(!expanded())}>
        <div class={styles.roleName}> <Show when={props.roleIcon}><Emoji hovered={hovered()} size={16} resize={16} icon={props.roleIcon} /></Show> {props.roleName}</div>
        <div class={styles.roleCount}>{props.members.length.toLocaleString()}</div>
        <Button class={styles.roleExpandButton} padding={5} margin={0} iconName={expanded() ? "expand_more" : "expand_less"} iconSize={12} />
      </div>
      <Show when={expanded()}>
        <For each={props.members}>
          {member => <MemberItem member={member!} />}
        </For>
      </Show>
    </div>
  );
}



const ServerChannelNotice = () => {
  const params = useParams<{ channelId: string }>();

  const cachedNotice = () => getCachedNotice(() => params.channelId);

  return (
    <Show when={cachedNotice()}>
      <div class={styles.channelNotice}>
        <div class={styles.channelNoticeHeader}>
          <Icon color='var(--primary-color)' name="info" size={14} />
          <Text size={13}>Channel Notice</Text>
        </div>
        <div class={styles.channelNoticeContent}><Markup inline text={cachedNotice()!.content} /></div>
      </div>
    </Show>
  );
};

export default RightDrawer;


