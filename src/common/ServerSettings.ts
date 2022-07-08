import { lazy } from 'solid-js';

export interface ServerSetting {
    path: string;
    name: string;
    icon: string;
    element: any
}
export default {
  general: {
    path: 'general',
    name: 'General',
    icon: 'info',
    element: lazy(() => import('../components/ServerSettingsGeneral/ServerSettingsGeneral'))
  },
  invites: {
    path: 'invites',
    name: 'Invites',
    icon: 'mail',
    element: lazy(() => import('../components/ServerSettingsInvite/ServerSettingsInvite'))
  }
} as Record<string, ServerSetting>