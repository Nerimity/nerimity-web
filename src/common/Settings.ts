import { lazy } from 'solid-js';

export interface Setting {
    path?: string;
    name: string;
    icon: string;
    element: any
}

const settings: Setting[] =  [
  {
    path: 'account',
    name: 'settings.drawer.account',
    icon: 'account_circle',
    element: lazy(() => import('@/components/settings/AccountSettings'))
  },
  {
    path: 'language',
    name: 'settings.drawer.language',
    icon: 'flag',
    element: lazy(() => import('@/components/settings/LanguageSettings'))
  },
]

export default settings;