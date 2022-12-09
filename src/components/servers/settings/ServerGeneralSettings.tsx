import { useParams } from '@nerimity/solid-router';
import { createEffect, createSignal, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { useWindowProperties } from '@/common/useWindowProperties';
import Input from '@/components/ui/input/Input';
import DropDown from '@/components/ui/drop-down/DropDown';
import Button from '@/components/ui/Button';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import { deleteServer, updateServerSettings } from '@/chat-api/services/ServerService';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import { Server } from '@/chat-api/store/useServers';
import DeleteConfirmModal from '@/components/ui/delete-confirm-modal/DeleteConfirmModal';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import Text from '@/components/ui/Text';
import { css, styled } from 'solid-styled-components';
import { FlexRow } from '@/components/ui/Flexbox';
import Icon from '@/components/ui/icon/Icon';
import { Notice } from '@/components/ui/Notice';

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

export default function ServerGeneralSettings() {
  const params = useParams<{serverId: string}>();
  const {header, servers, channels} = useStore();
  const windowProperties = useWindowProperties();
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const createPortal = useCustomPortal();
  const server = () => servers.get(params.serverId);

  const defaultInput = () => ({
    name: server()?.name || '',
    defaultChannelId: server()?.defaultChannelId || '',
    systemChannelId: server()?.systemChannelId || null
  })

  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);

  const dropDownChannels = () => channels.getChannelsByServerId(params.serverId).map(channel => ({
    id: channel!.id,
    label: channel!.name,
    onClick: () => {
      setInputValue('defaultChannelId', channel!.id);
    }
  }));

  const dropDownSystemChannels = () => {
    const list = channels.getChannelsByServerId(params.serverId).map(channel => ({
      id: channel!.id,
      label: channel!.name,
      onClick: () => {
        setInputValue('systemChannelId', channel!.id);
      }
    }));

    return [{
      id: null,
      label: "None",
      onClick: () => {
        setInputValue("systemChannelId", null);
      }
    }, ...list]
  };

  createEffect(() => {
    header.updateHeader({
      title: "Settings - General",
      serverId: params.serverId!,
      iconName: 'settings',
    });
  })

  const onSaveButtonClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServerSettings(params.serverId!, values)
      .catch((err) => setError(err.message))
      .finally(() => setRequestSent(false));
  }

  const requestStatus = () => requestSent() ? 'Saving...' : 'Save Changes';

  const showDeleteConfirm = () => {
    createPortal?.(close => <ServerDeleteConfirmModal close={close} server={server()!} />)
  }

  return (
    <Container>
      <Text size={24} style={{"margin-bottom": "10px"}}>Server General</Text>

      <Show when={server()?.verified}>
        <Notice class={css`margin-bottom: 10px;`} type='warn' description="You will lose all of the perks of having your server verified if you rename it."/>

      </Show>
      
      <SettingsBlock icon='edit' label='Server Name'>
        <Input value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </SettingsBlock>
      <SettingsBlock icon='tag' label='Default Channel' description='New members will be directed to this channel.'>
        <DropDown items={dropDownChannels()} selectedId={inputValues().defaultChannelId} />
      </SettingsBlock>
        
      <SettingsBlock icon="wysiwyg" label="System Messages" description="Where system messages should appear.">
        <DropDown items={dropDownSystemChannels()} selectedId={inputValues().systemChannelId}  />
      </SettingsBlock>

      
      <SettingsBlock icon='delete' label='Delete this server' description='This cannot be undone!'>
        <Button label='Delete Server' color='var(--alert-color)' onClick={showDeleteConfirm} />
      </SettingsBlock>

      <Show when={error()}><Text size={12} color="var(--alert-color)" style={{"margin-top": "5px"}}>{error()}</Text></Show>

      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={requestStatus()} class={css`align-self: flex-end;`} onClick={onSaveButtonClicked} />
      </Show>
    </Container>
  )
}

function ServerDeleteConfirmModal(props: {server: Server, close: () => void;}) {
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!props.server) {
      props.close();
    }
  })
  
  const onDeleteClick = async () => {
    setError(null);

    deleteServer(props.server.id)
      .catch(e => setError(e))
  }

  return (
    <DeleteConfirmModal
      title={`Delete ${props.server?.name}`} 
      close={props.close}
      errorMessage={error()}
      confirmText={props.server?.name}
      onDeleteClick={onDeleteClick}
    />
  )
}
