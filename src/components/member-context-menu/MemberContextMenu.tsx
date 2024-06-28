import styles from "./styles.module.scss";
import { copyToClipboard } from "@/common/clipboard";
import ContextMenu, { ContextMenuProps } from "@/components/ui/context-menu/ContextMenu";
import { createEffect, createSignal, For, Show} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import Modal from "@/components/ui/modal/Modal";
import { ServerRole } from "@/chat-api/store/useServerRoles";
import Checkbox from "@/components/ui/Checkbox";
import { BanServerMember, kickServerMember, updateServerMember, updateServerMemberProfile } from "@/chat-api/services/ServerService";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import Button from "@/components/ui/Button";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { RawUser } from "@/chat-api/RawData";
import { useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { FlexRow } from "../ui/Flexbox";
import { classNames, conditionalClass } from "@/common/classNames";
import Icon from "../ui/icon/Icon";
import { t  } from "i18next";
import { Trans } from "@mbarzda/solid-i18next";
import Input from "../ui/input/Input";
import { Notice } from "../ui/Notice/Notice";
import Text from "../ui/Text";
type Props = Omit<ContextMenuProps, "items"> & {
  serverId?: string
  userId: string
  user?: RawUser
}

export default function MemberContextMenu(props: Props) {
  const { serverMembers, servers, account, users } = useStore();
  const {createPortal} = useCustomPortal();

  const navigate = useNavigate();

  const selfMember = () => props.serverId ? serverMembers.get(props.serverId, account.user()?.id!) : undefined;
  const member = () => props.serverId ? serverMembers.get(props.serverId, props.userId) : undefined;
  const server = () => props.serverId ? servers.get(props.serverId) : undefined;

  const adminItems = () => {
    if (!props.serverId) return [];

    const editRoles = { label: t("userContextMenu.editRoles"), icon: "leaderboard", onClick: onEditRoleClick };
    const separator = { separator: true };
    const kick = { label: t("userContextMenu.kick"), alert: true, icon: "exit_to_app", onClick: onKickClick };
    const ban = { label: t("userContextMenu.ban"), alert: true, icon: "block", onClick: onBanClick };
    const nickname = { label: t("userContextMenu.changeNickname"), icon: "edit", onClick: onNicknameClick };

    const isCurrentUserCreator = server()?.isCurrentUserCreator();
    const clickedOnMyself = props.userId === account.user()?.id;
    const items: any = [];

    const hasAdminPermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.ADMIN);
    const hasNicknamePermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.NICKNAME_MEMBER);
    if (hasNicknamePermission && (hasAdminPermission || clickedOnMyself)) {
      items.push(nickname);
    }
    const hasManageRolePermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.MANAGE_ROLES);
    if (hasManageRolePermission) {
      items.push(editRoles);
    }

    const isMemberServerCreator = props.userId === server()?.createdById;
    if (isMemberServerCreator) return items;


    if (clickedOnMyself) return items;




    if (isCurrentUserCreator) {
      return [
        ...(hasNicknamePermission ? [nickname] : []),
        ...(member() ? [editRoles] : []),
        separator,
        ...(member() ? [kick] : []),
        ban
      ];
    }




    const hasKickPermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.KICK);
    const hasBanPermission = selfMember()?.hasPermission(ROLE_PERMISSIONS.BAN);

    const createArr = [];



    if (hasBanPermission || hasKickPermission) {
      createArr.push(separator);
    }
    hasKickPermission && createArr.push(kick);
    hasBanPermission && createArr.push(ban);
    return createArr;

  };


  const onEditRoleClick = () => {
    createPortal?.(close => <ServerMemberRoleModal close={close} {...props} />);
  };

  const onKickClick = () => {
    createPortal?.(close =>  <KickModal close={close} member={member()!} />);
  };
  const onBanClick = () => {
    const user = props.user! || member()?.user();
    createPortal?.(close => <BanModal close={close} user={user} serverId={props.serverId!} />);
  };
  const onNicknameClick = () => {
    createPortal?.(close => <ServerNicknameModal close={close} member={member()!} />);
  };


  return (
    <>
      <ContextMenu {...props} items={[
        { label: t("userContextMenu.viewProfile"), icon: "person", onClick: () => navigate(RouterEndpoints.PROFILE(props.userId)) },
        { label: t("userContextMenu.sendMessage"), icon: "message", onClick: () => users.openDM(props.userId) },
        ...adminItems(),
        { separator: true },
        { icon: "content_copy", label: t("userContextMenu.copyId"), onClick: () => copyToClipboard(props.userId) }
      ]} />
    </>
  );
}

