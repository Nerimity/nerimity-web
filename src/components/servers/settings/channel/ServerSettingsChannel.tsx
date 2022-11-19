import styles from './styles.module.scss';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useNavigate, useParams } from '@nerimity/solid-router';
import { createEffect,  createSignal,  For, on, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { deleteServerChannel, updateServerChannel } from '@/chat-api/services/ServerService';
import Modal from '@/components/ui/Modal';
import { Channel } from '@/chat-api/store/useChannels';
import Checkbox from '@/components/ui/Checkbox';
import { addBit, CHANNEL_PERMISSIONS, getAllPermissions, removeBit } from '@/chat-api/Bitwise';
import DeleteConfirmModal from '@/components/ui/delete-confirm-modal/DeleteConfirmModal';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';

type ChannelParams = {
  serverId: string;
  channelId: string;  
}

export default function ServerSettingsChannel() {
  const params = useParams<ChannelParams>();
  const { header, channels } = useStore();
  const createPortal = useCustomPortal();

  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);

  const channel = () => channels.get(params.channelId);
  
  const defaultInput = () => ({
    name: channel()?.name || '',
    permissions: channel()?.permissions || 0,
  })
  
  
  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);
  
  const permissions = () => getAllPermissions(CHANNEL_PERMISSIONS, inputValues().permissions);


  
  createEffect(on(channel, () => {
    header.updateHeader({
      title: "Settings - " + channel()?.name,
      serverId: params.serverId!,
      iconName: 'settings',
    });
  }))


  const onSaveButtonClicked = async () => {
    if (saveRequestSent()) return;
    setSaveRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServerChannel(params.serverId!, channel()?.id!, values)
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  }


  const saveRequestStatus = () => saveRequestSent() ? 'Saving...' : 'Save Changes';


  const onPermissionChanged = (checked: boolean, bit: number) => {
    let newPermission = inputValues().permissions;
    if (checked) {
      newPermission = addBit(newPermission, bit);
    }
    if (!checked) {
      newPermission = removeBit(newPermission, bit);
    }
    setInputValue("permissions", newPermission);
  }

  const showDeleteConfirmModal = () => {
    createPortal?.(close => <Modal {...close} title={`Delete ${channel()?.name}`} children={() => <ChannelDeleteConfirmModal close={close} channel={channel()!} />} />)
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
      <SettingsBlock icon='delete' label='Delete this channel' description='This cannot be undone!'>
        <Button label='Delete Channel' color='var(--alert-color)' onClick={showDeleteConfirmModal} />
      </SettingsBlock>
      {/* Errors & buttons */}
      <Show when={error()}><div class={styles.error}>{error()}</div></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={saveRequestStatus()} class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>
    </div>
  )
}

function ChannelDeleteConfirmModal(props: {channel: Channel, close: () => void}) {
  const params = useParams();
  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!props.channel) {
      props.close();
    }
  })

  
  const onDeleteClick = async () => {
    setError(null);
    deleteServerChannel(props.channel?.serverId!, props.channel.id).then(() => {
      const path = RouterEndpoints.SERVER_SETTINGS_CHANNELS(params.serverId!);
      navigate(path);
    }).catch(err => {
      setError(err.message);
    })
  }

  return (
    <DeleteConfirmModal 
      errorMessage={error()}
      confirmText={props.channel?.name}
      onDeleteClick={onDeleteClick}
    />
  )
}