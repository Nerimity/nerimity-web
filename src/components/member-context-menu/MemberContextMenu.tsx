import styles from "./styles.module.scss";
import { copyToClipboard } from "@/common/clipboard";
import ContextMenu, {
  ContextMenuProps
} from "@/components/ui/context-menu/ContextMenu";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { ServerRole } from "@/chat-api/store/useServerRoles";
import Checkbox from "@/components/ui/Checkbox";
import {
  BanServerMember,
  kickServerMember,
  muteServerMember,
  removeMuteServerMember,
  transferOwnership,
  updateServerMember,
  updateServerMemberProfile
} from "@/chat-api/services/ServerService";
import {
  toast,
  useCustomPortal
} from "@/components/ui/custom-portal/CustomPortal";
import { ServerMember } from "@/chat-api/store/useServerMembers";
import Button from "@/components/ui/Button";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { RawUser } from "@/chat-api/RawData";
import { useNavigate } from "solid-navigator";
import RouterEndpoints from "@/common/RouterEndpoints";
import { FlexRow } from "../ui/Flexbox";
import { classNames, conditionalClass } from "@/common/classNames";
import Icon from "../ui/icon/Icon";
import { t } from "@nerimity/i18lite";
import { Trans } from "@nerimity/solid-i18lite";
import Input from "../ui/input/Input";
import { Notice } from "../ui/Notice/Notice";
import Text from "../ui/Text";
import Avatar from "../ui/Avatar";
import { FlexColumn } from "../ui/Flexbox";
import { Modal } from "../ui/modal";
import { User } from "@/chat-api/store/useUsers";
import { Server } from "@/chat-api/store/useServers";
import {
  cachedVolumes,
  setCachedVolumes
} from "@/chat-api/store/useVoiceUsers";
import { RadioBox } from "../ui/RadioBox";
import {
  SteppedSlider,
  SteppedSliderStep
} from "../ui/stepped-slider/SteppedSlider";
import DeleteConfirmModal from "../ui/delete-confirm-modal/DeleteConfirmModal";
type Props = Omit<ContextMenuProps, "items"> & {
  serverId?: string;
  userId: string;
  user?: RawUser;
};

