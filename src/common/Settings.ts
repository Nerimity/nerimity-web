import { lazy } from "solid-js";
import { RouteObject } from "solid-navigator";

export interface Setting {
    path: string;
    routePath: string;
    name: string;
    icon: string;
    element: any
    hide?: boolean;

} 

const settings: Setting[] =  [
  {
    path: "account",
    routePath: "/account",
    name: "settings.drawer.account",
    icon: "account_circle",
    element: lazy(() => import("@/components/settings/AccountSettings"))
  },
  {
    path: "/account/profile",
    routePath: "/account/profile",
    name: "settings.drawer.account",
    icon: "account_circle",
    element: lazy(() => import("@/components/settings/ProfileSettings")),
    hide: true
  },
  {
    path: "interface",
    routePath: "/interface",
    name: "settings.drawer.interface",
    icon: "brush",
    element: lazy(() => import("@/components/settings/InterfaceSettings"))
  },
  {
    path: "notifications",
    routePath: "/notifications",
    name: "settings.drawer.notifications",
    icon: "notifications",
    element: lazy(() => import("@/components/settings/NotificationsSettings"))
  },
  {
    path: "connections",
    routePath: "/connections",
    name: "settings.drawer.connections",
    icon: "hub",
    element: lazy(() => import("@/components/settings/ConnectionsSettings"))
  },
  {
    path: "privacy",
    routePath: "/privacy",
    name: "settings.drawer.privacy",
    icon: "shield",
    element: lazy(() => import("@/components/settings/PrivacySettings"))
  },
  {
    path: "window-settings",
    routePath: "/window-settings",
    name: "settings.drawer.window-settings",
    icon: "launch",
    element: lazy(() => import("@/components/settings/WindowSettings"))
  },
  {
    path: "activity-status",
    routePath: "/activity-status",
    name: "settings.drawer.activity-status",
    icon: "games",
    element: lazy(() => import("@/components/settings/ActivityStatus"))
  },
  {
    path: "language",
    routePath: "/language",
    name: "settings.drawer.language",
    icon: "flag",
    element: lazy(() => import("@/components/settings/LanguageSettings"))
  },
  {
    path: "tickets",
    routePath: "/tickets/:id?",
    name: "settings.drawer.tickets",
    icon: "sell",
    element: lazy(() => import("@/components/settings/TicketSettings"))
  }
];

export default settings;