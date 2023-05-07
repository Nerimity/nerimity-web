import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { Link, useNavigate, useParams } from '@solidjs/router';
import { createEffect, createSignal, For, JSX, onMount } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/icon/Icon';
import { createServerRole, updateServerRoleOrder } from '@/chat-api/services/ServerService';
import { ServerRole } from '@/chat-api/store/useServerRoles';
import { useTransContext } from '@nerimity/solid-i18next';
import { Draggable } from '@/components/ui/Draggable';
import { CustomLink } from '@/components/ui/CustomLink';
import Breadcrumb, { BreadcrumbItem } from '@/components/ui/Breadcrumb';



function RoleItem(props: { role: ServerRole }) {
  const { serverId } = useParams();

  const link = RouterEndpoints.SERVER_SETTINGS_ROLE(serverId, props.role.id);

  return (
    <CustomLink noContextMenu href={link} class={styles.roleItem}>
      <div class={styles.roleDot} style={{ background: props.role.hexColor }} />
      <div class={styles.name}>{props.role.name}</div>
      <Icon name='navigate_next' />
    </CustomLink>
  )
}


function RoleList() {
  const { serverId } = useParams();
  const { serverRoles } = useStore();
  const roles = () => serverRoles.getAllByServerId(serverId) as ServerRole[];





  const onDrop = (items: ServerRole[], revert: () => void) => {
    const ids = items.map(item => item.id);
    updateServerRoleOrder(serverId, [...ids].reverse())
      .catch(() => {
        revert();
      })
  }

  return (
    <Draggable onDrop={onDrop} class={styles.roleList} items={roles()}>
      {role => <RoleItem role={role!} />}
    </Draggable>
  )
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
      iconName: 'settings',
    });
  })

  const onAddRoleClicked = async () => {
    if (roleAddRequestSent()) return;
    setRoleAddRequestSent(true);

    const role = await createServerRole(serverId!)
      .finally(() => setRoleAddRequestSent(false))

    navigate(RouterEndpoints.SERVER_SETTINGS_ROLE(serverId!, role.id))
  }

  const server = () => servers.get(serverId);


  return (
    <div class={styles.rolesPane}>
      <Breadcrumb>
        <BreadcrumbItem href={RouterEndpoints.SERVER_MESSAGES(serverId, server()?.defaultChannelId!)} icon='home' title={server()?.name} />
        <BreadcrumbItem title={t('servers.settings.drawer.roles')} />
      </Breadcrumb>
      <SettingsBlock label={t('servers.settings.roles.addNewRole')} icon='add'>
        <Button label={t('servers.settings.roles.addRoleButton')} onClick={onAddRoleClicked} />
      </SettingsBlock>
      <RoleList />
    </div>
  )
}

