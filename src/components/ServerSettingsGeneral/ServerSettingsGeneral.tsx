import styles from './styles.module.scss'
import RouterEndpoints from '../../common/RouterEndpoints';
import env from '../../common/env';
import { classNames, conditionalClass } from '../../common/classNames';
import { useParams } from 'solid-app-router';
import { createEffect, createSignal, JSX, Show } from 'solid-js';
import useStore from '../../chat-api/store/useStore';
import { useWindowProperties } from '../../common/useWindowProperties';
import CustomInput from '../CustomInput';
import DropDown from '../DropDown';
import Icon from '../Icon';
import CustomButton from '../CustomButton';
import { createUpdatedSignal } from '../../common/createUpdatedSignal';
import { updateServerSettings } from '../../chat-api/services/ServerService';
import SettingsBlock from '../SettingsBlock';



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
    defaultChannel: server()?.defaultChannel || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  const dropDownChannels = () => channels.getChannelsByServerId(serverId).map(channel => ({
    id: channel._id,
    label: channel.name,
    onClick: () => {
      setInputValue('defaultChannel', channel._id);
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
        <CustomInput value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </SettingsBlock>
      <SettingsBlock icon='tag' label='Default Channel' description='New members will be directed to this channel.'>
        <DropDown items={dropDownChannels()} selectedId={inputValues().defaultChannel} />
      </SettingsBlock>
      <Show when={error()}><div class={styles.error}>{error()}</div></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <CustomButton iconName='save' label={requestStatus()} class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>

    </div>
  )
}
