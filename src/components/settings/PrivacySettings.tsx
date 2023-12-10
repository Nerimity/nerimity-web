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
import { RadioBox, RadioBoxItem } from '../ui/RadioBox';
import useAccount from '@/chat-api/store/useAccount';
import { updateUser } from '@/chat-api/services/UserService';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
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


export default function PrivacySettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: "Settings - Privacy",
      iconName: 'settings',
    });
  })

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.privacy')} />
      </Breadcrumb>
      <DMOptions />
    </Container>
  )
}


function DMOptions() {
  const {account} = useStore();

  const currentDmStatus = () => account.user()?.dmStatus;

  const radioboxItems = [
    { id: 0, label: 'Anyone' },
    { id: 1, label: 'Friends & Servers only' },
    { id: 2, label: 'Friends only' },
  ]

  const onChange = (item: RadioBoxItem) => {
    const id = item.id;
    updateUser({
      dmStatus: id as number
    })
  }

  return (
    <FlexColumn>
      <SettingsBlock class={css`margin-top: 10px;`} header icon='chat_bubble' label='Direct Message Options' >
      </SettingsBlock>

      <RadioBoxContainer>
        <RadioBox onChange={onChange} items={radioboxItems} initialId={currentDmStatus() || 0} />
      </RadioBoxContainer>

    </FlexColumn>
  )
}

