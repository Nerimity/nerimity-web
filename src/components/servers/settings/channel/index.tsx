import styles from './styles.module.scss';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useNavigate, useParams } from '@solidjs/router';
import { createEffect,  createSignal,  For,  on, Show,} from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { deleteServerChannel, updateServerChannel } from '@/chat-api/services/ServerService';
import Modal from '@/components/ui/modal';
import { Channel } from '@/chat-api/store/useChannels';
import Checkbox from '@/components/ui/checkbox';
import { addPermission, CHANNEL_PERMISSIONS, getAllPermissions, removePermission } from '@/chat-api/Permissions';
import DeleteConfirmModal from '@/components/ui/delete-confirm-modal';



export default function ServerSettingsChannel() {
  const {serverId, id: channelId} = useParams();
  const { tabs, channels } = useStore();

  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [showDeleteConfirm, setDeleteConfirm] = createSignal(false);

  const channel = () => channels.get(channelId);



  
  const defaultInput = () => ({
    name: channel()?.name || '',
    permissions: channel()?.permissions || 0,
  })
  
  
  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);
  
  const permissions = () => getAllPermissions(CHANNEL_PERMISSIONS, inputValues().permissions);


  
  createEffect(on(channel, () => {
    tabs.openTab({
      title: "Settings - " + channel()?.name,
      serverId: serverId!,
      iconName: 'settings',
      path: RouterEndpoints.SERVER_SETTINGS_CHANNEL(serverId!, channelId),
    });
  }))


  const onSaveButtonClicked = async () => {
    if (saveRequestSent()) return;
    setSaveRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServerChannel(serverId!, channel()?.id!, values)
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  }


  const saveRequestStatus = () => saveRequestSent() ? 'Saving...' : 'Save Changes';


  const onPermissionChanged = (checked: boolean, bit: number) => {
    let newPermission = inputValues().permissions;
    if (checked) {
      newPermission = addPermission(newPermission, bit);
    }
    if (!checked) {
      newPermission = removePermission(newPermission, bit);
    }
    setInputValue("permissions", newPermission);
  }



  return (
    <div class={styles.channelPane}>
      {/* Channel Name */}
      <SettingsBlock icon='edit' label='Channel Name'>
        <Input value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </SettingsBlock>
      <div>
        <SettingsBlock icon="security" label="Permissions" description="Manage permissions for this channel." header={true} />
        <For each={ permissions()}>
          {(permission) => (
            <SettingsBlock icon={permission.icon} label={permission.name} description={permission.description} class={styles.permissionItem}>
              <Checkbox checked={permission.hasPerm} onChange={checked => onPermissionChanged(checked, permission.bit, )} />
            </SettingsBlock>
          )}

        </For>
      </div>
      {/* Delete Channel */}
      <Modal show={showDeleteConfirm() && !!channel()} title={`Delete ${channel()?.name}`} component={() => <ChannelDeleteConfirmModal channel={channel()!} />} />
      <SettingsBlock icon='delete' label='Delete this channel' description='This cannot be undone!'>
        <Button label='Delete Channel' color='var(--alert-color)' onClick={() => setDeleteConfirm(true)} />
      </SettingsBlock>
      {/* Errors & buttons */}
      <Show when={error()}><div class={styles.error}>{error()}</div></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={saveRequestStatus()} class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>
    </div>
  )
}

function ChannelDeleteConfirmModal(props: {channel: Channel}) {
  const params = useParams();
  const navigate = useNavigate();
  const {tabs} = useStore();
  const [error, setError] = createSignal<string | null>(null);
  
  const onDeleteClick = async () => {
    setError(null);
    deleteServerChannel(props.channel?.serverId!, props.channel.id).then(() => {
      const path = RouterEndpoints.SERVER_SETTINGS_CHANNELS(params.serverId!);
      tabs.updateTab(location.pathname, {path})
      navigate(path);
    }).catch(err => {
      setError(err.message);
    })
  }

  return (
    <DeleteConfirmModal 
      errorMessage={error()}
      confirmText={props.channel.name}
      onDeleteClick={onDeleteClick}
    />
  )
}