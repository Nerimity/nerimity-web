import styles from './styles.module.scss';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useNavigate, useParams } from 'solid-app-router';
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



export default function ServerSettingsChannel() {
  const {serverId, id: channelId} = useParams();
  const { tabs, channels } = useStore();

  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [showDeleteConfirm, setDeleteConfirm] = createSignal(false);

  const channel = () => channels.get(channelId);


  const defaultInput = () => ({
    name: channel()?.name || '',
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);



  
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
    await updateServerChannel(serverId!, channel()?._id!, values)
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  }


  const saveRequestStatus = () => saveRequestSent() ? 'Saving...' : 'Save Changes';

  const permissions = () => channel()?.permissionList || [];


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
              <Checkbox checked={permission.hasPerm} />
            </SettingsBlock>
          )}

        </For>
      </div>
      {/* Delete Channel */}
      <Modal show={showDeleteConfirm() && !!channel()} title={`Delete ${channel()?.name}`} component={() => <DeleteConfirmModal channel={channel()!} />} />
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

function DeleteConfirmModal(props: {channel: Channel}) {
  const [confirmInput, setConfirmInput] = createSignal();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const params = useParams();
  const navigate = useNavigate();
  const {tabs} = useStore();
  
  const onDeleteClick = async () => {
    setError(null);
    if (confirmInput() !== props.channel.name) {
      setError('Please type the channel name to delete this channel.');
      return;
    }
    if (requestSent()) return;
    setRequestSent(true);
    deleteServerChannel(props.channel.server!, props.channel._id).then(() => {
      const path = RouterEndpoints.SERVER_SETTINGS_CHANNELS(params.serverId!);
      tabs.updateTab(location.pathname, {path})
      navigate(path);
      
    }).finally(() => setRequestSent(false));
  }

  const buttonMessage = () => requestSent() ? 'Deleting...' : `Delete ${props.channel.name}`;

  
  return (
    <div class={styles.deleteConfirmModal}>
      <div>Confirm by typing <span class={styles.highlight}>{props.channel?.name}</span> in the box below.</div>
      <Input error={error()} onText={v => setConfirmInput(v)} />
      <Button class={styles.button} iconName='delete' label={buttonMessage()} color="var(--alert-color)" onClick={onDeleteClick} />
    </div>
  )
}