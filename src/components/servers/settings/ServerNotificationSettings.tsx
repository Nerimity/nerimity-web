import { useParams } from "solid-navigator";
import { For, Show, createEffect } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { css, styled } from "solid-styled-components";
import { useTransContext } from "@nerimity/solid-i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";
import { RadioBox, RadioBoxItem } from "@/components/ui/RadioBox";
import { updateNotificationSettings } from "@/chat-api/services/UserService";
import { Notice } from "@/components/ui/Notice/Notice";
import ItemContainer from "@/components/ui/LegacyItem";
import Avatar from "@/components/ui/Avatar";
import {
  ChannelType,
  ServerNotificationPingMode,
  ServerNotificationSoundMode,
} from "@/chat-api/RawData";
import Button from "@/components/ui/Button";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const RadioBoxContainer = styled("div")`
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.05);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 10px;
  padding-left: 50px;
`;

export default function ServerNotificationSettings() {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string; channelId?: string }>();
  const { header, servers, account, channels } = useStore();
  const server = () => servers.get(params.serverId);

  const channel = () => channels.get(params.channelId!);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Notifications",
      serverId: params.serverId!,
      iconName: "settings",
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
      ? [{ id: null, label: "Inherit" }]
      : []),
    ...(currentNotificationPingMode() !==
    ServerNotificationPingMode.MENTIONS_ONLY
      ? [{ id: 0, label: "Everything" }]
      : []),
    { id: 1, label: "Mentions Only" },
    { id: 2, label: "Mute" },
  ];

  const onNotificationSoundChange = (item: RadioBoxItem) => {
    account.updateUserNotificationSettings({
      notificationSoundMode: item.id,
      channelId: params.channelId,
      serverId: params.serverId,
    });
  };

  const NotificationPingItems: RadioBoxItem[] = [
    ...(channel()?.serverId ? [{ id: null, label: "Inherit" }] : []),
    { id: 0, label: "Everything" },
    { id: 1, label: "Mentions Only" },
    { id: 2, label: "Mute" },
  ];

  const onNotificationPingChange = (item: RadioBoxItem) => {
    account.updateUserNotificationSettings({
      notificationPingMode: item.id,
      channelId: params.channelId,
      serverId: params.serverId,
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
        description="These settings will only change for you."
      />
      <SettingsBlock
        class={css`
          margin-top: 10px;
        `}
        header
        icon="priority_high"
        label="Notification Ping"
        description="Display a red notification icon."
      >
        <ItemContainer
          alert={
            currentNotificationPingMode() !== ServerNotificationPingMode.MUTE
          }
          style={{ "padding-left": "10px", "pointer-events": "none" }}
        >
          <Avatar
            server={{ hexColor: "rgba(255,255,255)", verified: false }}
            size={30}
          />
        </ItemContainer>
      </SettingsBlock>

      <RadioBoxContainer>
        <RadioBox
          onChange={onNotificationPingChange}
          items={NotificationPingItems}
          initialId={currentNotificationPingMode()}
        />
      </RadioBoxContainer>

      <Show
        when={currentNotificationPingMode() !== ServerNotificationPingMode.MUTE}
      >
        <SettingsBlock
          class={css`
            margin-top: 10px;
          `}
          header
          icon="notifications_active"
          label="Notification Sound"
          description="Make a notification sound."
        />
        <RadioBoxContainer>
          <RadioBox
            onChange={onNotificationSoundChange}
            items={NotificationSoundItems()}
            initialId={currentNotificationSoundMode()}
          />
        </RadioBoxContainer>
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
        channelId: channel.id,
      });
      await sleep(800);
    }
  };

  const sortedChannels = () => [
    ...overrides(),
    ...channels().filter((c) => !hasOverride(c.id)),
  ];

  return (
    <>
      <SettingsBlock
        class={css`
          margin-top: 10px;
        `}
        header
        icon="storage"
        label="Channels"
        description="Manage notifications per channel."
      >
        <Show when={overrides().length}>
          <Button
            onClick={resetOverrides}
            iconName="refresh"
            label={`Reset Overrides (${overrides().length})`}
          />
        </Show>
      </SettingsBlock>

      <For each={sortedChannels()}>
        {(channel, i) => (
          <SettingsBlock
            href={"./" + channel.id}
            class={css`
              padding-top: 0;
              padding-bottom: 0;
            `}
            label={`${hasOverride(channel.id) ? "*" : ""}${channel.name}`}
            icon="tag"
            borderTopRadius={false}
            borderBottomRadius={i() === sortedChannels().length - 1}
          />
        )}
      </For>
    </>
  );
};
