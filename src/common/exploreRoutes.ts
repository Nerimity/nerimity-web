import { lazy } from 'solid-js';

export interface ExploreRoute {
    path?: string;
    name: string;
    icon: string;
    element: any
}

const exploreRoutes: ExploreRoute[] =  [
  {
    path: 'servers',
    name: 'explore.drawer.servers',
    icon: 'dns',
    element: lazy(() => import('@/components/explore/ExploreServers'))
  },

]

export default exploreRoutes;