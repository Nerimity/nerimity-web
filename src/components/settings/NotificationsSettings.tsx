import { createEffect, createSignal, For} from 'solid-js';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { getCurrentLanguage, getLanguage, Language, languages, setCurrentLanguage } from '@/locales/languages';

import ItemContainer from '../ui/Item';
import twemoji from 'twemoji';
import { FlexColumn } from '../ui/Flexbox';
import useStore from '@/chat-api/store/useStore';
import { useTransContext } from '@nerimity/solid-i18next';
import env from '@/common/env';
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from '@/emoji';
import { Emoji } from '../markup/Emoji';
import { getStorageBoolean, setStorageBoolean, StorageKeys } from '@/common/localStorage';
import Checkbox from '../ui/Checkbox';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
`;



export default function NotificationsSettings() {
  const {header} = useStore();
  const [, actions] = useTransContext();

  const [isMuted, setMuted] = createSignal(getStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, false));

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Notifications",
      iconName: 'settings',
    });
  })

  const onChange = () => {
    setMuted(!isMuted());
    setStorageBoolean(StorageKeys.ARE_NOTIFICATIONS_MUTED, isMuted())
  }


  return (
    <Container>
      <Checkbox onChange={onChange} checked={!isMuted()} label="Notification sounds" />
    </Container>
  )
}