function KickModal (props: {member: ServerMember, close: () => void}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const onKickClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await kickServerMember(props.member.serverId, props.member.userId).finally(() => {
      setRequestSent(false);
    });
    props.close();
  };

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label={t("kickServerMemberModal.backButton")} iconName='arrow_back' onClick={props.close}/>
      <Button label={requestSent() ? t("kickServerMemberModal.kicking") :t("kickServerMemberModal.kickButton")} iconName='exit_to_app' color='var(--alert-color)' onClick={onKickClick}/>
    </FlexRow>
  );

  return (
    <Modal close={props.close} title={t("kickServerMemberModal.title", {username: props.member?.user().username})} actionButtons={ActionButtons}>
      <div class={styles.kickModal}>
        <Trans key='kickServerMemberModal.message' options={{username: props.member?.user().username}}>
          Are you sure you want to kick <b>{"username"}</b>?
        </Trans>
        <div class={styles.buttons} />
      </div>
    </Modal>
  );
}




function ServerNicknameModal (props: {member: ServerMember, close: () => void}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [nickname, setNickname] = createSignal(props.member.nickname || "");

  const onUpdate = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await updateServerMemberProfile(props.member.serverId, props.member.userId, {
      nickname: !nickname().trim() ? null : nickname().trim()
    })
      .then(() => {
        props.close();
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setRequestSent(false);
      });

  };

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label={t("kickServerMemberModal.backButton")} iconName='arrow_back' onClick={props.close}/>
      <Button label={requestSent() ? "Saving..." :"Save Changes"} iconName='save' primary onClick={onUpdate}/>
    </FlexRow>
  );

  return (
    <Modal close={props.close} title={"Update Server Profile"} actionButtons={ActionButtons}>
      <div class={styles.kickModal} style={{"margin": "10px"}}>
        <Notice style={{"margin-bottom": "10px"}} type="info" description="Everyone in the server will see this nickname." />
        <Input label="Nickname" value={nickname()} onText={setNickname} />
        <Show when={error()}><Text color="var(--alert-color)">{error()}</Text></Show>
      </div>
    </Modal>
  );
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
  };


  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button label='Back' iconName='arrow_back' onClick={props.close}/>
      <Button label={requestSent() ? t("banModal.banning") :t("banModal.banButton")}  iconName='block' color='var(--alert-color)' onClick={onBanClick}/>
    </FlexRow>
  );


  return (
    <Modal close={props.close} title={t("banModal.title", {username: props.user.username})}  actionButtons={ActionButtons}>
      <div class={styles.kickModal}>
        <div style={{"margin-bottom": "15px"}}>
          <Trans key='banModal.message' options={{username: props.user.username}}>
          Are you sure you want to ban <b>{"username"}</b>?
          </Trans>
        </div>
        <Checkbox
          checked={shouldDeleteRecentMessages()}
          onChange={setShouldDeleteRecentMessages}
          label={t("banModal.deletePastMessagesCheckbox")}
        />
      </div>
    </Modal>
  );
}


export function ServerMemberRoleModal (props: Props & {close: () => void}) {
  const {serverRoles, serverMembers, servers, account} = useStore();
  const server = () => servers.get(props.serverId!);
  const roles = () => serverRoles.getAllByServerId(props.serverId!);

  const selfMember = () => serverMembers.get(props.serverId!, account.user()?.id!);
  const selfTopRole = () => selfMember()?.topRole();


  const rolesThatCanBeApplied = () => roles().filter(role => {
    if (role!.id === server()?.defaultRoleId!) return false;
    if (selfMember()?.server().isCurrentUserCreator()) return true;
    if (role!.order >= selfTopRole()?.order!) return false;

    return true;
  });

  return (
    <Modal maxHeight={500} maxWidth={350} class={styles.roleModal} close={props.close} title="Edit Roles">
      <div class={styles.roleModalContainer}>
        <For each={rolesThatCanBeApplied()}>
          {role => <RoleItem role={role!} userId={props.userId} />}
        </For>
      </div>
    </Modal>
  );
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
      newRoleIds = member()?.roleIds.filter(roleId => roleId !== props.role.id)!;
    }
    if (checked) {
      newRoleIds = [...member()?.roleIds!, props.role.id];
    }
    await updateServerMember(props.role.serverId, props.userId, {roleIds: newRoleIds}).finally(() => setRequestSent(false));
  };

  return (
    <div class={classNames(styles.roleItem, conditionalClass(hasRole(), styles.selected))} onClick={onRoleClicked} >
      <div class={styles.checkbox} style={{background: props.role.hexColor}}>
        <Icon name='done' size={12} class={styles.icon} />
      </div>
      <div class={styles.label}>{props.role.name}</div>
    </div>
  );
}