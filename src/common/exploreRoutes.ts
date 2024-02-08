import { lazy } from "solid-js";

export interface ExploreRoute {
    path?: string;
    routePath: string;
    name: string;
    icon: string;
    element: any
}

const exploreRoutes: ExploreRoute[] =  [
  {
    path: "servers",
    routePath: "/servers",
    name: "explore.drawer.servers",
    icon: "dns",
    element: lazy(() => import("@/components/explore/ExploreServers"))
  }

];

export default exploreRoutes;