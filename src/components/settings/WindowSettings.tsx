import { createEffect, createSignal, For, onMount, Show } from 'solid-js';
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
import { Notice } from '../ui/Notice/Notice';
import { electronWindowAPI } from '@/common/Electron';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;


const Options = styled("div")`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-top: 10px;
  flex-shrink: 0;

`;


const BlockContent = styled("div")`
  position: absolute;
  inset: 0;
  cursor: not-allowed;
`;


export default function WindowSettings() {
  const { header } = useStore();


  createEffect(() => {
    header.updateHeader({
      title: "Settings - Window Settings",
      iconName: 'settings',
    });
  })

  const isElectron = electronWindowAPI()?.isElectron;


  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href='/app' icon='home' title="Dashboard" />
        <BreadcrumbItem title={t('settings.drawer.window-settings')} />
      </Breadcrumb>
      <Show when={!isElectron}>
        <Notice type='info' description='To modify these settings, you must download the Nerimity desktop app.' />
      </Show>

      <Options>
        <Show when={!isElectron}><BlockContent/></Show>
        <StartupOptions />
      </Options>

    </Container>
  )
}


function StartupOptions() {

  const [autostart, setAutostart] = createSignal(false)
  const [autostartMinimized, setAutostartMinimized] = createSignal(false)

  onMount(async () => {
    electronWindowAPI()?.getAutostart().then(setAutostart);
    electronWindowAPI()?.getAutostartMinimized().then(setAutostartMinimized);
  })

  const onAutostartChange = (checked: boolean) => {
    electronWindowAPI()?.setAutostart(checked);
    setAutostart(checked);
  }
  const onAutostartMinimizedChange = (checked: boolean) => {
    electronWindowAPI()?.setAutostartMinimized(checked);
    setAutostartMinimized(checked);
  }

  return (

    <FlexColumn>
      <SettingsBlock icon='launch' label='Startup Options' header />
      <SettingsBlock icon='restart_alt' label={`Open ${env.APP_NAME} on startup`} borderTopRadius={false} borderBottomRadius={!autostart()} >
        <Checkbox checked={autostart()} onChange={onAutostartChange} />
      </SettingsBlock>
      <Show when={autostart()}>
        <SettingsBlock icon='horizontal_rule' label='Start Minimized' description={`Minimize ${env.APP_NAME} to the tray automatically.`} borderTopRadius={false}>
          <Checkbox checked={autostartMinimized()} onChange={onAutostartMinimizedChange} />
        </SettingsBlock>
      </Show>
    </FlexColumn>
  )
}