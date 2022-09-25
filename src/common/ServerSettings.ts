import { lazy } from 'solid-js';

export interface ServerSetting {
    pattern?: any;
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
    element: lazy(() => import('@/components/servers/settings/general'))
  },
  {
    pattern: (path: string) => patchMatches(path, 'roles/*'),
    name: 'roles',
    icon: 'leaderboard',
    hideDrawer: true,
    element: lazy(() => import('@/components/servers/settings/role'))
  },
  {
    path: 'roles',
    name: 'Roles',
    icon: 'leaderboard',
    element: lazy(() => import('@/components/servers/settings/roles'))
  },
  {
    pattern: (path: string) => patchMatches(path, 'channels/*'),
    name: 'Channels',
    icon: 'storage',
    hideDrawer: true,
    element: lazy(() => import('@/components/servers/settings/channel'))
  },
  {
    path: 'channels',
    name: 'Channels',
    icon: 'storage',
    element: lazy(() => import('@/components/servers/settings/channels'))
  },
  {
    path: 'invites',
    name: 'Invites',
    icon: 'mail',
    element: lazy(() => import('@/components/servers/settings/invites'))
  }
]

export default serverSettings;

export function getServeSetting(pathName: string, path: string) {
  return serverSettings.find(setting => {
    if (setting.pattern) {
      return setting.pattern(path);
    } else if (setting.path) {
      return setting.path === pathName;
    }
  });
}

function pathToSlugs(path: string) {
  return path.split('/').filter(x => x);
}


function patchMatches(path: string, pattern: string) {
  console.log(path, pattern)
  const pathSlugs = pathToSlugs(pattern);
  const currentPathSlugs = pathToSlugs(path);

  // remove app/servers/{serverId}/settings
  currentPathSlugs.splice(0, 4);

 const doesMatch =  pathSlugs.every((slug, index) => {
    const currentSlug = currentPathSlugs[index];
    if (slug === "*" && currentSlug) {
      return true;
    } else if (slug === currentSlug) {
      return true;
    }
  });
  return doesMatch;
}