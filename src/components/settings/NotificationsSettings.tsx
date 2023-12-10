import { createEffect, createSignal, For, Show } from 'solid-js';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { getCurrentLanguage, getLanguage, Language, languages, setCurrentLanguage } from '@/locales/languages';

import ItemContainer from '../ui/Item';
import twemoji from 'twemoji';
import { FlexColumn, FlexRow } from '../ui/Flexbox';
import useStore from '@/chat-api/store/useStore';
import { useTransContext } from '@mbarzda/solid-i18next';
import env from '@/common/env';
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from '@/emoji';
import { Emoji } from '../markup/Emoji';
import { getStorageBoolean, getStorageNumber, setStorageBoolean, setStorageNumber, StorageKeys } from '@/common/localStorage';
import Checkbox from '../ui/Checkbox';
import Breadcrumb, { BreadcrumbItem } from '../ui/Breadcrumb';
import { t } from 'i18next';
import SettingsBlock from '../ui/settings-block/SettingsBlock';
import Slider from '../ui/Slider';
import { playMessageNotification } from '@/common/Sound';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;



export default function NotificationsSettings() {
  const { header } = useStore();


  createEffect(() => {
    header.updateHeader({
      title: "Settings - Notifications",
      iconName: 'settings',
    });
  })


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.notifications')} />
      </Breadcrumb>
      <DesktopNotification/>
      <NotificationSound />
    </Container>
  )
}


function DesktopNotification() {

  const [isEnabled, setEnabled] = createSignal(getStorageBoolean(StorageKeys.ENABLE_DESKTOP_NOTIFICATION, false));

  const onChange = async () => {
    setEnabled(!isEnabled());
    setStorageBoolean(StorageKeys.ENABLE_DESKTOP_NOTIFICATION, isEnabled())

    await Notification.requestPermission()
    isEnabled() && new Notification("It worked.", { body: "Desktop notifications enabled!", icon: `/assets/logo.png` });
  }


  return (
    <SettingsBlock icon='dvr' label='Desktop Notifications' description='Show desktop notifications even when the app is minimized.'>
      <Checkbox onChange={onChange} checked={isEnabled()} />
    </SettingsBlock>
  )
}


function NotificationSound() {
  const [isMuted, setMuted] = createSignal(getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false));
  const onNotificationSoundChange = () => {
    setMuted(!isMuted());
    setStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, isMuted())
    !isMuted() && playMessageNotification({ force: true });
  }

  const [volume, setVolume] = createSignal(getStorageNumber(StorageKeys.NOTIFICATION_VOLUME, 10));
  const onVolumeChanged = () => {
    setStorageNumber(StorageKeys.NOTIFICATION_VOLUME, volume())
    playMessageNotification({ force: true });
  }

  return (
    <FlexColumn>
      <SettingsBlock icon='notifications_active' label='Sounds' description='If the notification sounds are too annoying, you can disable them.'>
        <Checkbox onChange={onNotificationSoundChange} checked={!isMuted()} />
      </SettingsBlock>

      <Show when={!isMuted()}>
        <SettingsBlock icon='volume_up' label='Volume' description='Change the volume of the notification sounds.'>
          <div style={{ display: 'flex' }}>
            <Slider onEnd={onVolumeChanged} value={volume()} min={0} max={100} onChange={setVolume} />
            <Text style={{ width: "30px", "text-align": 'center' }}>{volume()}</Text>
          </div>
        </SettingsBlock>
      </Show>
    </FlexColumn>
  )
}