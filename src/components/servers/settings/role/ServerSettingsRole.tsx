import styles from './styles.module.scss';
import RouterEndpoints from '@/common/RouterEndpoints';
import { useNavigate, useParams } from '@nerimity/solid-router';
import { createEffect,  createSignal,  For,  on, Show,} from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { createUpdatedSignal } from '@/common/createUpdatedSignal';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Input from '@/components/ui/input/Input';
import Button from '@/components/ui/Button';
import { deleteServerRole, updateServerRole } from '@/chat-api/services/ServerService';
import Modal from '@/components/ui/Modal';
import Checkbox from '@/components/ui/Checkbox';
import { addBit, getAllPermissions, removeBit, ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import DeleteConfirmModal from '@/components/ui/delete-confirm-modal/DeleteConfirmModal';
import { ServerRole } from '@/chat-api/store/useServerRoles';
import Icon from '@/components/ui/icon/Icon';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';

type RoleParams = {
  serverId: string;
  roleId: string;  
}

export default function ServerSettingsRole() {
  const params = useParams<RoleParams>();
  const { header, serverRoles } = useStore();

  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const createPortal = useCustomPortal();

  const role = () => serverRoles.get(params.serverId, params.roleId);

  const defaultInput = () => ({
    name: role()?.name || '',
    hexColor: role()?.hexColor || "#fff",
    permissions: role()?.permissions || 0,
    hideRole: role()?.hideRole || false
  })
  
  
  const [inputValues, updatedInputValues, setInputValue] = createUpdatedSignal(defaultInput);
  const permissions = () => getAllPermissions(ROLE_PERMISSIONS, inputValues().permissions);

  createEffect(on(role, () => {
    header.updateHeader({
      title: "Settings - " + role()?.name,
      serverId: params.serverId!,
      iconName: 'settings',
    });
  }))

  const onSaveButtonClicked = async () => {
    if (saveRequestSent()) return;
    setSaveRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServerRole(params.serverId!, role()?.id!, values)
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

  const showDeleteConfirm = () => {
    createPortal?.(close => <RoleDeleteConfirmModal close={close} role={role()!} />)
  }

  return (
    <div class={styles.channelPane}>
      {/* Role Name */}
      <SettingsBlock icon='edit' label='Role Name'>
        <Input value={inputValues().name} onText={(v) => setInputValue('name', v) } />
      </SettingsBlock>

      {/* Role Color */}
      <SettingsBlock icon='colorize' label='Role Color'>
        <ColorPicker color={inputValues().hexColor} onChange={v => setInputValue('hexColor', v)} />
      </SettingsBlock>

      {/* Hide Role */}
      <SettingsBlock icon='' label='Hide Role' description='Display members with this role along with all the default members'>
      <Checkbox checked={inputValues().hideRole} onChange={checked => setInputValue('hideRole', checked)} />
      </SettingsBlock>

      <div class={styles.permissions}>
        <SettingsBlock icon="security" label="Permissions" description="Manage permissions for this role." header={true} />
        <For each={ permissions()}>
          {(permission) => (
            <SettingsBlock icon={permission.icon} label={permission.name} description={permission.description} class={styles.permissionItem}>
              <Checkbox checked={permission.hasPerm} onChange={checked => onPermissionChanged(checked, permission.bit)} />
            </SettingsBlock>
          )}

        </For>
      </div>

      {/* Delete Role */}
      <SettingsBlock icon='delete' label='Delete this role' description='This cannot be undone!'>
        <Button label='Delete Role' color='var(--alert-color)' onClick={showDeleteConfirm} />
      </SettingsBlock>
      {/* Errors & buttons */}
      <Show when={error()}><div class={styles.error}>{error()}</div></Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button iconName='save' label={saveRequestStatus()} class={styles.saveButton} onClick={onSaveButtonClicked} />
      </Show>
    </div>
  )
}

function RoleDeleteConfirmModal(props: {role: ServerRole, close: () => void}) {
  const [error, setError] = createSignal<string | null>(null);
  const navigate = useNavigate();

  createEffect(() => {
    if (!props.role) {
      props.close();
    }
  })
  
  const onDeleteClick = async () => {
    setError(null);
    const serverId = props.role?.serverId!;
    deleteServerRole(serverId, props.role.id).then(() => {
      const path = RouterEndpoints.SERVER_SETTINGS_ROLES(serverId);
      navigate(path);
    }).catch(err => {
      setError(err.message);
    })
  }

  return (
    <DeleteConfirmModal
      close={props.close} 
      title={`Delete ${props.role?.name}`}
      errorMessage={error()}
      confirmText={props.role?.name}
      onDeleteClick={onDeleteClick}
    />
  )
}

function ColorPicker(props: {color: string, onChange?: (value: string) => void}) {
  let inputEl: undefined | HTMLInputElement

  const onClicked = () => {
    inputEl?.click();
  }
  const onChange = () => {
    props.onChange?.(inputEl?.value!)
  }

  return (
    <div class={styles.colorPicker} style={{background: props.color}} onclick={onClicked}>
      <Icon name='colorize' color='white' size={18} class={styles.icon} />
      <input style={{position: 'absolute', opacity: 0}} ref={inputEl}  type="color" value={props.color} onchange={onChange} />
    </div>
  )
}