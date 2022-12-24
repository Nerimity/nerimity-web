import { Server } from "@/chat-api/store/useServers";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Link, useMatch } from "@nerimity/solid-router";
import { createEffect, createSignal, For } from "solid-js";
import { styled } from "solid-styled-components"
import ContextMenuServer from "./servers/context-menu/ContextMenuServer";
import Avatar from "./ui/Avatar";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import ItemContainer from "./ui/Item";
import Text from "./ui/Text";

const DashboardPaneContainer = styled(FlexColumn)`
  justify-content: center;
  align-items: center;
  height: 100%;
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
  const {header} = useStore();
  createEffect(() => {
    header.updateHeader({
      title: "Dashboard",
      iconName: 'dashboard',
    });
  })
  return (
    <DashboardPaneContainer>
      <DashboardPaneContent>

        <Text style={{"margin-bottom": "5px", "margin-left": "15px"}}>Servers</Text>
        <ServerList/>
      </DashboardPaneContent>

    </DashboardPaneContainer>
  )
}

function ServerList() {
  const {servers} = useStore();
  const [contextPosition, setContextPosition] = createSignal<{x: number, y: number} | undefined>();
  const [contextServerId, setContextServerId] = createSignal<string | undefined>();

  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({x: event.clientX, y: event.clientY});
  }

  return (
    <ServerListContainer>
    <ContextMenuServer position={contextPosition()} onClose={() => setContextPosition(undefined)} serverId={contextServerId()} />
    <For each={servers.array()}>
      {server => <ServerItem 
        server={server!}
        onContextMenu={e => onContextMenu(e, server!.id)}
      />}
    </For>
  </ServerListContainer>
  )
}

function ServerItem(props: {server: Server, onContextMenu?: (e: MouseEvent) => void}) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications;
  const selected = useMatch(() => RouterEndpoints.SERVER(id));

  return (
    <Link
      href={RouterEndpoints.SERVER_MESSAGES(id, defaultChannelId)}
      onContextMenu={props.onContextMenu}>
    <SidebarItemContainer handlePosition='bottom' alert={hasNotifications()}  selected={selected()}>
      <Avatar size={35} hexColor={props.server.hexColor} />
    </SidebarItemContainer>
    </Link>
  )
}