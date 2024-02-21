import { useParams } from "solid-navigator";
import { Show, createEffect } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import { css, styled } from "solid-styled-components";
import { useTransContext } from "@mbarzda/solid-i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import RouterEndpoints from "@/common/RouterEndpoints";
import { RadioBox, RadioBoxItem } from "@/components/ui/RadioBox";
import { updateNotificationSettings } from "@/chat-api/services/UserService";
import { Notice } from "@/components/ui/Notice/Notice";
import ItemContainer from "@/components/ui/Item";
import Avatar from "@/components/ui/Avatar";
import { ServerNotificationPingMode, ServerNotificationSoundMode } from "@/chat-api/RawData";

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

export default function ServerGeneralSettings(props: {}) {
  const [t] = useTransContext();
  const params = useParams<{ serverId: string }>();
  const { header, servers, account } = useStore();
  const server = () => servers.get(params.serverId);

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Notifications",
      serverId: params.serverId!,
      iconName: "settings"
    });
  });

  const currentNotificationSoundMode = () => account.getNotificationSettings(params.serverId)?.notificationSoundMode || 0;
  const currentNotificationPingMode = () => account.getNotificationSettings(params.serverId)?.notificationPingMode || 0;
  
  const NotificationSoundItems: () => RadioBoxItem[] = () => ([
    ...(currentNotificationPingMode() !== ServerNotificationPingMode.MENTIONS_ONLY ? [{id: 0, label: "Everything" }] : []),
    { id: 1, label: "Mentions Only" },
    { id: 2, label: "Mute" }
  ]);

  const onNotificationSoundChange = (item: RadioBoxItem) => {
    updateNotificationSettings({
      notificationSoundMode: item.id as number,
      serverId: params.serverId
    });
  };

  const NotificationPingItems: RadioBoxItem[] = [
    { id: 0, label: "Everything" },
    { id: 1, label: "Mentions Only" },
    { id: 2, label: "Mute" }
  ];

  const onNotificationPingChange = (item: RadioBoxItem) => {
    let notificationSoundMode: number | null = null;
    if (item.id === ServerNotificationPingMode.MENTIONS_ONLY && currentNotificationSoundMode() === ServerNotificationSoundMode.ALL) {
      notificationSoundMode = ServerNotificationSoundMode.MENTIONS_ONLY;
    }
    if (item.id === ServerNotificationPingMode.MUTE) {
      notificationSoundMode = ServerNotificationSoundMode.MUTE;
    }
    updateNotificationSettings({
      notificationPingMode: item.id as number,
      ...(notificationSoundMode !== null ? {notificationSoundMode} : undefined),
      serverId: params.serverId
    });
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId!)} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t("servers.settings.drawer.notifications")} />
      </Breadcrumb>

      <Notice type='info' description='These settings will only change for you.' />
      <SettingsBlock class={css`margin-top: 10px;`} header icon='priority_high' label='Notification Ping' description='Display a red notification icon.'>
        <ItemContainer alert={currentNotificationPingMode() !== ServerNotificationPingMode.MUTE} style={{ "padding-left": "10px", "pointer-events": "none" }}><Avatar server={{ hexColor: "rgba(255,255,255)", verified: false }} size={30} /></ItemContainer>
      </SettingsBlock>

      <RadioBoxContainer>
        <RadioBox onChange={onNotificationPingChange} items={NotificationPingItems} initialId={currentNotificationPingMode()} />
      </RadioBoxContainer>

      <Show when={currentNotificationPingMode() !== ServerNotificationPingMode.MUTE}>
        <SettingsBlock class={css`margin-top: 10px;`} header icon='notifications_active' label='Notification Sound' description='Make a notification sound.' />
        <RadioBoxContainer>
          <RadioBox onChange={onNotificationSoundChange} items={NotificationSoundItems()} initialId={currentNotificationSoundMode()} />
        </RadioBoxContainer>
      </Show>

    </Container>
  );
}