export default function MemberContextMenu(props: Props) {
  const { serverMembers, servers, account, users } = useStore();
  const { createPortal } = useCustomPortal();

  const navigate = useNavigate();

  const selfMember = () =>
    props.serverId
      ? serverMembers.get(props.serverId, account.user()?.id!)
      : undefined;
  const member = () =>
    props.serverId
      ? serverMembers.get(props.serverId, props.userId)
      : undefined;

  const memberUser = () => users.get(member()?.userId!);
  const server = () =>
    props.serverId ? servers.get(props.serverId) : undefined;

  const muted = () =>
    member()?.muteExpireAt && member()?.muteExpireAt! > Date.now();

  const adminItems = () => {
    if (!props.serverId) return [];

    const editRoles = {
      label: t("userContextMenu.editRoles"),
      icon: "leaderboard",
      onClick: onEditRoleClick
    };
    const separator = { separator: true };
    const kick = {
      label: t("kickServerMemberModal.kickButton"),
      alert: true,
      icon: "exit_to_app",
      onClick: onKickClick
    };
    const ban = {
      label: t("banModal.banButton"),
      alert: true,
      icon: "block",
      onClick: onBanClick
    };
    const mute = {
      label: t("muteModal.muteButton"),
      alert: true,
      icon: "volume_off",
      onClick: onMuteClick
    };
    const unmute = {
      label: t("muteModal.unmuteButton"),
      alert: true,
      icon: "volume_up",
      onClick: onUnmuteClick
    };
    const nickname = {
      label: t("userContextMenu.changeNickname"),
      icon: "edit",
      onClick: onNicknameClick
    };
    const transferOwnership = {
      label: t("userContextMenu.transferOwnership"),
      icon: "next_week",
      onClick: onTransferOwnershipClick,
      alert: true
    };

    const isCurrentUserCreator = server()?.isCurrentUserCreator();
    const clickedOnMyself = props.userId === account.user()?.id;
    const items: any = [];

    const hasNicknamePermission = (() => {
      const isAdmin = serverMembers.hasPermission(
        selfMember()!,
        ROLE_PERMISSIONS.ADMIN
      );
      const result = clickedOnMyself || isAdmin;
      return result;
    })();

    if (hasNicknamePermission) {
      items.push(nickname);
    }

    const hasManageRolePermission = serverMembers.hasPermission(
      selfMember()!,
      ROLE_PERMISSIONS.MANAGE_ROLES
    );
    if (hasManageRolePermission) {
      items.push(editRoles);
    }

    const isMemberServerCreator = props.userId === server()?.createdById;
    if (isMemberServerCreator) return items;

    if (clickedOnMyself) return items;

    if (isCurrentUserCreator) {
      const isBot = memberUser()?.bot;
      return [
        ...(hasNicknamePermission ? [nickname] : []),
        ...(member() ? [editRoles] : []),
        separator,
        ...(member() ? [kick] : []),
        ban,
        ...(muted() ? [unmute] : [mute]),
        ...(member() && !isBot ? [separator] : []),
        ...(member() && !isBot ? [transferOwnership] : [])
      ];
    }

    const hasKickPermission = serverMembers.hasPermission(
      selfMember()!,
      ROLE_PERMISSIONS.KICK
    );
    const hasBanPermission = serverMembers.hasPermission(
      selfMember()!,
      ROLE_PERMISSIONS.BAN
    );
    const hasAdminPermission = serverMembers.hasPermission(
      selfMember()!,
      ROLE_PERMISSIONS.ADMIN
    );

    const createArr = [];

    hasNicknamePermission && createArr.push(nickname);
    if (hasManageRolePermission) {
      createArr.push(editRoles);
    }
    if (hasBanPermission || hasKickPermission) {
      createArr.push(separator);
    }
    hasKickPermission && createArr.push(kick);
    hasBanPermission && createArr.push(ban);
    hasAdminPermission && createArr.push(muted() ? unmute : mute);
    return createArr;
  };

  const onEditRoleClick = () => {
    createPortal?.((close) => (
      <ServerMemberRoleModal close={close} {...props} />
    ));
  };

  const onKickClick = () => {
    createPortal?.((close) => <KickModal close={close} member={member()!} />);
  };
  const onBanClick = () => {
    const user = props.user! || memberUser();
    createPortal?.((close) => (
      <BanModal close={close} user={user} serverId={props.serverId!} />
    ));
  };

  const onUnmuteClick = () => {
    const user = props.user! || memberUser();
    createPortal?.((close) => (
      <DeleteConfirmModal
        close={close}
        title="Unmute"
        icon="volume_up"
        onDeleteClick={async () => {
          await removeMuteServerMember(props.serverId!, user.id).catch(
            (err) => {
              toast("Failed to unmute member: " + err.message);
            }
          );
        }}
        custom="Are you sure you want to unmute this user?"
        buttonText={{ main: "Unmute", loading: "Unmuting..." }}
      />
    ));
  };
  const onMuteClick = () => {
    const user = props.user! || memberUser();
    createPortal?.((close) => (
      <MuteModal close={close} user={user} serverId={props.serverId!} />
    ));
  };
  const onNicknameClick = () => {
    createPortal?.((close) => (
      <ServerNicknameModal close={close} member={member()!} />
    ));
  };
  const onTransferOwnershipClick = () => {
    createPortal?.((close) => (
      <TransferOwnershipModal close={close} member={member()!} />
    ));
  };

  return (
    <>
      <ContextMenu
        header={<Header userId={props.userId} />}
        {...props}
        items={[
          {
            label: t("userContextMenu.viewProfile"),
            icon: "person",
            onClick: () => navigate(RouterEndpoints.PROFILE(props.userId))
          },
          {
            label: t("userContextMenu.sendMessage"),
            icon: "comment",
            onClick: () => users.openDM(props.userId)
          },
          ...adminItems(),
          { separator: true },
          ...(account.hasModeratorPerm(true)
            ? [
                {
                  label: "Moderation Pane",
                  onClick: () =>
                    navigate("/app/moderation/users/" + props.userId),
                  icon: "security"
                }
              ]
            : []),
          {
            icon: "content_copy",
            label: t("general.copyID"),
            onClick: () => copyToClipboard(props.userId)
          }
        ]}
      />
    </>
  );
}

