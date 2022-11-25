import { lazy } from 'solid-js';

export interface ServerSetting {
    path?: string;
    name: string;
    icon: string;
    hideDrawer?: boolean
    element: any
}

const serverSettings: ServerSetting[] =  [
  {
    path: 'general',
    name: 'General',
    icon: 'info',
    element: lazy(() => import('@/components/servers/settings/ServerGeneralSettings'))
  },
  {
    name: 'Role',
    path: 'roles/:roleId',
    icon: 'leaderboard',
    hideDrawer: true,
    element: lazy(() => import('@/components/servers/settings/role/ServerSettingsRole'))
  },
  {
    path: 'roles',
    name: 'Roles',
    icon: 'leaderboard',
    element: lazy(() => import('@/components/servers/settings/roles/ServerSettingsRole'))
  },
  {
    name: 'Channel',
    path: 'channels/:channelId',
    icon: 'storage',
    hideDrawer: true,
    element: lazy(() => import('@/components/servers/settings/channel/ServerSettingsChannel'))
  },
  {
    path: 'channels',
    name: 'Channels',
    icon: 'storage',
    element: lazy(() => import('@/components/servers/settings/channels/ServerSettingsChannel'))
  },
  {
    path: 'bans',
    name: 'Bans',
    icon: 'block',
    element: lazy(() => import('@/components/servers/settings/ServerSettingsBans'))
  },
  {
    path: 'invites',
    name: 'Invites',
    icon: 'mail',
    element: lazy(() => import('@/components/servers/settings/invites/ServerSettingsInvite'))
  }
]

export default serverSettings;