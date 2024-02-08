import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu/ContextMenu";
import useStore from "@/chat-api/store/useStore";
import { useMatch, useNavigate } from "solid-navigator";
import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { dismissChannelNotification } from "@/chat-api/emits/userEmits";
import { createEffect } from "solid-js";
import { ChannelType } from "@/chat-api/RawData";

type Props = Omit<ContextMenuProps, 'items'> & {
  serverId?: string
}

export default function ContextMenuServer (props: Props) {

  const navigate = useNavigate();
  const {account, servers, serverMembers, channels} = useStore();

  const server = () => servers.get(props.serverId!);

  const isServerCreator = () => account.user()?.id === server()?.createdById;
  const isOnServerPage = useMatch(() => `/app/servers/${props.serverId}/*`); 

  const onLeaveClicked = async () => {
    await server()?.leave();
    if (isOnServerPage())
      navigate(RouterEndpoints.INBOX());
  }

  const member = () => serverMembers.get(props.serverId!, account.user()?.id!);

  const showSettings = () => {
    if (isServerCreator()) return true;
    return Object.values(ROLE_PERMISSIONS).find((p: Bitwise) => {
      if (!member()?.hasPermission(p)) return false;
      if (p.showSettings) return true;
      return false;
    })

  };

  const hasNotifications = () =>  channels.getChannelsByServerId(props.serverId!)?.find(c => c?.hasNotifications() && c.type === ChannelType.SERVER_TEXT)

  const dismissNotifications = () => {
    if (!props.serverId) return;
    channels.getChannelsByServerId(props.serverId).forEach(c => {
      if (!c?.hasNotifications()) return;
      return dismissChannelNotification(c.id);
    })
  }

  return (
    <ContextMenu {...props} items={[
      {icon: 'markunread_mailbox', label: "Mark As Read", disabled: !hasNotifications(), onClick: dismissNotifications},
      {separator: true},
      {icon: 'mail', label: "Invites", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_INVITES(props.serverId!))},
      {icon: 'notifications', label: "Notification Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_NOTIFICATIONS(props.serverId!))},
      ...(showSettings() ? [{icon: 'settings', label: "Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_GENERAL(props.serverId!))}] : []),
      {separator: true},
      {icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.serverId!)},
      {separator: true, show: !isServerCreator()},
      {icon: 'logout', label: "Leave", alert: true, onClick: onLeaveClicked, show: !isServerCreator()},
    ]} />
  )
}