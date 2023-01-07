import { Bitwise, ROLE_PERMISSIONS } from '@/chat-api/Bitwise';
import { lazy } from 'solid-js';

export interface ServerSetting {
    path?: string;
    name: string;
    icon: string;
    requiredRolePermission?: Bitwise,
    hideDrawer?: boolean
    element: any
}

const serverSettings: ServerSetting[] =  [
  {
    path: 'general',
    name: 'servers.settings.drawer.general',
    icon: 'info',
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(() => import('@/components/servers/settings/ServerGeneralSettings'))
  },
  {
    path: 'roles/:roleId',
    name: 'servers.settings.drawer.role',
    icon: 'leaderboard',
    hideDrawer: true,
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_ROLES,
    element: lazy(() => import('@/components/servers/settings/role/ServerSettingsRole'))
  },
  {
    name: 'servers.settings.drawer.roles',
    path: 'roles',
    icon: 'leaderboard',
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_ROLES,
    element: lazy(() => import('@/components/servers/settings/roles/ServerSettingsRoles'))
  },
  {
    path: 'channels/:channelId',
    name: 'servers.settings.drawer.channel',
    icon: 'storage',
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_CHANNELS,
    hideDrawer: true,
    element: lazy(() => import('@/components/servers/settings/channel/ServerSettingsChannel'))
  },
  {
    name: 'servers.settings.drawer.channels',
    path: 'channels',
    icon: 'storage',
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_CHANNELS,
    element: lazy(() => import('@/components/servers/settings/channels/ServerSettingsChannels'))
  },
  {
    name: 'servers.settings.drawer.bans',
    path: 'bans',
    icon: 'block',
    requiredRolePermission: ROLE_PERMISSIONS.BAN,
    element: lazy(() => import('@/components/servers/settings/ServerSettingsBans'))
  },
  {
    path: 'invites',
    name: 'servers.settings.drawer.invites',
    icon: 'mail',
    element: lazy(() => import('@/components/servers/settings/invites/ServerSettingsInvite'))
  },
  {
    name: 'servers.settings.drawer.publishServer',
    path: 'publish-server',
    icon: 'public',
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(() => import('@/components/servers/settings/PublishServerSettings'))
  },
  {
    path: 'verify',
    name: 'servers.settings.drawer.verify',
    icon: 'verified',
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(() => import('@/components/servers/settings/ServerVerifySettings'))
  }
]

export default serverSettings;