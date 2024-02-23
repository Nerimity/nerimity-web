import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuItem, ContextMenuProps } from "@/components/ui/context-menu/ContextMenu";
import useStore from "@/chat-api/store/useStore";
import { useMatch, useNavigate } from "solid-navigator";
import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { dismissChannelNotification } from "@/chat-api/emits/userEmits";
import { createEffect } from "solid-js";
import { ChannelType, ServerNotificationPingMode, ServerNotificationSoundMode } from "@/chat-api/RawData";
import { RadioBox, RadioBoxItem, RadioBoxItemCheckBox } from "@/components/ui/RadioBox";
import { updateNotificationSettings } from "@/chat-api/services/UserService";

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

  const notificationPingMode = () => account.getRawNotificationSettings(channel()!.id)?.notificationPingMode ?? undefined;
  const notificationSoundMode = () => account.getRawNotificationSettings(channel()!.id)?.notificationSoundMode ?? undefined;

  const updatePingMode = (mode: ServerNotificationPingMode | null) => {
    updateNotificationSettings({
      channelId: channel()!.id,
      notificationPingMode: mode
    });
  };

  const notificationItems = () => {
    const items: ContextMenuItem[] = [];
    items.push(
      {title: "Ping"},
      {label: "Initial",       closeOnClick: false, onClick: () => updatePingMode(null), prefix: <RadioBoxItemCheckBox selected={notificationPingMode() === undefined} size={8} />},
      {label: "Everything",    closeOnClick: false, onClick: () => updatePingMode(ServerNotificationPingMode.ALL), prefix: <RadioBoxItemCheckBox selected={notificationPingMode() === ServerNotificationPingMode.ALL} size={8} />},
      {label: "Mentions Only", closeOnClick: false, onClick: () => updatePingMode(ServerNotificationPingMode.MENTIONS_ONLY), prefix: <RadioBoxItemCheckBox selected={notificationPingMode() === ServerNotificationPingMode.MENTIONS_ONLY} size={8} />},
      {label: "Mute",          closeOnClick: false, onClick: () => updatePingMode(ServerNotificationPingMode.MUTE), prefix: <RadioBoxItemCheckBox selected={notificationPingMode() === ServerNotificationPingMode.MUTE} size={8} />}
    );

    items.push(
        
      {title: "Sound"},
      {label: "Initial",   disabled: notificationPingMode() !== undefined,    prefix: <RadioBoxItemCheckBox selected={notificationPingMode() === undefined} size={8} />},
      {label: "Everything",disabled: notificationPingMode() !== ServerNotificationPingMode.MENTIONS_ONLY,    prefix: <RadioBoxItemCheckBox selected={notificationSoundMode() === ServerNotificationSoundMode.ALL} size={8} />},
      {label: "Mentions Only", prefix: <RadioBoxItemCheckBox selected={notificationSoundMode() === ServerNotificationSoundMode.MENTIONS_ONLY} size={8} />},
      {label: "Mute",          prefix: <RadioBoxItemCheckBox selected={notificationSoundMode() === ServerNotificationSoundMode.MUTE} size={8} />}

      
    );


    return items;
  };

  return (
    <ContextMenu {...props} items={[
      {icon: "markunread_mailbox", label: "Mark As Read", disabled: !hasNotifications(), onClick: dismissNotifications},
      {separator: true},
      {icon: "notifications", label: "Notification Settings", sub: notificationItems()},
      // {icon: "notifications", label: "Notification Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_NOTIFICATIONS(props.serverId!) + "/" + props.channelId!)},
      ...(showSettings() ? [{icon: "settings", label: "Channel Settings", onClick: () => navigate(RouterEndpoints.SERVER_SETTINGS_CHANNEL(props.serverId!, props.channelId!))}] : []),
      {separator: true},
      {icon: "copy", label: "Copy ID", onClick: () => copyToClipboard(props.channelId!)}
    ]} />
  );
}