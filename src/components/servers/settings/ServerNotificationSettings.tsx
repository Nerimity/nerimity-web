import { useParams } from "solid-navigator";
import { For, JSXElement, Show, createEffect } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock, {
  SettingsGroup
} from "@/components/ui/settings-block/SettingsBlock";
import { css, styled } from "solid-styled-components";
import { t } from "@nerimity/i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";
import { RadioBox, RadioBoxItem } from "@/components/ui/RadioBox";
import { updateNotificationSettings } from "@/chat-api/services/UserService";
import { Notice } from "@/components/ui/Notice/Notice";
import ItemContainer from "@/components/ui/LegacyItem";
import Avatar from "@/components/ui/Avatar";
import { ChannelType, ServerNotificationPingMode } from "@/chat-api/RawData";
import Button from "@/components/ui/Button";
import Block from "@/components/ui/settings-block/Block";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 10px;
`;

const RadioBoxContainer = (props: { children?: JSXElement }) => {
  return (
    <Block style={{ "padding-left": "50px", "margin-bottom": "0" }}>
      {props.children}
    </Block>
  );
};

export default function ServerNotificationSettings() {
  const params = useParams<{ serverId: string; channelId?: string }>();
  const { header, servers, account, channels } = useStore();
  const server = () => servers.get(params.serverId);

  const channel = () => channels.get(params.channelId!);

  createEffect(() => {
    header.updateHeader({
      title:
        t("settings.drawer.title") +
        " - " +
        t("servers.settings.drawer.notifications"),
      serverId: params.serverId!,
      iconName: "settings"
    });
  });

  const currentNotificationSoundMode = () =>
    account.getRawNotificationSettings(channel()?.id || params.serverId)
      ?.notificationSoundMode ?? (channel()?.id ? null : 0);
  const currentNotificationPingMode = () =>
    account.getRawNotificationSettings(channel()?.id || params.serverId)
      ?.notificationPingMode ?? (channel()?.id ? null : 0);

  const NotificationSoundItems: () => RadioBoxItem[] = () => [
    ...(currentNotificationPingMode() === null
      ? [
          {
            id: null,
            label: t("serverContextMenu.notificationOptions.initial")
          }
        ]
      : []),
    ...(currentNotificationPingMode() !==
    ServerNotificationPingMode.MENTIONS_ONLY
      ? [
          {
            id: 0,
            label: t("serverContextMenu.notificationOptions.everything")
          }
        ]
      : []),
    { id: 1, label: t("serverContextMenu.notificationOptions.mentionsOnly") },
    { id: 2, label: t("serverContextMenu.notificationOptions.mute") }
  ];

  const onNotificationSoundChange = (item: RadioBoxItem) => {
    account.updateUserNotificationSettings({
      notificationSoundMode: item.id,
      channelId: params.channelId,
      serverId: params.serverId
    });
  };

  const NotificationPingItems: RadioBoxItem[] = [
    ...(channel()?.serverId
      ? [
          {
            id: null,
            label: t("serverContextMenu.notificationOptions.initial")
          }
        ]
      : []),
    { id: 0, label: t("serverContextMenu.notificationOptions.everything") },
    { id: 1, label: t("serverContextMenu.notificationOptions.mentionsOnly") },
    { id: 2, label: t("serverContextMenu.notificationOptions.mute") }
  ];

  const onNotificationPingChange = (item: RadioBoxItem) => {
    account.updateUserNotificationSettings({
      notificationPingMode: item.id,
      channelId: params.channelId,
      serverId: params.serverId
    });
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem
          href={channel()?.serverId ? "../" : undefined}
          title={t("servers.settings.drawer.notifications")}
        />

        <Show when={channel()?.serverId}>
          <BreadcrumbItem title={channel()?.name} />
        </Show>
      </Breadcrumb>

      <Notice
        type="info"
        description={t("servers.settings.notifications.notice")}
      />

      <SettingsGroup>
        <SettingsBlock
          icon="priority_high"
          label={t("servers.settings.notifications.ping")}
          description={t("servers.settings.notifications.pingDescription")}
        >
          <ItemContainer
            alert={
              currentNotificationPingMode() !== ServerNotificationPingMode.MUTE
            }
            style={{ "padding-left": "10px", "pointer-events": "none" }}
          >
            <Avatar server={server()} size={30} />
          </ItemContainer>
        </SettingsBlock>

        <RadioBoxContainer>
          <RadioBox
            onChange={onNotificationPingChange}
            items={NotificationPingItems}
            initialId={currentNotificationPingMode()}
          />
        </RadioBoxContainer>
      </SettingsGroup>

      <Show
        when={currentNotificationPingMode() !== ServerNotificationPingMode.MUTE}
      >
        <SettingsGroup>
          <SettingsBlock
            icon="notifications_active"
            label={t("servers.settings.notifications.sound")}
            description={t("servers.settings.notifications.soundDescription")}
          />
          <RadioBoxContainer>
            <RadioBox
              onChange={onNotificationSoundChange}
              items={NotificationSoundItems()}
              initialId={currentNotificationSoundMode()}
            />
          </RadioBoxContainer>
        </SettingsGroup>
      </Show>

      <Show when={!channel()?.serverId}>
        <ChannelNotificationsBlock />
      </Show>
    </Container>
  );
}

const ChannelNotificationsBlock = () => {
  const params = useParams<{ serverId: string }>();
  const store = useStore();

  const channels = () =>
    store.channels
      .getSortedChannelsByServerId(params.serverId, true)
      .filter((c) => c.type === ChannelType.SERVER_TEXT);

  const hasOverride = (channelId: string) => {
    const setting = store.account.getRawNotificationSettings(channelId);
    const pingMode = setting?.notificationPingMode;
    const soundMode = setting?.notificationSoundMode;
    const combined = pingMode || soundMode;
    return combined !== undefined && combined !== null;
  };

  const overrides = () => {
    return channels().filter((c) => hasOverride(c.id));
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const resetOverrides = async () => {
    const oChannels = [...overrides()];
    for (let i = 0; i < oChannels.length; i++) {
      const channel = oChannels[i]!;
      await updateNotificationSettings({
        notificationPingMode: null,
        notificationSoundMode: null,
        channelId: channel.id
      });
      await sleep(800);
    }
  };

  const sortedChannels = () => [
    ...overrides(),
    ...channels().filter((c) => !hasOverride(c.id))
  ];

  return (
    <SettingsGroup>
      <SettingsBlock
        icon="storage"
        label={t("servers.settings.drawer.channels")}
        description={t("servers.settings.notifications.channelsDescription")}
      >
        <Show when={overrides().length}>
          <Button
            onClick={resetOverrides}
            iconName="refresh"
            label={t("servers.settings.notifications.resetButton", {
              count: overrides().length
            })}
          />
        </Show>
      </SettingsBlock>

      <For each={sortedChannels()}>
        {(channel) => (
          <SettingsBlock
            href={"./" + channel.id}
            class={css`
              padding-block: 0;
            `}
            label={`${hasOverride(channel.id) ? "*" : ""}${channel.name}`}
            icon="tag"
          />
        )}
      </For>
    </SettingsGroup>
  );
};