function Header(props: { userId: string }) {
  const setVoiceVolume = (volume: number) => {
    setCachedVolumes(props.userId, volume);
  };
  const voiceVolume = () => cachedVolumes[props.userId] || 1;

  const store = useStore();
  const user = () => store.users.get(props.userId);

  const voiceUser = () =>
    store.voiceUsers.getVoiceUser(
      store.voiceUsers.currentUser()?.channelId!,
      props.userId
    );
  const audio = () => voiceUser()?.audio;

  createEffect(
    on(audio, () => {
      const audio = voiceUser()?.audio;
      if (!audio) return;
      console.log(audio.volume);
      setVoiceVolume(audio.volume);
    })
  );

  const isMe = () => user()?.id === store.account.user()?.id;

  const onVolumeChange = (e: any) => {
    setVoiceVolume(Number(e.currentTarget?.value!));
    const audio = voiceUser()?.audio;
    if (!audio) return;
    audio.volume = Number(e.currentTarget?.value!);
  };

  return (
    <Show when={user()}>
      <div class={styles.header}>
        <div class={styles.headerDetails}>
          <Avatar user={user()} size={24} />
          <div class={styles.username}>{user()!.username}</div>
        </div>
      </div>

      <Show when={audio() && !isMe()}>
        <div class={styles.voiceVolume}>
          <div class={styles.label}>{t("userContextMenu.callVolume")}</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={voiceVolume()}
            onInput={onVolumeChange}
          />
        </div>
      </Show>
    </Show>
  );
}

function KickModal(props: { member: ServerMember; close: () => void }) {
  const [requestSent, setRequestSent] = createSignal(false);
  const store = useStore();
  const memberUser = () => store.users.get(props.member.userId);
  const onKickClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await kickServerMember(props.member.serverId, props.member.userId).finally(
      () => {
        setRequestSent(false);
      }
    );
    props.close();
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        label={t("general.backButton")}
        iconName="arrow_back"
        onClick={props.close}
      />
      <Button
        label={
          requestSent()
            ? t("kickServerMemberModal.kicking")
            : t("kickServerMemberModal.kickButton")
        }
        iconName="exit_to_app"
        color="var(--alert-color)"
        onClick={onKickClick}
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={t("kickServerMemberModal.title", {
        username: memberUser()?.username
      })}
      actionButtons={ActionButtons}
    >
      <div class={styles.kickModal}>
        <Trans
          key="kickServerMemberModal.message"
          options={{ username: memberUser()?.username }}
        >
          Are you sure you want to kick <b>{"username"}</b>?
        </Trans>
        <div class={styles.buttons} />
      </div>
    </LegacyModal>
  );
}

function ServerNicknameModal(props: {
  member: ServerMember;
  close: () => void;
}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [nickname, setNickname] = createSignal(props.member.nickname || "");

  const onUpdate = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await updateServerMemberProfile(
      props.member.serverId,
      props.member.userId,
      {
        nickname: !nickname().trim() ? null : nickname().trim()
      }
    )
      .then(() => {
        props.close();
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setRequestSent(false);
      });
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        label={t("general.backButton")}
        iconName="arrow_back"
        onClick={props.close}
      />
      <Button
        label={
          requestSent() ? t("general.saving") : t("general.saveChangesButton")
        }
        iconName="save"
        primary
        onClick={onUpdate}
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={t("nicknameChangeModal.title")}
      actionButtons={ActionButtons}
    >
      <div class={styles.kickModal} style={{ margin: "10px" }}>
        <Notice
          style={{ "margin-bottom": "10px" }}
          type="info"
          description={t("nicknameChangeModal.description")}
        />
        <Input
          label={t("nicknameChangeModal.inputLabel")}
          value={nickname()}
          onText={setNickname}
        />
        <Show when={error()}>
          <Text color="var(--alert-color)">{error()}</Text>
        </Show>
      </div>
    </LegacyModal>
  );
}

