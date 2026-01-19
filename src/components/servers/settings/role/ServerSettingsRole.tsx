import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate, useParams } from "solid-navigator";
import {
  createEffect,
  createSignal,
  For,
  Match,
  on,
  Show,
  Switch,
} from "solid-js";
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
import { t } from "@nerimity/i18lite";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { Notice } from "@/components/ui/Notice/Notice";
import { css } from "solid-styled-components";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import { emojiShortcodeToUnicode } from "@/emoji";
import { Emoji } from "@/components/ui/Emoji";
import { ColorPickerModal } from "@/components/ui/color-picker/ColorPicker";
import { FloatingSaveChanges } from "@/components/ui/FloatingSaveChanges";

type RoleParams = {
  serverId: string;
  roleId: string;
};

export default function ServerSettingsRole() {
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
    hexColor: role()?.gradient || role()?.hexColor,
    permissions: role()?.permissions || 0,
    hideRole: role()?.hideRole || false,
    icon: role()?.icon || null,
    applyOnJoin: role()?.applyOnJoin || false,
  });

  const [
    inputValues,
    updatedInputValues,
    setInputValue,
    undoUpdatedInputValues,
  ] = createUpdatedSignal(defaultInput);
  const permissions = () =>
    getAllPermissions(ROLE_PERMISSIONS, inputValues().permissions);

  createEffect(
    on(role, () => {
      header.updateHeader({
        title: t("settings.drawer.title") + " - " + role()?.name,
        serverId: params.serverId!,
        iconName: "settings",
      });
    }),
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
    const customEmoji = servers.customEmojiNamesToEmoji()[shortcode]!;
    const unicode = emojiShortcodeToUnicode(shortcode);

    const ext = () => {
      if (customEmoji.gif && !customEmoji.webp) return ".gif";
      if (customEmoji.webp && customEmoji.gif) return ".webp#a";
      return ".webp";
    };

    const icon = unicode || `${customEmoji.id}${ext()}`;
    setInputValue("icon", icon);
  };

  const bot = () => {
    if (!role()?.botRole) return;
    const botId = role()?.createdById;
    if (!botId) return;
    return users.get(botId);
  };

  const openColorPicker = () => {
    createPortal?.((close) => (
      <ColorPickerModal
        tabs={["solid", "gradient"]}
        stopLimit={4}
        close={close}
        color={inputValues().hexColor || "#fff"}
        onChange={(v) => setInputValue("hexColor", v)}
        done={(v) => {
          setInputValue("hexColor", v);
          close();
        }}
        alpha={false}
      />
    ));
  };

  return (
    <div class={styles.channelPane}>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!,
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
          description={t("servers.settings.role.managedByBot", {
            botName: `${bot()?.username}`,
          })}
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
        <Switch>
          <Match when={updatedInputValues().hexColor}>
            <Button
              iconName="undo"
              label={t("general.undoButton")}
              textSize={12}
              padding={2}
              alert
              onClick={() =>
                setInputValue("hexColor", defaultInput()?.hexColor)
              }
            />
          </Match>
          <Match when={inputValues().hexColor}>
            <Button
              iconName="close"
              alert
              label={t("servers.settings.role.clear")}
              textSize={12}
              padding={[2, 4]}
              onClick={() => setInputValue("hexColor", null)}
            />
          </Match>
        </Switch>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
          }}
        >
          <div
            onClick={openColorPicker}
            class={styles.colorPicker}
            style={{
              background: inputValues().hexColor || "#fff",
            }}
          >
            <Icon
              name="colorize"
              size={16}
              color="white"
              style={{
                "pointer-events": "none",
                filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
              }}
            />
          </div>
        </div>
      </SettingsBlock>

      {/* Icon */}
      <SettingsBlock icon="face" label={t("servers.settings.role.roleIcon")}>
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
        onClick={() => setInputValue("hideRole", !inputValues().hideRole)}
      >
        <Checkbox checked={inputValues().hideRole} />
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
        label={t("servers.settings.role.applyOnJoin")}
        description={t("servers.settings.role.applyOnJoinDescription")}
        onClick={() => setInputValue("applyOnJoin", !inputValues().applyOnJoin)}
      >
        <Checkbox
          checked={isDefaultRole() ? true : inputValues().applyOnJoin}
        />
      </SettingsBlock>

      <div class={styles.permissions}>
        <SettingsBlock
          icon="security"
          label={t("servers.settings.drawer.permissions")}
          description={t("servers.settings.role.permissionsDescription")}
          header={true}
        />
        <For each={permissions()}>
          {(permission) => (
            <SettingsBlock
              icon={permission.icon}
              label={permission.name()}
              description={permission.description?.()}
              class={styles.permissionItem}
              onClick={() =>
                onPermissionChanged(!permission.hasPerm, permission.bit)
              }
            >
              <Checkbox checked={permission.hasPerm} />
            </SettingsBlock>
          )}
        </For>
      </div>

      {/* Delete Role */}
      <SettingsBlock
        icon="delete"
        label={t("servers.settings.role.deleteRoleButton")}
        description={t("general.cannotBeUndone")}
      >
        <Button
          label={t("general.deleteButton")}
          color="var(--alert-color)"
          onClick={showDeleteConfirm}
        />
      </SettingsBlock>

      <FloatingSaveChanges
        hasChanges={Object.keys(updatedInputValues()).length}
        isSaving={saveRequestSent()}
        onSave={onSaveButtonClicked}
        error={error()}
        onUndo={() => {
          undoUpdatedInputValues();
        }}
      />
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
      title={t("servers.settings.role.deleteRoleTitle", {
        roleName: `${props.role?.name}`,
      })}
      errorMessage={error()}
      confirmText={props.role?.name}
      onDeleteClick={onDeleteClick}
    />
  );
}
