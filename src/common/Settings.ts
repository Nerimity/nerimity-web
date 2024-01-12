import { lazy } from 'solid-js';

export interface Setting {
    path?: string;
    routePath?: string;
    name: string;
    icon: string;
    element: any
}

const settings: Setting[] =  [
  {
    path: 'account/',
    routePath: 'account/*',
    name: 'settings.drawer.account',
    icon: 'account_circle',
    element: lazy(() => import('@/components/settings/AccountSettings'))
  },
  {
    path: 'interface',
    name: 'settings.drawer.interface',
    icon: 'brush',
    element: lazy(() => import('@/components/settings/InterfaceSettings'))
  },
  {
    path: 'notifications',
    name: 'settings.drawer.notifications',
    icon: 'notifications',
    element: lazy(() => import('@/components/settings/NotificationsSettings'))
  },
  {
    path: 'connections',
    name: 'settings.drawer.connections',
    icon: 'hub',
    element: lazy(() => import('@/components/settings/ConnectionsSettings'))
  },
  {
    path: 'privacy',
    name: 'settings.drawer.privacy',
    icon: 'shield',
    element: lazy(() => import('@/components/settings/PrivacySettings'))
  },
  {
    path: 'window-settings',
    name: 'settings.drawer.window-settings',
    icon: 'launch',
    element: lazy(() => import('@/components/settings/WindowSettings'))
  },
  {
    path: 'activity-status',
    name: 'settings.drawer.activity-status',
    icon: 'games',
    element: lazy(() => import('@/components/settings/ActivityStatus'))
  },
  {
    path: 'language',
    name: 'settings.drawer.language',
    icon: 'flag',
    element: lazy(() => import('@/components/settings/LanguageSettings'))
  },
  {
    path: 'tickets',
    routePath: 'tickets/*',
    name: 'settings.drawer.tickets',
    icon: 'sell',
    element: lazy(() => import('@/components/settings/TicketSettings'))
  },
]

export default settings;