function TransferOwnershipModal(props: {
  member: ServerMember;
  close: () => void;
}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [password, setPassword] = createSignal(props.member.nickname || "");

  const store = useStore();

  const server = () => store.servers.get(props.member.serverId!);

  const memberUser = () => store.users.get(props.member.userId);

  const onUpdate = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    await transferOwnership(
      props.member.serverId!,
      password(),
      props.member.userId
    )
      .then(() => {
        props.close();
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setRequestSent(false);
      });
  };

  return (
    <Modal.Root close={props.close} doNotCloseOnBackgroundClick>
      <Modal.Header
        title={t("transferOwnershipModal.title")}
        icon="next_week"
        alert
      />
      <Modal.Body>
        <Notice
          style={{ "margin-bottom": "10px" }}
          type="caution"
          description={[
            t("transferOwnershipModal.description"),
            ...(server()?.verified
              ? [t("transferOwnershipModal.ifVerified")]
              : [])
          ]}
        />

        <div>{t("transferOwnershipModal.server")}</div>
        <TransferOwnershipOwnerBox server={server()} />
        <div>{t("transferOwnershipModal.newOwner")}</div>
        <TransferOwnershipOwnerBox user={memberUser()} />
        <Input
          label={t("registerPage.confirmPassword")}
          type="password"
          value={password()}
          onText={setPassword}
          primaryColor="var(--alert-color)"
        />
        <Show when={error()}>
          <Text color="var(--alert-color)">{error()}</Text>
        </Show>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("transferOwnershipModal.cancelButton")}
          iconName="arrow_back"
          onClick={props.close}
        />
        <Modal.Button
          label={
            requestSent()
              ? t("transferOwnershipModal.transferring")
              : t("transferOwnershipModal.transferButton")
          }
          alert
          iconName="next_week"
          primary
          onClick={onUpdate}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}

function TransferOwnershipOwnerBox(props: { user?: User; server?: Server }) {
  return (
    <div class={styles.transferOwnershipOwnerBox}>
      <Avatar user={props.user} server={props.server} size={38} />
      <Text>
        {props.server?.name || props.user.username}
        <Show when={props.user}>
          <span class={styles.tag}>:{props.user?.tag}</span>
        </Show>
      </Text>
    </div>
  );
}

function BanModal(props: {
  user: RawUser;
  serverId: string;
  close: () => void;
}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [shouldDeleteRecentMessages, setShouldDeleteRecentMessages] =
    createSignal<boolean>(false);
  const [reason, setReason] = createSignal("");

  const onBanClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);

    await BanServerMember(
      props.serverId,
      props.user.id,
      shouldDeleteRecentMessages(),
      reason() || undefined
    ).finally(() => setRequestSent(false));

    props.close();
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        label={t("general.backButton")}
        iconName="arrow_back"
        onClick={props.close}
      />
      <Button
        label={requestSent() ? t("banModal.banning") : t("banModal.banButton")}
        iconName="block"
        color="var(--alert-color)"
        onClick={onBanClick}
      />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title={t("banModal.title", { username: props.user.username })}
      actionButtons={ActionButtons}
    >
      <div class={styles.kickModal} style={{ "min-width": "330px" }}>
        <div style={{ "margin-bottom": "18px" }}>
          <Trans
            key="banModal.message"
            options={{ username: props.user.username }}
          >
            Are you sure you want to ban <b>{"username"}</b>?
          </Trans>
        </div>

        <FlexColumn style={{ "margin-bottom": "20px", width: "100%" }}>
          <Text size={13} opacity={0.8} style={{ "margin-bottom": "6px" }}>
            {t("banModal.reasonLabel") || "Reason (optional)"}
          </Text>
          <Input
            placeholder={t("banModal.reasonPlaceholder")}
            value={reason()}
            onInput={(e) => setReason(e.currentTarget.value)}
            style={{
              width: "100%",
              padding: "8px 10px"
            }}
          />
        </FlexColumn>

        <Checkbox
          checked={shouldDeleteRecentMessages()}
          onChange={setShouldDeleteRecentMessages}
          label={t("banModal.deletePastMessagesCheckbox")}
        />
      </div>
    </LegacyModal>
  );
}
function MuteModal(props: {
  user: RawUser;
  serverId: string;
  close: () => void;
}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const [selectedDuration, setSelectedDuration] =
    createSignal<SteppedSliderStep>({
      fullLabel: "10 minutes",
      label: "10m",
      value: 10 * 60000
    });

  const [reason, setReason] = createSignal("");

  const onMuteClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);

    let expireAt = new Date(
      Date.now() + selectedDuration()?.value || 0
    ).getTime();

    if (selectedDuration()?.value === 0) {
      // set expireAt to 2099
      const date = new Date();
      date.setFullYear(2099);
      expireAt = date.getTime();
    }

    await muteServerMember(
      props.serverId,
      props.user.id,
      expireAt,
      reason() || undefined
    ).finally(() => setRequestSent(false));

    props.close();
  };

  return (
    <Modal.Root close={props.close} desktopMaxWidth={300}>
      <Modal.Header
        alert
        icon="volume_off"
        title={t("muteModal.title", { username: props.user.username })}
      />

      <Modal.Body class={styles.muteModal}>
        <div>
          <Trans
            key="muteModal.message"
            options={{
              username: props.user.username,
              duration: selectedDuration()?.fullLabel
            }}
          >
            <b>{"username"}</b> will not be able to talk in this server for:
            <b>{"duration"}</b>
          </Trans>
        </div>

        <SteppedSlider
          steps={[
            { fullLabel: "10 minutes", label: "10m", value: 10 * 60000 },
            { fullLabel: "60 minutes", label: "60m", value: 60 * 60000 },
            { fullLabel: "6 hours", label: "6h", value: 6 * 3600000 },
            { fullLabel: "12 hours", label: "12h", value: 12 * 3600000 },
            { fullLabel: "24 hours", label: "24h", value: 24 * 3600000 },
            { fullLabel: "7 days", label: "7d", value: 7 * 86400000 },
            { fullLabel: "30 days", label: "30d", value: 30 * 86400000 },
            { fullLabel: "Never", label: "Never", value: 0 }
          ]}
          currentValue={selectedDuration().value}
          onChange={(step) => setSelectedDuration(step)}
        />
        <FlexColumn style={{ width: "100%" }}>
          <Text size={13} opacity={0.8} style={{ "margin-bottom": "6px" }}>
            {t("muteModal.reasonLabel") || "Reason (optional)"}
          </Text>
          <Input
            placeholder={t("muteModal.reasonPlaceholder")}
            value={reason()}
            onText={(val) => setReason(val)}
          />
        </FlexColumn>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("muteModal.cancelMute")}
          iconName="close"
          onClick={props.close}
        />
        <Modal.Button
          label={
            requestSent() ? t("muteModal.banning") : t("muteModal.banButton")
          }
          iconName="volume_off"
          color="var(--alert-color)"
          primary
          onClick={onMuteClick}
        />
      </Modal.Footer>
    </Modal.Root>
  );
}

