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
type Props = Omit<ContextMenuProps, 'items'> & {
  serverId: string
  userId: string
}

export default function ContextMenuServerMember(props: Props) {
  const navigate = useNavigate();

  const { account, servers } = useStore();

  const server = () => servers.get(props.serverId!);

  const isServerCreator = () => account.user()?.id === server()?.createdById;


  const [roleModal, setRoleModal] = createSignal(false);


  return (
    <>
    <Modal show={roleModal()} title="Edit Roles" component={() => <RoleModal {...props} />} />
      <ContextMenu {...props} items={[
        { label: "View Profile" },
        { label: "Edit Roles", onClick: () => setRoleModal(true) },
        { separator: true },
        { label: "Kick", alert: true },
        { label: "Ban", alert: true },
        { separator: true },
        { icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.userId) },
      ]} />
    </>
  )
}

function RoleModal (props: Props) {
  const {serverRoles} = useStore();
  const roles = () => serverRoles.getAllByServerId(props.serverId);
  return (
    <For each={roles()}>
      {role => <RoleItem role={role} userId={props.userId} />}
    </For>
  )
}

function RoleItem (props: {role: ServerRole, userId: string}) {
  const {serverMembers} = useStore();

  const member = () => serverMembers.get(props.role.serverId, props.userId);
  const hasRole = () => member()?.hasRole(props.role.id) || false;
  return (
    <div class={styles.roleItem}>
      <Checkbox checked={hasRole()} />
      <div class={styles.label} style={{color: props.role.hexColor}}>{props.role.name}</div>
    </div>
  )
}