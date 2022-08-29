import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import env from '@/common/env';
import { classNames, conditionalClass } from '@/common/classNames';
import { useNavigate, useParams } from '@solidjs/router';
import { createEffect, createSignal, JSX, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { useWindowProperties } from '@/common/useWindowProperties';
import Input from '@/components/ui/input';
import DropDown from '@/components/ui/drop-down';
import Button from '@/components/ui/button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import { deleteServer, updateServerSettings } from '@/chat-api/services/ServerService';
import SettingsBlock from '@/components/ui/settings-block';
import { Server } from '@/chat-api/store/useServers';
import DeleteConfirmModal from '@/components/ui/delete-confirm-modal';
import Modal from '@/components/ui/modal';



export default function ServerGeneralSettings() {
  const {serverId} = useParams();
  const {tabs, servers, channels} = useStore();
  const windowProperties = useWindowProperties();
  const [mobileSize, isMobileSize] = createSignal(false);
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [showDeleteConfirm, setDeleteConfirm] = createSignal(false);

  const server = () => servers.get(serverId);

  const defaultInput = () => ({
    name: server()?.name || '',
    defaultChannelId: server()?.defaultChannelId || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);


  const dropDownChannels = () => channels.getChannelsByServerId(serverId).map(channel => ({
    id: channel!.id,
    label: channel!.name,
    onClick: () => {
      setInputValue('defaultChannelId', channel!.id);
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
      <Modal show={showDeleteConfirm() && !!server()} title={`Delete ${server()?.name}`} component={() => <ServerDeleteConfirmModal server={server()!} />} />
      <SettingsBlock icon='delete' label='Delete this server' description='This cannot be undone!'>
        <Button label='Delete Server' color='var(--alert-color)' onClick={() => setDeleteConfirm(true)} />
      </SettingsBlock>
      <Show when={error()}><div class={styles.error}>{error()}</div></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>

    </div>
  )
}


function ServerDeleteConfirmModal(props: {server: Server}) {
  const params = useParams();
  const navigate = useNavigate();
  const {tabs} = useStore();
  const [error, setError] = createSignal<string | null>(null);
  
  const onDeleteClick = async () => {
    setError(null);

    deleteServer(props.server.id)
      .catch(e => setError(e))
  }

  return (
    <DeleteConfirmModal
      errorMessage={error()}
      confirmText={props.server.name}
      onDeleteClick={onDeleteClick}
    />
  )
}