export function ServerMemberRoleModal(props: Props & { close: () => void }) {
  const { serverRoles, serverMembers, servers, account } = useStore();
  const server = () => servers.get(props.serverId!);
  const roles = () => serverRoles.getAllByServerId(props.serverId!);

  const selfMember = () =>
    serverMembers.get(props.serverId!, account.user()?.id!);
  const selfTopRole = () => serverMembers.topRole(selfMember()!);

  const rolesThatCanBeApplied = () =>
    roles().filter((role) => {
      if (role!.id === server()?.defaultRoleId!) return false;
      if (role?.botRole) return false;
      if (server()?.isCurrentUserCreator()) return true;
      if (role!.order >= selfTopRole()?.order!) return false;

      return true;
    });

  return (
    <LegacyModal
      maxHeight={500}
      maxWidth={350}
      class={styles.roleModal}
      close={props.close}
      title={t("editServerRolesModal.title")}
    >
      <div class={styles.roleModalContainer}>
        <For each={rolesThatCanBeApplied()}>
          {(role) => <RoleItem role={role!} userId={props.userId} />}
        </For>
      </div>
    </LegacyModal>
  );
}

function RoleItem(props: { role: ServerRole; userId: string }) {
  const { serverMembers } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);

  const member = () => serverMembers.get(props.role.serverId, props.userId)!;
  const hasRole = () => serverMembers.hasRole(member()!, props.role.id);

  const onRoleClicked = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    const checked = !hasRole();
    let newRoleIds: string[] = [];
    if (!checked) {
      newRoleIds = member()?.roleIds.filter(
        (roleId) => roleId !== props.role.id
      )!;
    }
    if (checked) {
      newRoleIds = [...member().roleIds, props.role.id];
    }
    await updateServerMember(props.role.serverId, props.userId, {
      roleIds: newRoleIds
    }).finally(() => setRequestSent(false));
  };

  return (
    <div
      class={classNames(
        styles.roleItem,
        conditionalClass(hasRole(), styles.selected)
      )}
      onClick={onRoleClicked}
    >
      <div class={styles.checkbox} style={{ background: props.role.hexColor }}>
        <Icon name="check" size={12} class={styles.icon} />
      </div>
      <div class={styles.label}>{props.role.name}</div>
    </div>
  );
}
