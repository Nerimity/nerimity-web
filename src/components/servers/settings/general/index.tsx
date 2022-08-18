import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import env from '@/common/env';
import { classNames, conditionalClass } from '@/common/classNames';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, JSX, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { useWindowProperties } from '@/common/useWindowProperties';
import Input from '@/components/ui/input';
import DropDown from '@/components/ui/drop-down';
import Button from '@/components/ui/button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import { updateServerSettings } from '@/chat-api/services/ServerService';
import SettingsBlock from '@/components/ui/settings-block';



export default function ServerSettingsInvite() {
  const {serverId} = useParams();
  const {tabs, servers, channels} = useStore();
  const windowProperties = useWindowProperties();
  const [mobileSize, isMobileSize] = createSignal(false);
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);

  const server = () => servers.get(serverId);

  const defaultInput = () => ({
    name: server()?.name || '',
    defaultChannelId: server()?.defaultChannelId || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  const dropDownChannels = () => channels.getChannelsByServerId(serverId).map(channel => ({
    id: channel.id,
    label: channel.name,
    onClick: () => {
      setInputValue('defaultChannelId', channel.id);
    }
  }));


  createEffect(() => {
    const isMobile = windowProperties.paneWidth()! < env.MOBILE_WIDTH;
    isMobileSize(isMobile);
  })
  
  
  createEffect(() => {
    tabs.openTab({
      title: "Settings - General",
      serverId: serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_GENERAL(serverId!),
    });
  })



  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServerSettings(serverId!, values)
      .catch((err) => setError(err.message))
      .finally(() => setRequestSent(false));
  }

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';

  return (
    <div class={classNames(styles.generalPane, conditionalClass(mobileSize(), styles.mobile))}>
      <div class={styles.title}>Server General</div>
      
      <SettingsBlock icon='edit' label='Server Name'>
        <Input value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </SettingsBlock>
      <SettingsBlock icon='tag' label='Default Channel' description='New members will be directed to this channel.'>
        <DropDown items={dropDownChannels()} selectedId={inputValues().defaultChannelId} />
      </SettingsBlock>
      <Show when={error()}><div class={styles.error}>{error()}</div></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>

    </div>
  )
}
