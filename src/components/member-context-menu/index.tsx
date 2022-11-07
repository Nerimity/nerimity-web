import styles from './styles.module.scss';
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
import { ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import { RawUser } from '@/chat-api/RawData';
type Props = Omit<ContextMenuProps, 'items'> & {
  serverId?: string
  userId: string
  user?: RawUser
}

export default function MemberContextMenu(props: Props) {
  const { serverMembers, servers, account } = useStore();
  const createPortal = useCustomPortal()

  
  const member = () => props.serverId ? serverMembers.get(props.serverId, props.userId) : undefined;
  const server = () => props.serverId ? servers.get(props.serverId) : undefined;

  const adminItems = () => {
    if (!props.serverId) return [];

    const editRoles = { label: "Edit Roles", icon: "leaderboard", onClick: onEditRoleClick };
    const separator = { separator: true }
    const kick = { label: "Kick", alert: true, icon: "exit_to_app", onClick: onKickClick };
    const ban = { label: "Ban", alert: true, icon: "block", onClick: onBanClick };

    const AmIServerCreator = server()?.createdById === account.user()?.id;
    const items: any = [];
    const hasManageRolePermission = AmIServerCreator || member()?.hasPermission(ROLE_PERMISSIONS.MANAGE_ROLES);
    if (hasManageRolePermission) {
      items.push(editRoles);
    }

    const isMemberServerCreator = props.userId === server()?.createdById;
    if (isMemberServerCreator) return items;
    const clickedOnMyself = props.userId === account.user()?.id;
    if (clickedOnMyself) return items;


    if (AmIServerCreator) {
      return [
        ...(member() ? [editRoles] : []),
        separator,
        ...(member() ? [kick] : []),
        ban,
      ]
    }

    const hasKickPermission = member()?.hasPermission(ROLE_PERMISSIONS.KICK);
    const hasBanPermission = member()?.hasPermission(ROLE_PERMISSIONS.BAN);

     let createArr = [];
     if (hasBanPermission || hasKickPermission) {
      createArr.push(separator);
     }
     hasKickPermission && createArr.push(kick)
     hasBanPermission && createArr.push(ban)
     return createArr;
    
  }


  const onEditRoleClick = () => {
    createPortal?.(close => <Modal {...close}  title="Edit Roles" component={() => <RoleModal {...props} />} />)
  }

  const onKickClick = () => {
    createPortal?.(close => <Modal {...close}  title={`Kick ${member()?.user.username}`} component={() => <KickModal close={close} member={member()!} />} />)
  }
  const onBanClick = () => {
    const user = props.user! || member()?.user
    createPortal?.(close => <Modal {...close}  title={`Ban ${user.username}`} component={() => <BanModal close={close} user={user} serverId={props.serverId!} />} />)
  }


  return (
    <>
      <ContextMenu {...props} items={[
        { label: "View Profile", icon: "person" },
        ...adminItems(),
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

function BanModal (props: {user: RawUser, serverId: string, close: () => void}) {
  const [requestSent, setRequestSent] = createSignal(false);

  const onBanClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await BanServerMember(props.serverId, props.user.id).finally(() => {
      setRequestSent(false);
    });
    props.close();
  }
  return (
    <div class={styles.kickModal}>
      <div>Are you sure you want to ban <b>{props.user?.username || ""}</b>?</div>
      <div class={styles.buttons}>
        <Button label='Back' iconName='arrow_back' onClick={props.close}/>
        <Button label={requestSent() ? 'Banning...' :'Ban'}  iconName='block' color='var(--alert-color)' onClick={onBanClick}/>
      </div>
    </div>
  )
}


function RoleModal (props: Props) {
  const {serverRoles, servers} = useStore();
  const server = () => servers.get(props.serverId!);
  const roles = () => serverRoles.getAllByServerId(props.serverId!);
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