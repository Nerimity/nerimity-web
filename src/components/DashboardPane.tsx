import { RawPost } from "@/chat-api/RawData";
import { createPost, getPostNotificationCount, getPostNotificationDismiss, getPostNotifications, getPosts } from "@/chat-api/services/PostService";
import { Server } from "@/chat-api/store/useServers";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Link, useMatch } from "@nerimity/solid-router";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { css, styled } from "solid-styled-components"
import { Markup } from "./Markup";
import { PostNotificationsArea, PostsArea } from "./PostsArea";
import ContextMenuServer from "./servers/context-menu/ContextMenuServer";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Input from "./ui/input/Input";
import ItemContainer from "./ui/Item";
import Text from "./ui/Text";

const DashboardPaneContainer = styled(FlexColumn)`
  justify-content: center;
  align-items: center;
  padding: 5px;
`;

const DashboardPaneContent = styled(FlexColumn)`
  place-self: stretch;
  border-radius: 8px;
  flex: 1;
  margin: 30px;
  width: 100%;
  max-width: 900px;
  align-self: center;
`;

const ServerListContainer = styled(FlexRow)`
  overflow: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  padding-left: 6px;
  padding-right: 6px;
  border-radius: 8px;
  margin-left: 10px;
  margin-right: 10px;
`;

const SidebarItemContainer = styled(ItemContainer)`
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 50px;
`;


export default function DashboardPane() {
  const { header, account } = useStore();
  createEffect(() => {
    header.updateHeader({
      title: "Dashboard",
      iconName: 'dashboard',
    });
  })
  return (
    <DashboardPaneContainer>
      <DashboardPaneContent gap={10}>
        <ServerList />
        <PostsContainer/>
      </DashboardPaneContent>

    </DashboardPaneContainer>
  )
}


const NotificationCountContainer = styled(FlexRow)<{selected: boolean}>`
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  border-radius: 50%;
  height: 18px;
  width: 18px;
  font-size: 12px;
  ${props => props.selected ? `
    background: white;
    color: var(--primary-color);  
  ` : ''}
`;



function PostsContainer() {
  const [showNotifications, setShowNotifications] = createSignal(false);

  const [notificationCount, setNotificationCount] = createSignal(0);
  onMount(async() => {
    const count = await getPostNotificationCount();
    setNotificationCount(count);
  })

  const NotificationIndicator = () => {
    return <Show when={notificationCount()}><NotificationCountContainer selected={showNotifications()}>{notificationCount()}</NotificationCountContainer></Show>
  }

  createEffect(async () => {
    if (!showNotifications()) return;
    await getPostNotificationDismiss()
    setNotificationCount(0);
  })

  return ( 
    <>
      <Text size={18} style={{ "margin-left": "15px" }}>Posts</Text>
      <FlexRow gap={5} style={{ "margin-bottom": "5px", "margin-left": "13px" }}>
        <Button padding={5} textSize={14} iconSize={14} margin={0} primary={!showNotifications()} label='Feed' onClick={() => setShowNotifications(false)} />
        <Button padding={5} textSize={14} iconSize={14} margin={0} primary={showNotifications()} label="Notifications" customChildren={NotificationIndicator} onClick={() => setShowNotifications(true)} />
      </FlexRow>
      <Show when={!showNotifications()}><PostsArea showFeed style={{ "margin-left": "10px", "margin-right": "10px" }} showCreateNew /></Show>
      <Show when={showNotifications()}><PostNotificationsArea style={{ "margin-left": "10px", "margin-right": "10px" }}/></Show>
    </>
  )


}




function ServerList() {
  const { servers } = useStore();
  const [contextPosition, setContextPosition] = createSignal<{ x: number, y: number } | undefined>();
  const [contextServerId, setContextServerId] = createSignal<string | undefined>();

  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({ x: event.clientX, y: event.clientY });
  }

  return (
    <Show when={servers.array().length}>
      <Text size={18} style={{ "margin-left": "15px" }}>Servers</Text>
      <ServerListContainer>
        <ContextMenuServer position={contextPosition()} onClose={() => setContextPosition(undefined)} serverId={contextServerId()} />
        <For each={servers.orderedArray()}>
          {server => <ServerItem
            server={server!}
            onContextMenu={e => onContextMenu(e, server!.id)}
          />}
        </For>
      </ServerListContainer>
    </Show>
  )
}

function ServerItem(props: { server: Server, onContextMenu?: (e: MouseEvent) => void }) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications;
  const [hovered, setHovered] = createSignal(false);

  return (
    <Link
      onmouseover={() => setHovered(true)}
      onmouseout={() => setHovered(false)}
      href={RouterEndpoints.SERVER_MESSAGES(id, defaultChannelId)}
      onContextMenu={props.onContextMenu}>
      <SidebarItemContainer handlePosition='bottom' alert={hasNotifications()}>
        <Avatar animate={hovered()} server={props.server} size={35} />
      </SidebarItemContainer>
    </Link>
  )
}