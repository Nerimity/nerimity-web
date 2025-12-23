import styles from "./styles.module.scss";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Link, useNavigate, useParams } from "solid-navigator";
import { createEffect, createSignal, For, JSX, onMount, Show } from "solid-js";
import useStore from "@/chat-api/store/useStore";
import SettingsBlock from "@/components/ui/settings-block/SettingsBlock";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/icon/Icon";
import {
  createServerRole,
  updateServerRoleOrder,
} from "@/chat-api/services/ServerService";
import { ServerRole } from "@/chat-api/store/useServerRoles";
import { useTransContext } from "@nerimity/solid-i18lite";
import { Draggable } from "@/components/ui/Draggable";
import { CustomLink } from "@/components/ui/CustomLink";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import ContextMenu, {
  ContextMenuProps,
} from "@/components/ui/context-menu/ContextMenu";

function RoleItem(props: { role: ServerRole }) {
  const { serverId } = useParams<{ serverId: string }>();
  const [contextMenu, setContextMenu] =
    createSignal<RoleContextMenuProps | null>(null);

  const link = RouterEndpoints.SERVER_SETTINGS_ROLE(serverId, props.role.id);

  return (
    <CustomLink
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({
          position: { x: e.clientX, y: e.clientY },
          role: props.role,
        });
      }}
      noContextMenu
      href={link}
      class={styles.roleItem}
    >
      <Show when={contextMenu()}>
        <RoleContextMenu
          {...contextMenu()!}
          onClose={() => setContextMenu(null)}
        />
      </Show>
      <div class={styles.roleDot} style={{ background: props.role.hexColor }} />
      <div class={styles.name}>{props.role.name}</div>
      <Icon name="keyboard_arrow_right" />
    </CustomLink>
  );
}

function RoleList() {
  const { serverId } = useParams();
  const { serverRoles } = useStore();
  const roles = () => serverRoles.getAllByServerId(serverId) as ServerRole[];

  const onDrop = (items: ServerRole[], revert: () => void) => {
    const ids = items.map((item) => item.id);
    updateServerRoleOrder(serverId, [...ids].reverse()).catch(() => {
      revert();
    });
  };

  return (
    <Draggable onDrop={onDrop} class={styles.roleList} items={roles()}>
      {(role) => <RoleItem role={role!} />}
    </Draggable>
  );
}

export default function ServerSettingsRole() {
  const [t] = useTransContext();
  const navigate = useNavigate();
  const { serverId } = useParams();
  const { header, servers } = useStore();
  const [roleAddRequestSent, setRoleAddRequestSent] = createSignal(false);

  onMount(() => {
    header.updateHeader({
      title: "Settings - Roles",
      serverId: serverId!,
      iconName: "settings",
    });
  });

  const onAddRoleClicked = async () => {
    if (roleAddRequestSent()) return;
    setRoleAddRequestSent(true);

    const role = await createServerRole(serverId!).finally(() =>
      setRoleAddRequestSent(false)
    );

    navigate(RouterEndpoints.SERVER_SETTINGS_ROLE(serverId!, role.id));
  };

  const server = () => servers.get(serverId);

  return (
    <div class={styles.rolesPane}>
      <Breadcrumb>
        <BreadcrumbItem
          href={RouterEndpoints.SERVER_MESSAGES(
            serverId,
            server()?.defaultChannelId!
          )}
          icon="home"
          title={server()?.name}
        />
        <BreadcrumbItem title={t("servers.settings.drawer.roles")} />
      </Breadcrumb>
      <SettingsBlock label={t("servers.settings.roles.addNewRole")} icon="add">
        <Button
          label={t("servers.settings.roles.addRoleButton")}
          onClick={onAddRoleClicked}
        />
      </SettingsBlock>
      <RoleList />
    </div>
  );
}

type RoleContextMenuProps = Omit<ContextMenuProps, "items"> & {
  role: ServerRole;
};

const RoleContextMenu = (props: RoleContextMenuProps) => {
  const navigate = useNavigate();
  return (
    <ContextMenu
      {...props}
      items={[
        {
          label: "Edit Role",
          icon: "edit",
          onClick: () => {
            navigate(
              RouterEndpoints.SERVER_SETTINGS_ROLE(
                props.role.serverId,
                props.role.id
              )
            );
          },
        },
        {
          label: "Copy ID",
          onClick: () => navigator.clipboard.writeText(props.role.id),
          icon: "content_copy",
        },
      ]}
    />
  );
};
