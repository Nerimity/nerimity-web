import styles from './styles.module.scss';
import { navigate } from "solid-named-router";
import { copyToClipboard } from "@/common/clipboard";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu";
import { createSignal, For} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Modal from '@/components/ui/modal'
import { ServerRole } from "@/chat-api/store/useServerRoles";
import Checkbox from "@/components/ui/checkbox";
import { BanServerMember, kickServerMember, updateServerMember } from '@/chat-api/services/ServerService';
import { useCustomPortal } from '@/components/ui/custom-portal';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import Button from '@/components/ui/button';
import { createStore } from 'solid-js/store';
type Props = Omit<ContextMenuProps, 'items'> & {
  serverId: string
  userId: string
}

export default function ContextMenuServerMember(props: Props) {
  const { serverMembers } = useStore();
  const createPortal = useCustomPortal()

  
  const member = () => serverMembers.get(props.serverId, props.userId)


  const onEditRoleClick = () => {
    createPortal?.(close => <Modal {...close}  title="Edit Roles" component={() => <RoleModal {...props} />} />)
  }

  const onKickClick = () => {
    createPortal?.(close => <Modal {...close}  title={`Kick ${member()?.user.username}`} component={() => <KickModal close={close} member={member()!} />} />)
  }
  const onBanClick = () => {
    createPortal?.(close => <Modal {...close}  title={`Ban ${member()?.user.username}`} component={() => <BanModal close={close} member={member()!} />} />)
  }


  return (
    <>
      <ContextMenu {...props} items={[
        { label: "View Profile", icon: "person" },
        { label: "Edit Roles", icon: "leaderboard", onClick: onEditRoleClick },
        { separator: true },
        { label: "Kick", alert: true, icon: "exit_to_app", onClick: onKickClick },
        { label: "Ban", alert: true, icon: "block", onClick: onBanClick },
        { separator: true },
        { icon: 'copy', label: "Copy ID", onClick: () => copyToClipboard(props.userId) },
      ]} />
    </>
  )
}

function KickModal (props: {member: ServerMember, close: () => void}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const onKickClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await kickServerMember(props.member.serverId, props.member.userId).finally(() => {
      setRequestSent(false);
    })
    props.close();
  }
  return (
    <div class={styles.kickModal}>
      <div>Are you sure you want to kick <b>{props.member?.user?.username || ""}</b>?</div>
      <div class={styles.buttons}>
        <Button label='Back' iconName='arrow_back' onClick={props.close}/>
        <Button label={requestSent() ? 'Kicking...' :'Kick'} iconName='exit_to_app' color='var(--alert-color)' onClick={onKickClick}/>
      </div>
    </div>
  )
}

function BanModal (props: {member: ServerMember, close: () => void}) {
  const [requestSent, setRequestSent] = createSignal(false);

  const onBanClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await BanServerMember(props.member.serverId, props.member.userId).finally(() => {
      setRequestSent(false);
    });
    props.close();
  }
  return (
    <div class={styles.kickModal}>
      <div>Are you sure you want to ban <b>{props.member?.user?.username || ""}</b>?</div>
      <div class={styles.buttons}>
        <Button label='Back' iconName='arrow_back' onClick={props.close}/>
        <Button label={requestSent() ? 'Banning...' :'Ban'}  iconName='block' color='var(--alert-color)' onClick={onBanClick}/>
      </div>
    </div>
  )
}


function RoleModal (props: Props) {
  const {serverRoles, servers} = useStore();
  const server = () => servers.get(props.serverId);
  const roles = () => serverRoles.getAllByServerId(props.serverId);
  const rolesWithoutDefault = () => roles().filter(role => role!.id !== server()?.defaultRoleId!);

  return (
    <For each={rolesWithoutDefault()}>
      {role => <RoleItem role={role!} userId={props.userId} />}
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