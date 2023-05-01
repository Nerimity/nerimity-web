import styles from './styles.module.scss';
import { copyToClipboard } from "@/common/clipboard";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu/ContextMenu";
import { createSignal, For} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Modal from '@/components/ui/Modal'
import { ServerRole } from "@/chat-api/store/useServerRoles";
import Checkbox from "@/components/ui/Checkbox";
import { BanServerMember, kickServerMember, updateServerMember } from '@/chat-api/services/ServerService';
import { useCustomPortal } from '@/components/ui/custom-portal/CustomPortal';
import { ServerMember } from '@/chat-api/store/useServerMembers';
import Button from '@/components/ui/Button';
import { ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import { RawUser } from '@/chat-api/RawData';
import { useNavigate } from '@solidjs/router';
import RouterEndpoints from '@/common/RouterEndpoints';
import { FlexRow } from '../ui/Flexbox';
import { classNames, conditionalClass } from '@/common/classNames';
import Icon from '../ui/icon/Icon';
type Props = Omit<ContextMenuProps, 'items'> & {
  serverId?: string
  userId: string
  user?: RawUser
}

export default function MemberContextMenu(props: Props) {
  const { serverMembers, servers, account, users } = useStore();
  const {createPortal} = useCustomPortal()

  const navigate = useNavigate();
  
  const selfMember = () => props.serverId ? serverMembers.get(props.serverId, account.user()?.id!) : undefined;
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
    const hasManageRolePermission = AmIServerCreator || selfMember()?.hasPermission(ROLE_PERMISSIONS.MANAGE_ROLES);
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

    const hasKickPermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.KICK);
    const hasBanPermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.BAN);

     let createArr = [];
     if (hasBanPermission || hasKickPermission) {
      createArr.push(separator);
     }
     hasKickPermission && createArr.push(kick)
     hasBanPermission && createArr.push(ban)
     return createArr;
    
  }


  const onEditRoleClick = () => {
    createPortal?.(close => <Modal maxHeight={500} maxWidth={350} close={close}  title="Edit Roles" children={() => <ServerMemberRoleModal {...props} />} />)
  }

  const onKickClick = () => {
    console.log(member())
    createPortal?.(close =>  <KickModal close={close} member={member()!} />)
  }
  const onBanClick = () => {
    const user = props.user! || member()?.user
    createPortal?.(close => <BanModal close={close} user={user} serverId={props.serverId!} />)
  }


  return (
    <>
      <ContextMenu {...props} items={[
        { label: "View Profile", icon: "person", onClick: () => navigate(RouterEndpoints.PROFILE(props.userId)) },
        { label: "Send Message", icon: "message", onClick: () => users.openDM(props.userId) },
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

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label='Back' iconName='arrow_back' onClick={props.close}/>
      <Button label={requestSent() ? 'Kicking...' :'Kick'} iconName='exit_to_app' color='var(--alert-color)' onClick={onKickClick}/>
    </FlexRow>
  )

  return (
    <Modal close={props.close} title={`Kick ${props.member?.user.username}`} actionButtons={ActionButtons}>
      <div class={styles.kickModal}>
        <div>Are you sure you want to kick <b>{props.member?.user?.username || ""}</b>?</div>
        <div class={styles.buttons}>
        </div>
      </div>
    </Modal>
  )
}

function BanModal (props: {user: RawUser, serverId: string, close: () => void}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [shouldDeleteRecentMessages, setShouldDeleteRecentMessages] = createSignal<boolean>(false);

  const onBanClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await BanServerMember(props.serverId, props.user.id, shouldDeleteRecentMessages()).finally(() => {
      setRequestSent(false);
    });
    props.close();
  }


  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label='Back' iconName='arrow_back' onClick={props.close}/>
      <Button label={requestSent() ? 'Banning...' :'Ban'}  iconName='block' color='var(--alert-color)' onClick={onBanClick}/>
    </FlexRow>
  )


  return (
    <Modal close={props.close} title={`Ban ${props.user.username}`}  actionButtons={ActionButtons}>
      <div class={styles.kickModal}>
        <div style={{"margin-bottom": "15px"}}>Are you sure you want to ban <b>{props.user?.username || ""}</b>?</div>
        <Checkbox 
          checked={shouldDeleteRecentMessages()}
          onChange={setShouldDeleteRecentMessages}
          label='Delete messages sent in the past 7 hours.'
        />
      </div>
    </Modal>
  )
}


export function ServerMemberRoleModal (props: Props) {
  const {serverRoles, servers} = useStore();
  const server = () => servers.get(props.serverId!);
  const roles = () => serverRoles.getAllByServerId(props.serverId!);
  const rolesWithoutDefault = () => roles().filter(role => role!.id !== server()?.defaultRoleId!);

  return (
    <div class={styles.roleModalContainer}>
      <For each={rolesWithoutDefault()}>
        {role => <RoleItem role={role!} userId={props.userId} />}
      </For>
    </div>
  )
}

function RoleItem (props: {role: ServerRole, userId: string}) {
  const {serverMembers} = useStore();
  const [requestSent, setRequestSent] = createSignal(false);

  const member = () => serverMembers.get(props.role.serverId, props.userId);
  const hasRole = () => member()?.hasRole(props.role.id) || false;

  const onRoleClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    const checked = !hasRole();
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
    <div class={classNames(styles.roleItem, conditionalClass(hasRole(), styles.selected))} onclick={onRoleClicked} >
      <div class={styles.checkbox} style={{background: props.role.hexColor}}>
        <Icon name='done' size={12} class={styles.icon} />
      </div>
      <div class={styles.label}>{props.role.name}</div>
    </div>
  )
}