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
    name: 'Account',
    icon: 'account_circle',
    element: lazy(() => import('@/components/settings/AccountSettings'))
  },
  {
    path: 'language',
    name: 'Language',
    icon: 'flag',
    element: lazy(() => import('@/components/settings/LanguageSettings'))
  },
]

export default settings;