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
    name: 'servers.settings.drawer.general',
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
    name: 'servers.settings.drawer.roles',
    path: 'roles',
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
    name: 'servers.settings.drawer.channels',
    path: 'channels',
    icon: 'storage',
    element: lazy(() => import('@/components/servers/settings/channels/ServerSettingsChannels'))
  },
  {
    name: 'servers.settings.drawer.bans',
    path: 'bans',
    icon: 'block',
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
    element: lazy(() => import('@/components/servers/settings/PublishServerSettings'))
  },
  {
    path: 'verify',
    name: 'servers.settings.drawer.verify',
    icon: 'verified',
    element: lazy(() => import('@/components/servers/settings/ServerVerifySettings'))
  }
]

export default serverSettings;