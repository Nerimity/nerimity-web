import { createEffect, createSignal, For, Show } from 'solid-js';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { getCurrentLanguage, getLanguage, Language, languages, setCurrentLanguage } from '@/locales/languages';

import ItemContainer from '../ui/Item';
import twemoji from 'twemoji';
import { FlexColumn, FlexRow } from '../ui/Flexbox';
import useStore from '@/chat-api/store/useStore';
import { useTransContext } from '@nerimity/solid-i18next';
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
import Button from '../ui/Button';
import { createGoogleAccountLink } from '@/chat-api/services/UserService';

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
        <BreadcrumbItem title={t('settings.drawer.connections')} />
      </Breadcrumb>
      <Connections/>
    </Container>
  )
}


function Connections() {

  const linkGoogle = () => {
    createGoogleAccountLink().then(res => {
      console.log(res)

    }).catch(err => {
      alert(err.message)
    })
  }

  return (
    <SettingsBlock label='Google' description='Linking your Google account will allow you to upload files in Nerimity. Files will be stores in your Google Drive.'>
      <Button label='Link' iconName='link' onClick={linkGoogle}  />
    </SettingsBlock>
  )
}