import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, {
  ContextMenuItem,
  ContextMenuProps,
} from "@/components/ui/context-menu/ContextMenu";
import useStore from "@/chat-api/store/useStore";
import { useMatch, useNavigate } from "solid-navigator";
import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { dismissChannelNotification } from "@/chat-api/emits/userEmits";
import { createEffect } from "solid-js";
import {
  ChannelType,
  ServerNotificationPingMode,
  ServerNotificationSoundMode,
} from "@/chat-api/RawData";
import { RadioBoxItem, RadioBoxItemCheckBox } from "@/components/ui/RadioBox";
import { conditionalClass } from "@/common/classNames";
import { css } from "solid-styled-components";
import { t } from "i18next";

type Props = Omit<ContextMenuProps, "items"> & {
  serverId?: string;
};

export default function ContextMenuServer(props: Props) {
  const navigate = useNavigate();
  const { account, servers, serverMembers, channels } = useStore();

  const server = () => servers.get(props.serverId!);

  const isServerCreator = () => account.user()?.id === server()?.createdById;
  const isOnServerPage = useMatch(() => `/app/servers/${props.serverId}/*`);

  const onLeaveClicked = async () => {
    await server()?.leave();
    if (isOnServerPage()) navigate(RouterEndpoints.INBOX());
  };

  const member = () => serverMembers.get(props.serverId!, account.user()?.id!);

  const showSettings = () => {
    if (isServerCreator()) return true;
    return Object.values(ROLE_PERMISSIONS).find((p: Bitwise) => {
      if (!member()?.hasPermission(p)) return false;
      if (p.showSettings) return true;
      return false;
    });
  };

  const hasNotifications = () =>
    channels
      .getChannelsByServerId(props.serverId!)
      ?.find(
        (c) => c?.hasNotifications() && c.type === ChannelType.SERVER_TEXT
      );

  const dismissNotifications = () => {
    if (!props.serverId) return;
    channels.getChannelsByServerId(props.serverId).forEach((c) => {
      if (!c?.hasNotifications()) return;
      return dismissChannelNotification(c.id);
    });
  };

  const notificationPingMode = () =>
    account.getRawNotificationSettings(props.serverId!)?.notificationPingMode ??
    0;
  const notificationSoundMode = () =>
    account.getRawNotificationSettings(props.serverId!)
      ?.notificationSoundMode ?? 0;

  const updateMode = (
    ping?: ServerNotificationPingMode | null,
    sound?: ServerNotificationSoundMode | null
  ) => {
    account.updateUserNotificationSettings({
      serverId: props.serverId,
      notificationPingMode: ping,
      notificationSoundMode: sound,
    });
  };

  const notificationItem = (opts: {
    type: "SOUND" | "PING";
    label: string;
    value: number | null;
  }) => {
    let disabled = false;

    if (opts.type === "SOUND") {
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
      ),
    } as ContextMenuItem;
  };

  const notificationItems = () => {
    const items: ContextMenuItem[] = [];
    items.push(
      { title: "Ping" },
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.everything"),
        value: ServerNotificationPingMode.ALL,
      }),
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.mentionsOnly"),
        value: ServerNotificationPingMode.MENTIONS_ONLY,
      }),
      notificationItem({
        type: "PING",
        label: t("serverContextMenu.notificationOptions.mute"),
        value: ServerNotificationPingMode.MUTE,
      })
    );

    items.push(
      { title: "Sound" },
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.everything"),
        value: ServerNotificationSoundMode.ALL,
      }),
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.mentionsOnly"),
        value: ServerNotificationSoundMode.MENTIONS_ONLY,
      }),
      notificationItem({
        type: "SOUND",
        label: t("serverContextMenu.notificationOptions.mute"),
        value: ServerNotificationSoundMode.MUTE,
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
          onClick: dismissNotifications,
        },
        { separator: true },
        {
          icon: "mail",
          label: t("serverContextMenu.invites"),
          onClick: () =>
            navigate(RouterEndpoints.SERVER_SETTINGS_INVITES(props.serverId!)),
        },
        {
          icon: "notifications",
          label: t("serverContextMenu.notifications"),
          sub: notificationItems(),
          onClick: () =>
            navigate(
              RouterEndpoints.SERVER_SETTINGS_NOTIFICATIONS(props.serverId!)
            ),
        },
        ...(showSettings()
          ? [
              {
                icon: "settings",
                label: t("serverContextMenu.settings"),
                onClick: () =>
                  navigate(
                    RouterEndpoints.SERVER_SETTINGS_GENERAL(props.serverId!)
                  ),
              },
            ]
          : []),
        { separator: true },
        {
          icon: "content_copy",
          label: t("serverContextMenu.copyId"),
          onClick: () => copyToClipboard(props.serverId!),
        },
        { separator: true, show: !isServerCreator() },
        {
          icon: "logout",
          label: t("serverContextMenu.leave"),
          alert: true,
          onClick: onLeaveClicked,
          show: !isServerCreator(),
        },
      ]}
    />
  );
}
