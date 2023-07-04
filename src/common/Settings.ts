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
    path: 'notifications',
    name: 'settings.drawer.notifications',
    icon: 'notifications',
    element: lazy(() => import('@/components/settings/NotificationsSettings'))
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
    path: 'language',
    name: 'settings.drawer.language',
    icon: 'flag',
    element: lazy(() => import('@/components/settings/LanguageSettings'))
  },
]

export default settings;