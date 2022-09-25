import styles from './styles.module.scss';
import { useNavigate } from "@solidjs/router";
import { copyToClipboard } from "@/common/clipboard";
import RouterEndpoints from "@/common/RouterEndpoints";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Modal from '@/components/ui/modal'
import { ServerRole } from "@/chat-api/store/useServerRoles";
import Checkbox from "@/components/ui/checkbox";
import { updateServerMember } from '@/chat-api/services/ServerService';
import { useCustomPortal } from '@/components/ui/custom-portal';
type Props = Omit<ContextMenuProps, 'items'> & {
  serverId: string
  userId: string
}

export default function ContextMenuServerMember(props: Props) {
  const navigate = useNavigate();
  const { servers } = useStore();
  const createPortal = useCustomPortal()





  const onEditRoleClick = () => {
    createPortal?.(close => <Modal title="Edit Roles" component={() => <RoleModal {...props} />} />)
  }


  return (
    <>
      <ContextMenu {...props} items={[
        { label: "View Profile", icon: "person" },
        { label: "Edit Roles", icon: "leaderboard",onClick: onEditRoleClick },
        { separator: true },
        { label: "Kick", alert: true, icon: "exit_to_app" },
        { label: "Ban", alert: true, icon: "block" },
        { separator: true },
        { icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.userId) },
      ]} />
    </>
  )
}

function RoleModal (props: Props) {
  const {serverRoles, servers} = useStore();
  const server = () => servers.get(props.serverId);
  const roles = () => serverRoles.getAllByServerId(props.serverId);
  const rolesWithoutDefault = () => roles().filter(role => role.id !== server()?.defaultRoleId!);

  return (
    <For each={rolesWithoutDefault()}>
      {role => <RoleItem role={role} userId={props.userId} />}
    </For>
  )
}

function RoleItem (props: {role: ServerRole, userId: string}) {
  const {serverMembers} = useStore();
  const [requestSent, setRequestSent] = createSignal(false);

  const member = () => serverMembers.get(props.role.serverId, props.userId);
  const hasRole = () => member()?.hasRole(props.role.id) || false;

  const onRoleClicked = async (checked: boolean) => {
    if (requestSent()) return;
    setRequestSent(true);
    let newRoleIds: string[] = [];
    if (!checked) {
      newRoleIds = member()?.roleIds.filter(roleId => roleId !== props.role.id)!
    }
    if (checked) {
      newRoleIds = [...member()?.roleIds!, props.role.id];
    }
    await updateServerMember(props.role.serverId, props.userId, {roleIds: newRoleIds}).finally(() => setRequestSent(false));
  }

  return (
    <div class={styles.roleItem}>
      <Checkbox checked={hasRole()} onChange={onRoleClicked} disableLocalUpdate={true} />
      <div class={styles.label} style={{color: props.role.hexColor}}>{props.role.name}</div>
    </div>
  )
}