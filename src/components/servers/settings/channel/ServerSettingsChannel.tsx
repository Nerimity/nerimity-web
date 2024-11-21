import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useNavigate, useParams } from "solid-navigator";
import {
  createEffect,
  createSignal,
  For,
  Match,
  on,
  onMount,
  Show,
  Switch,
} from "solid-js";
import useStore from "@/chat-api/store/useStore";
import { createUpdatedSignal } from "@/common/createUpdatedSignal";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/Button";
import {
  deleteServerChannel,
  updateServerChannel,
} from "@/chat-api/services/ServerService";
import LegacyModal from "@/components/ui/legacy-modal/LegacyModal";
import { Channel } from "@/chat-api/store/useChannels";
import Checkbox from "@/components/ui/Checkbox";
import {
  addBit,
  CHANNEL_PERMISSIONS,
  getAllPermissions,
  removeBit,
} from "@/chat-api/Bitwise";
import DeleteConfirmModal from "@/components/ui/delete-confirm-modal/DeleteConfirmModal";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { useTransContext } from "@mbarzda/solid-i18next";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { FloatingEmojiPicker } from "@/components/ui/emoji-picker/EmojiPicker";
import { emojiShortcodeToUnicode } from "@/emoji";
import { Emoji } from "@/components/markup/Emoji";
import env from "@/common/env";
import Text from "@/components/ui/Text";
import { css } from "solid-styled-components";
import {
  deleteChannelNotice,
  getChannelNotice,
  updateChannelNotice,
} from "@/chat-api/services/ChannelService";
import { RawChannelNotice } from "@/chat-api/RawData";
import { ChannelIcon } from "@/components/ChannelIcon";
import { t } from "i18next";
import DropDown, { DropDownItem } from "@/components/ui/drop-down/DropDown";
import { Item } from "@/components/ui/Item";
import { CustomLink } from "@/components/ui/CustomLink";

type ChannelParams = {
  serverId: string;
  channelId: string;
  tab?: "permissions";
};

export default function ServerSettingsChannel() {
  const params = useParams<ChannelParams>();
  const store = useStore();

  const channel = () => store.channels.get(params.channelId);

  const server = () => store.servers.get(params.serverId);

  return (
    <>
      <Breadcrumb class={styles.breadcrumb}>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            params.serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem
          href="../"
          title={t("servers.settings.drawer.channels")}
        />
        <BreadcrumbItem title={channel()?.name} />
      </Breadcrumb>
      <Tabs />
      <Switch>
        <Match when={params.tab !== "permissions"}>
          <GeneralTab />
        </Match>
        <Match when={params.tab === "permissions"}>
          <PermissionsTab />
        </Match>
      </Switch>
    </>
  );
}

const TabItem = (props: {
  selected: boolean;
  label: string;
  href?: string;
  icon?: string;
}) => (
  <Item.Root
    selected={props.selected}
    href={props.href}
    handlePosition="bottom"
    gap={4}
  >
    <Item.Icon>{props.icon}</Item.Icon>
    <Item.Label>{props.label}</Item.Label>
  </Item.Root>
);

function Tabs() {
  const params = useParams<ChannelParams>();

  return (
    <div class={styles.tabs}>
      <TabItem
        label="General"
        selected={params.tab !== "permissions"}
        icon="settings"
        href="../"
      />
      <TabItem
        label="Permissions"
        selected={params.tab === "permissions"}
        icon="lock"
        href="./permissions"
      />
    </div>
  );
}

