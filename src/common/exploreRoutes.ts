import { t } from "@nerimity/i18lite";
import { lazy } from "solid-js";

export interface ExploreRoute {
  path?: string;
  routePath: string;
  name: () => string;
  icon: string;
  element: any;
}

const exploreRoutes: ExploreRoute[] = [
  {
    path: "servers",
    routePath: "/servers",
    name: () => t("explore.drawer.servers"),
    icon: "dns",
    element: lazy(() => import("@/components/explore/ExploreServers")),
  },
  {
    path: "bots",
    routePath: "/bots",
    name: () => t("explore.drawer.bots"),
    icon: "smart_toy",
    element: lazy(() => import("@/components/explore/ExploreBots")),
  },
    {
    path: "themes",
    routePath: "/themes",
    name: () => t("explore.drawer.themes"),
    icon: "brush",
    element: lazy(() => import("@/components/explore/ExploreThemes")),
  }
];

export default exploreRoutes;
