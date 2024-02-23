import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu/ContextMenu";
import useStore from "@/chat-api/store/useStore";
import { useMatch, useNavigate } from "solid-navigator";
import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { dismissChannelNotification } from "@/chat-api/emits/userEmits";
import { createEffect } from "solid-js";
import { ChannelType } from "@/chat-api/RawData";

type Props = Omit<ContextMenuProps, "items"> & {
  serverId?: string
  channelId?: string
}

export default function ContextMenuServerChannel (props: Props) {
  const {account, servers, serverMembers, channels} = useStore();

  const navigate = useNavigate();

  const server = () => servers.get(props.serverId!);
  const channel = () => channels.get(props.channelId!);

  const isServerCreator = () => account.user()?.id === server()?.createdById;



  const member = () => serverMembers.get(props.serverId!, account.user()?.id!);

  const showSettings = () => {
    if (isServerCreator()) return true;
    return Object.values(ROLE_PERMISSIONS).find((p: Bitwise) => {
      if (!member()?.hasPermission(p)) return false;
      if (p.showSettings) return true;
      return false;
    });

  };

  const hasNotifications = () =>  channel()?.hasNotifications() && channel()?.type === ChannelType.SERVER_TEXT;

  const dismissNotifications = () => {
    dismissChannelNotification(channel().id);
  };

  return (
    <ContextMenu {...props} items={[
      {icon: "markunread_mailbox", label: "Mark As Read", disabled: !hasNotifications(), onClick: dismissNotifications},
      {separator: true},
      {icon: "notifications", label: "Notification Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_NOTIFICATIONS(props.serverId!) + "/" + props.channelId!)},
      ...(showSettings() ? [{icon: "settings", label: "Channel Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_CHANNEL(props.serverId!, props.channelId!))}] : []),
      {separator: true},
      {icon: "copy", label: "Copy ID", onClick: () => copyToClipboard(props.channelId!)}
    ]} />
  );
}