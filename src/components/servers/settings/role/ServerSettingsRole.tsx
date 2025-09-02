import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate, useParams } from "solid-navigator";
import { createEffect, createSignal, For, on, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";
import {
  deleteServerRole,
  updateServerRole,
} from "@/chat-api/services/ServerService";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import Checkbox from "@/components/ui/Checkbox";
import {
  addBit,
  getAllPermissions,
  removeBit,
  ROLE_PERMISSIONS,
} from "@/chat-api/Bitwise";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";
import { ServerRole } from "@/chat-api/store/useServerRoles";
import Icon from "@/components/ui/icon/Icon";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { useTransContext } from "@mbarzda/solid-i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { Notice } from "@/components/ui/Notice/Notice";
import { css } from "solid-styled-components";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import { emojiShortcodeToUnicode } from "@/emoji";
import { Emoji } from "@/components/ui/Emoji";

type RoleParams = {
  serverId: string;
  roleId: string;
};

export default function ServerSettingsRole() {
  const [t] = useTransContext();
  const params = useParams<RoleParams>();
  const { header, serverRoles, servers, users } = useStore();

  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = createSignal<null | {
    x: number;
    y: number;
  }>(null);

  const { createPortal } = useCustomPortal();

  const role = () => serverRoles.get(params.serverId, params.roleId);
  const server = () => servers.get(params.serverId);

  const isDefaultRole = () => role()?.id === server()?.defaultRoleId;

  const defaultInput = () => ({
    name: role()?.name || "",
    hexColor: role()?.hexColor || "#fff",
    permissions: role()?.permissions || 0,
    hideRole: role()?.hideRole || false,
    icon: role()?.icon || null,
    applyOnJoin: role()?.applyOnJoin || false,
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);
  const permissions = () =>
    getAllPermissions(ROLE_PERMISSIONS, inputValues().permissions);

  createEffect(
    on(role, () => {
      header.updateHeader({
        title: "Settings - " + role()?.name,
        serverId: params.serverId!,
        iconName: "settings",
      });
    })
  );

  const onSaveButtonClicked = async () => {
    if (saveRequestSent()) return;
    setSaveRequestSent(true);
    setError(null);
    const values = updatedInputValues();
    await updateServerRole(params.serverId!, role()?.id!, values)
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  };

  const saveRequestStatus = () =>
    saveRequestSent()
      ? t("servers.settings.role.saving")
      : t("servers.settings.role.saveChangesButton");

  const onPermissionChanged = (checked: boolean, bit: number) => {
    let newPermission = inputValues().permissions;
    if (checked) {
      newPermission = addBit(newPermission, bit);
    }
    if (!checked) {
      newPermission = removeBit(newPermission, bit);
    }
    setInputValue("permissions", newPermission);
  };

  const showDeleteConfirm = () => {
    createPortal?.((close) => (
      <RoleDeleteConfirmModal close={close} role={role()!} />
    ));
  };

  const openIconPicker = (event: MouseEvent) => {
    setEmojiPickerPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const onIconPicked = (shortcode: string) => {
    const customEmoji = servers.customEmojiNamesToEmoji()[shortcode];
    const unicode = emojiShortcodeToUnicode(shortcode);
    const icon =
      unicode || `${customEmoji.id}.${customEmoji.gif ? "gif" : "webp"}`;
    setInputValue("icon", icon);
  };

  const bot = () => {
    if (!role()?.botRole) return;
    const botId = role()?.createdById;
    if (!botId) return;
    return users.get(botId);
  };

  return (
    <div class={styles.channelPane}>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem href="../" title={t("servers.settings.drawer.roles")} />
        <BreadcrumbItem title={role()?.name} />
      </Breadcrumb>

      <Show when={bot()}>
        <Notice
          class={css`
            margin-bottom: 8px;
          `}
          type="warn"
          description={`This role is managed by ${
            bot()?.username
          }. You cannot delete or add members to this role. Kick this bot to remove this role.`}
        />
      </Show>

      {/* Role Name */}
      <SettingsBlock icon="edit" label={t("servers.settings.role.roleName")}>
        <Input
          value={inputValues().name}
          onText={(v) => setInputValue("name", v)}
        />
      </SettingsBlock>

      {/* Role Color */}
      <SettingsBlock
        icon="colorize"
        label={t("servers.settings.role.roleColor")}
      >
        <ColorPicker
          color={inputValues().hexColor}
          onChange={(v) => setInputValue("hexColor", v)}
        />
      </SettingsBlock>

      {/* Icon */}
      <SettingsBlock icon="face" label="Icon">
        <Show when={inputValues().icon}>
          <Button
            iconName="delete"
            onClick={() => setInputValue("icon", null)}
            iconSize={13}
            color="var(--alert-color)"
          />
        </Show>
        <Button
          margin={0}
          onClick={openIconPicker}
          customChildren={
            inputValues().icon ? (
              <Emoji size={18} icon={inputValues().icon} hovered />
            ) : (
              <Icon name="face" size={18} />
            )
          }
        />
        <Show when={emojiPickerPosition()}>
          <FloatingEmojiPicker
            onClick={onIconPicked}
            {...emojiPickerPosition()!}
            close={() => setEmojiPickerPosition(null)}
          />
        </Show>
      </SettingsBlock>

      {/* Hide Role */}
      <SettingsBlock
        icon="adjust"
        label={t("servers.settings.role.hideRole")}
        description={t("servers.settings.role.hideRoleDescription")}
      >
        <Checkbox
          checked={inputValues().hideRole}
          onChange={(checked) => setInputValue("hideRole", checked)}
        />
      </SettingsBlock>
      {/* Apply On Join */}
      <SettingsBlock
        class={
          isDefaultRole()
            ? css`
                pointer-events: none;
              `
            : undefined
        }
        icon="adjust"
        label={"Apply on Join"}
        description={"Apply this role to members when they join the server."}
      >
        <Checkbox
          checked={isDefaultRole() ? true : inputValues().applyOnJoin}
          onChange={(checked) => setInputValue("applyOnJoin", checked)}
        />
      </SettingsBlock>

      <div class={styles.permissions}>
        <SettingsBlock
          icon="security"
          label={t("servers.settings.role.permissions")}
          description={t("servers.settings.role.permissionsDescription")}
          header={true}
        />
        <For each={permissions()}>
          {(permission) => (
            <SettingsBlock
              icon={permission.icon}
              label={t(permission.name)}
              description={t(permission.description)}
              class={styles.permissionItem}
            >
              <Checkbox
                checked={permission.hasPerm}
                onChange={(checked) =>
                  onPermissionChanged(checked, permission.bit)
                }
              />
            </SettingsBlock>
          )}
        </For>
      </div>

      {/* Delete Role */}
      <SettingsBlock
        icon="delete"
        label={t("servers.settings.role.deleteRoleButton")}
        description={t("servers.settings.role.deleteRoleButtonDescription")}
      >
        <Button
          label="Delete Role"
          color="var(--alert-color)"
          onClick={showDeleteConfirm}
        />
      </SettingsBlock>
      {/* Errors & buttons */}
      <Show when={error()}>
        <div class={styles.error}>{error()}</div>
      </Show>
      <Show when={Object.keys(updatedInputValues()).length}>
        <Button
          iconName="save"
          label={saveRequestStatus()}
          class={styles.saveButton}
          onClick={onSaveButtonClicked}
        />
      </Show>
    </div>
  );
}

function RoleDeleteConfirmModal(props: {
  role: ServerRole;
  close: () => void;
}) {
  const [error, setError] = createSignal<string | null>(null);
  const navigate = useNavigate();

  createEffect(() => {
    if (!props.role) {
      props.close();
    }
  });

  const onDeleteClick = async () => {
    setError(null);
    const serverId = props.role?.serverId!;
    let err = "";
    await deleteServerRole(serverId, props.role.id).catch((error) => {
      err = error.message;
      setError(error.message);
    });
    if (!err) {
      const path = RouterEndpoints.SERVER_SETTINGS_ROLES(serverId);
      navigate(path);
    }

    console.log(err);
    return err;
  };

  return (
    <DeleteConfirmModal
      close={props.close}
      title={`Delete ${props.role?.name}`}
      errorMessage={error()}
      confirmText={props.role?.name}
      onDeleteClick={onDeleteClick}
    />
  );
}

function ColorPicker(props: {
  color: string;
  onChange?: (value: string) => void;
}) {
  let inputEl: undefined | HTMLInputElement;

  const onClicked = () => {
    inputEl?.click();
  };
  const onChange = () => {
    props.onChange?.(inputEl?.value!);
  };

  return (
    <div
      class={styles.colorPicker}
      style={{ background: props.color }}
      onClick={onClicked}
    >
      <Icon name="colorize" color="white" size={18} class={styles.icon} />
      <input
        style={{ position: "absolute", opacity: 0 }}
        ref={inputEl}
        type="color"
        value={props.color}
        onChange={onChange}
      />
    </div>
  );
}
