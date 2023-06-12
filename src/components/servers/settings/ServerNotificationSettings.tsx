import { useParams } from '@solidjs/router';
import { createEffect } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import { styled } from 'solid-styled-components';
import { useTransContext } from '@nerimity/solid-i18next';
import Breadcrumb, { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import RouterEndpoints from '@/common/RouterEndpoints';
import { RadioBox, RadioBoxItem } from '@/components/ui/RadioBox';
import { updateServerSettings } from '@/chat-api/services/UserService';

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
      iconName: 'settings',
    });
  })

  const currentNotificationSoundMode = () => account.getServerSettings(params.serverId)?.notificationSoundMode || 0;
  const NotificationItems: RadioBoxItem[] = [
    { id: 0, label: 'Everything' },
    { id: 1, label: 'Mentions Only' },
    { id: 2, label: 'Mute' },
  ]

  const onNotificationChange = (item: RadioBoxItem) => {
    updateServerSettings(params.serverId, {
      notificationSoundMode: item.id as number
    })
  }

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(params.serverId, server()?.defaultChannelId!)} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t('servers.settings.drawer.notifications')} />
      </Breadcrumb>
      <SettingsBlock header icon='notifications_active' label='Notification Sound' description='These settings will only change for you.' />
      <RadioBoxContainer>
        <RadioBox onChange={onNotificationChange} items={NotificationItems} initialId={currentNotificationSoundMode()} />
      </RadioBoxContainer>
    </Container>
  )
}

