import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, {
  ContextMenuItem,
  ContextMenuProps
} from "@/components/ui/context-menu/ContextMenu";
import useStore from "@/chat-api/store/useStore";
import { useMatch, useNavigate } from "solid-navigator";
import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { dismissChannelNotification } from "@/chat-api/emits/userEmits";
import { createEffect } from "solid-js";
import {
  ChannelType,
  ServerNotificationPingMode,
  ServerNotificationSoundMode
} from "@/chat-api/RawData";
import {
  RadioBox,
  RadioBoxItem,
  RadioBoxItemCheckBox
} from "@/components/ui/RadioBox";
import { updateNotificationSettings } from "@/chat-api/services/UserService";
import { css } from "solid-styled-components";
import { t } from "@nerimity/i18lite";

type Props = Omit<ContextMenuProps, "items"> & {
  serverId?: string;
  channelId?: string;
};

export default function ContextMenuServerChannel(props: Props) {
  const { account, servers, serverMembers, channels } = useStore();

  const navigate = useNavigate();

  const server = () => servers.get(props.serverId!);
  const channel = () => channels.get(props.channelId!);

  const isServerCreator = () => account.user()?.id === server()?.createdById;

  const member = () => serverMembers.get(props.serverId!, account.user()?.id!);

  const showSettings = () => {
    if (isServerCreator()) return true;
    return Object.values(ROLE_PERMISSIONS).find((p: Bitwise) => {
      if (!serverMembers.hasPermission(member()!, p)) return false;
      if (p.showSettings) return true;
      return false;
    });
  };

  const hasNotifications = () =>
    channel()?.hasNotifications() &&
    channel()?.type === ChannelType.SERVER_TEXT;

  const dismissNotifications = () => {
    dismissChannelNotification(channel().id);
  };

  const notificationPingMode = () =>
    account.getRawNotificationSettings(channel()?.id!)?.notificationPingMode ??
    null;
  const notificationSoundMode = () =>
    account.getRawNotificationSettings(channel()?.id!)?.notificationSoundMode ??
    null;

  const updateMode = (
    ping?: ServerNotificationPingMode | null,
    sound?: ServerNotificationSoundMode | null
  ) => {
    account.updateUserNotificationSettings({
      serverId: props.serverId,
      channelId: channel()!.id,
      notificationPingMode: ping,
      notificationSoundMode: sound
    });
  };

  const notificationItem = (opts: {
    type: "SOUND" | "PING";
    label: string;
    value: number | null;
  }) => {
    let disabled = false;

    if (opts.type === "SOUND") {
      if (notificationPingMode() !== null && opts.value === null) {
        disabled = true;
      }

      if (
        notificationPingMode() === ServerNotificationPingMode.MENTIONS_ONLY &&
        opts.value === ServerNotificationSoundMode.ALL
      ) {
        disabled = true;
      }

      if (notificationPingMode() === ServerNotificationPingMode.MUTE) {
        disabled = true;
      }
    }

    return {
      label: "",
      closeOnClick: false,
      disabled,
      onClick: () =>
        opts.type === "PING"
          ? updateMode(opts.value)
          : updateMode(undefined, opts.value),
      prefix: (
        <RadioBoxItem
          class={css`
            margin: 0;
            padding: 0;
            height: 100%;
          `}
          item={{ label: opts.label, id: 0 }}
          selected={
            opts.type === "PING"
              ? opts.value === notificationPingMode()
              : opts.value === notificationSoundMode()
          }
          checkboxSize={8}
          labelSize={14}
        />
      )
    } as ContextMenuItem;
  };

  const notificationItems = () => {
    const items: ContextMenuItem[] = [];
    items.push(
      { title: t("serverContextMenu.notificationOptions.sections.ping") },
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.initial"),
        value: null
      }),
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.everything"),
        value: ServerNotificationPingMode.ALL
      }),
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.mentionsOnly"),
        value: ServerNotificationPingMode.MENTIONS_ONLY
      }),
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.mute"),
        value: ServerNotificationPingMode.MUTE
      })
    );

    items.push(
      { title: t("serverContextMenu.notificationOptions.sections.sound") },
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.initial"),
        value: null
      }),
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.everything"),
        value: ServerNotificationSoundMode.ALL
      }),
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.mentionsOnly"),
        value: ServerNotificationSoundMode.MENTIONS_ONLY
      }),
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.mute"),
        value: ServerNotificationSoundMode.MUTE
      })
    );

    return items;
  };

  return (
    <ContextMenu
      {...props}
      items={[
        {
          icon: "markunread_mailbox",
          label: t("serverContextMenu.markAsRead"),
          disabled: !hasNotifications(),
          onClick: dismissNotifications
        },
        { separator: true },
        {
          icon: "notifications",
          label: t("servers.settings.drawer.notifications"),
          sub: notificationItems(),
          onClick: () =>
            navigate(
              RouterEndpoints.SERVER_SETTINGS_NOTIFICATIONS(props.serverId!) +
                "/" +
                props.channelId!
            )
        },
        ...(showSettings()
          ? [
              {
                icon: "settings",
                label: t("serverContextMenu.channelSettings"),
                onClick: () =>
                  navigate(
                    RouterEndpoints.SERVER_SETTINGS_CHANNEL(
                      props.serverId!,
                      props.channelId!
                    )
                  )
              }
            ]
          : []),
        { separator: true },
        {
          icon: "content_copy",
          label: t("general.copyID"),
          onClick: () => copyToClipboard(props.channelId!)
        }
      ]}
    />
  );
}
