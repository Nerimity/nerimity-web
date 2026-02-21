import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, {
  ContextMenuItem,
  ContextMenuProps,
} from "@/components/ui/context-menu/ContextMenu";
import useStore from "@/chat-api/store/useStore";
import { useNavigate } from "solid-navigator";
import {
  Bitwise,
  hasBit,
  ROLE_PERMISSIONS,
  USER_BADGES,
} from "@/chat-api/Bitwise";
import { dismissChannelNotification } from "@/chat-api/emits/userEmits";
import { RawExploreItem } from "@/chat-api/RawData";
import { getPublicServer } from "@/chat-api/services/ServerService";
import { createSignal, createEffect } from "solid-js";
import {
  ChannelType,
  ServerNotificationPingMode,
  ServerNotificationSoundMode,
} from "@/chat-api/RawData";
import { RadioBoxItem } from "@/components/ui/RadioBox";
import { css } from "solid-styled-components";
import { ServerBumpModal } from "../../explore/ExploreServers";
import { t } from "@nerimity/i18lite";
import {
  toast,
  useCustomPortal,
} from "@/components/ui/custom-portal/CustomPortal";
import { ToastModal } from "@/components/ui/toasts/ToastModal";
import LeaveServerModal from "../modals/LeaveServerModal";

type Props = Omit<ContextMenuProps, "items"> & {
  serverId?: string;
};

export default function ContextMenuServer(props: Props) {
  const navigate = useNavigate();
  const { createPortal } = useCustomPortal();
  const { account, servers, serverMembers, channels } = useStore();
  const [exploreItem, setExploreItem] = createSignal<RawExploreItem | null>(
    null
  );
  const server = () => servers.get(props.serverId!);
  const isServerPublic = () => !!exploreItem();
  const isServerCreator = () => account.user()?.id === server()?.createdById;

  const isNerimityAdmin = () => account.hasModeratorPerm(true);

  const onLeaveClicked = () => {
    createPortal?.((close) => (
      <LeaveServerModal server={server()!} close={close} />
    ));
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

  createEffect(() => {
    if (!props.position) return;
    setExploreItem(null);
    if (props.serverId) {
      getPublicServer(props.serverId)
        .then(setExploreItem)
        .catch(() => {});
    }
  });

  const bumpClick = () => {
    const item = exploreItem();
    if (!item) return;

    const bumpAfter = 3 * 60 * 60 * 1000;
    const elapsed = Date.now() - item!.bumpedAt;

    if (elapsed < bumpAfter) {
      const remaining = new Date(bumpAfter - elapsed);

      toast(
        t("servers.settings.publishServer.bumpCooldown", {
          hours: remaining.getUTCHours(),
          minutes: remaining.getUTCMinutes(),
          seconds: remaining.getUTCSeconds(),
        }),
        t("servers.settings.publishServer.bumpServer"),
        "arrow_upward"
      );

      return;
    }

    createPortal?.((close) => (
      <ServerBumpModal
        update={setExploreItem}
        publicServer={item!}
        close={close}
      />
    ));
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
      { title: t("serverContextMenu.notificationOptions.sections.ping") },
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
      { title: t("serverContextMenu.notificationOptions.sections.sound") },
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

    items.push(
      {
        icon: "settings",
        label: t("settings.drawer.title"),
        onClick: () =>
          navigate(
            RouterEndpoints.SERVER_SETTINGS_NOTIFICATIONS(props.serverId!)
          ),
      }
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
          label: t("servers.settings.drawer.invites"),
          onClick: () =>
            navigate(RouterEndpoints.SERVER_SETTINGS_INVITES(props.serverId!)),
        },
        {
          icon: "arrow_upward",
          label: t("servers.settings.publishServer.bumpServer"),
          onClick: bumpClick,
          disabled: !isServerPublic(),
        },
        {
          icon: "notifications",
          label: t("servers.settings.drawer.notifications"),
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
                label: t("settings.drawer.title"),
                onClick: () =>
                  navigate(
                    RouterEndpoints.SERVER_SETTINGS_GENERAL(props.serverId!)
                  ),
              },
            ]
          : []),
        { separator: true },
        isNerimityAdmin()
          ? {
              icon: "security",
              label: "Admin Pane",
              onClick: () => {
                navigate("/app/moderation/servers/" + props.serverId);
              },
            }
          : {},
        {
          icon: "content_copy",
          label: t("general.copyID"),
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