function PermissionsTab() {
  const [t] = useTransContext();
  const params = useParams<ChannelParams>();
  const store = useStore();

  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);
  const [selectedRoleId, setSelectedRoleId] = createSignal<string | undefined>(
    undefined
  );

  const channel = () => store.channels.get(params.channelId);

  const roles = () =>
    store.serverRoles.getAllByServerId(params.serverId).sort((a, b) => {
      if (!defaultRoleId()) return 0;
      if (a!.id === defaultRoleId()) return -1;
      if (b!.id === defaultRoleId()) return 1;
      return b!.order - a!.order;
    });
  const server = () => store.servers.get(params.serverId);
  const defaultRoleId = () => server()?.defaultRoleId;

  createEffect(() => {
    setSelectedRoleId(defaultRoleId());
  });

  const rolesDropdownItems = () =>
    roles().map(
      (role) =>
        ({
          id: role!.id,
          suffix:
            defaultRoleId() === role!.id ? (
              <div
                class={css`
                  margin-left: 4px;
                  opacity: 0.5;
                  font-size: 12px;
                `}
              >
                (everyone)
              </div>
            ) : null,
          label: role!.name,
        } satisfies DropDownItem)
    );

  const defaultInput = () => ({
    name: channel()?.name || "",
    icon: channel()?.icon || null,
    permissions: channel()?.permissions || 0,
    slowModeSeconds: channel()?.slowModeSeconds || 0,
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  createEffect(
    on(channel, () => {
      store.header.updateHeader({
        title: "Settings - " + channel()?.name,
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
    await updateServerChannel(params.serverId!, channel()?.id!, values)
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  };

  const saveRequestStatus = () =>
    saveRequestSent()
      ? t("servers.settings.channel.saving")
      : t("servers.settings.channel.saveChangesButton");

  return (
    <div class={styles.channelPane}>
      <SettingsBlock
        icon="security"
        label={t("servers.settings.channel.permissions")}
        description={t("servers.settings.channel.permissionsDescription")}
        header={true}
        class={css`
          && {
            flex-direction: column;
            align-items: start;
            gap: 6px;
          }
        `}
      >
        <DropDown
          class={css`
            align-self: stretch;
            margin-left: 40px;
          `}
          items={rolesDropdownItems()}
          selectedId={selectedRoleId()}
          onChange={(item) => setSelectedRoleId(item.id)}
        />
      </SettingsBlock>

      <Show when={selectedRoleId()} keyed>
        <ChannelPermissionsBlock roleId={selectedRoleId()!} />
      </Show>
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
function GeneralTab() {
  const [t] = useTransContext();
  const params = useParams<ChannelParams>();
  const { header, channels, servers } = useStore();
  const { createPortal } = useCustomPortal();

  const [emojiPickerPosition, setEmojiPickerPosition] = createSignal<null | {
    x: number;
    y: number;
  }>(null);
  const [saveRequestSent, setSaveRequestSent] = createSignal(false);
  const [error, setError] = createSignal<null | string>(null);

  const channel = () => channels.get(params.channelId);

  const defaultInput = () => ({
    name: channel()?.name || "",
    icon: channel()?.icon || null,
    slowModeSeconds: channel()?.slowModeSeconds || 0,
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  createEffect(
    on(channel, () => {
      header.updateHeader({
        title: "Settings - " + channel()?.name,
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
    await updateServerChannel(params.serverId!, channel()?.id!, values)
      .catch((err) => setError(err.message))
      .finally(() => setSaveRequestSent(false));
  };

  const saveRequestStatus = () =>
    saveRequestSent()
      ? t("servers.settings.channel.saving")
      : t("servers.settings.channel.saveChangesButton");

  const openChannelIconPicker = (event: MouseEvent) => {
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
  const showDeleteConfirmModal = () => {
    createPortal?.((close) => (
      <ChannelDeleteConfirmModal close={close} channel={channel()!} />
    ));
  };
  return (
    <div class={styles.channelPane}>
      {/* Channel Name */}
      <SettingsBlock
        icon="edit"
        label={t("servers.settings.channel.channelName")}
      >
        <Input
          value={inputValues().name}
          onText={(v) => setInputValue("name", v)}
        />
      </SettingsBlock>

      {/* Channel Icon */}
      <SettingsBlock icon="face" label="Channel Icon">
        <Show when={inputValues().icon}>
          <Button
            iconName="delete"
            onClick={() => setInputValue("icon", null)}
            iconSize={13}
            color="var(--alert-color)"
          />
        </Show>
        <Button
          iconName={inputValues().icon ? undefined : "face"}
          iconSize={16}
          onClick={openChannelIconPicker}
          customChildren={
            inputValues().icon ? (
              <ChannelIcon
                type={channel()?.type}
                icon={inputValues().icon!}
                hovered
              />
            ) : undefined
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

      {/* Slowmode */}
      <SettingsBlock
        icon="speed"
        label="Slow mode"
        description="Specify how long a user must wait before they can send a message."
      >
        <Input
          class={styles.slowdownInput}
          suffix="s"
          type="number"
          value={inputValues().slowModeSeconds.toString()}
          onText={(v) => setInputValue("slowModeSeconds", v ? parseInt(v) : "")}
        />
      </SettingsBlock>

      <ChannelNoticeBlock
        channelId={params.channelId}
        serverId={params.serverId}
      />
      {/* Delete Channel */}
      <SettingsBlock
        icon="delete"
        label={t("servers.settings.channel.deleteThisChannel")}
        description={t("servers.settings.channel.deleteThisChannelDescription")}
      >
        <Button
          label={t("servers.settings.channel.deleteChannelButton")}
          color="var(--alert-color)"
          onClick={showDeleteConfirmModal}
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

const ChannelPermissionsBlock = (props: { roleId: string }) => {
  const params = useParams<{ serverId: string; channelId: string }>();
  const store = useStore();
  const server = () => store.servers.get(params.serverId);
  const channel = () => store.channels.get(params.channelId);
  const roleChannelPermissions = () =>
    channel()?.permissions?.find((p) => p.roleId === props.roleId);

  const [permissions, setPermissions] = createSignal<number>(0);

  createEffect(
    on(
      () => roleChannelPermissions()?.permissions,
      (p) => {
        console.log(channel()?.permissions);
        setPermissions(p || 0);
      }
    )
  );

  const allPermissions = () =>
    getAllPermissions(CHANNEL_PERMISSIONS, permissions() || 0);

  const onPermissionChanged = (checked: boolean, bit: number) => {
    let newPermission = permissions();
    console.log(newPermission);
    if (checked) {
      newPermission = addBit(newPermission, bit);
    }
    if (!checked) {
      newPermission = removeBit(newPermission, bit);
    }
    // props.setPermissions(newPermission);
  };

  return (
    <For each={allPermissions()}>
      {(permission) => (
        <SettingsBlock
          icon={permission.icon}
          label={t(permission.name)}
          description={t(permission.description!)}
          class={styles.permissionItem}
        >
          <Checkbox
            checked={permission.hasPerm}
            onChange={(checked) => onPermissionChanged(checked, permission.bit)}
          />
        </SettingsBlock>
      )}
    </For>
  );
};

const NoticeBlockStyle = css`
  && {
    height: initial;
    min-height: initial;
    align-items: start;
    flex-direction: column;
    flex: 0;
    padding-top: 15px;
    align-items: stretch;
  }
  .inputContainer {
    margin-left: 35px;
    margin-top: 5px;
  }
  textarea {
    min-height: 100px;
  }
`;

function ChannelNoticeBlock(props: { serverId: string; channelId: string }) {
  const [error, setError] = createSignal<string>("");
  const [channelNotice, setChannelNotice] =
    createSignal<RawChannelNotice | null>(null);

  const defaultInput = () => ({
    content: channelNotice()?.content || "",
  });

  const [inputValues, updatedInputValues, setInputValue] =
    createUpdatedSignal(defaultInput);

  onMount(async () => {
    const res = await getChannelNotice(props.channelId);
    if (!res) return;
    setChannelNotice(res.notice);
  });

  const save = async () => {
    setError("");
    if (inputValues().content.length > 300)
      return setError("Channel notice cannot be longer than 300 characters.");
    const res = await updateChannelNotice(
      props.serverId,
      props.channelId,
      inputValues().content
    ).catch((err) => {
      setError(err.message);
    });
    if (!res) return;
    setChannelNotice(res.notice);
    setInputValue("content", res.notice.content);
  };

  const deleteNotice = async () => {
    const res = await deleteChannelNotice(
      props.serverId,
      props.channelId
    ).catch((err) => {
      setError(err.message);
    });
    if (!res) return;
    setChannelNotice(null);
    setInputValue("content", "");
  };

  return (
    <div
      style={{
        "margin-bottom": "35px",
        "padding-bottom": "30px",
        "border-bottom": "solid 1px rgba(255,255,255,0.2)",
      }}
    >
      <SettingsBlock
        icon="info"
        label="Channel Notice"
        class={NoticeBlockStyle}
        description="Shows when the user is about to chat for the first time. Changes apply after reload."
      >
        <Text size={12} style={{ "margin-left": "38px", "margin-top": "5px" }}>
          ({inputValues().content.length} / 300)
        </Text>
        <Input
          class="inputContainer"
          type="textarea"
          value={inputValues().content}
          onText={(v) => setInputValue("content", v)}
        />
        <Show when={error()}>
          <Text style={{ "margin-left": "40px" }} color="var(--alert-color)">
            {error()}
          </Text>
        </Show>

        <div
          style={{
            display: "flex",
            "align-self": "flex-end",
            "margin-top": "15px",
          }}
        >
          <Show when={channelNotice()?.content}>
            <Button
              label={t("servers.settings.channel.removeNoticeButton")}
              color="var(--alert-color)"
              iconName="delete"
              onClick={deleteNotice}
            />
          </Show>
          <Show when={updatedInputValues().content}>
            <Button label="Save" iconName="save" onClick={save} />
          </Show>
        </div>
      </SettingsBlock>
    </div>
  );
}

function ChannelDeleteConfirmModal(props: {
  channel: Channel;
  close: () => void;
}) {
  const navigate = useNavigate();
  const [error, setError] = createSignal<string | null>(null);

  const onDeleteClick = async () => {
    const serverId = props.channel.serverId!;
    setError(null);
    deleteServerChannel(serverId, props.channel.id)
      .then(() => {
        const path = RouterEndpoints.SERVER_SETTINGS_CHANNELS(serverId);
        navigate(path);
        props.close();
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <DeleteConfirmModal
      title={`Delete ${props.channel?.name}`}
      close={props.close}
      errorMessage={error()}
      confirmText={props.channel?.name}
      onDeleteClick={onDeleteClick}
    />
  );
}
