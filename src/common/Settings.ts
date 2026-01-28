import { lazy } from "solid-js";
import { ExperimentIds } from "./experiments";
import { t } from "@nerimity/i18lite";

export interface Setting {
  path: string;
  routePath: string;
  name: () => string;
  icon: string;
  element: any;
  hide?: boolean;
  hideHeader?: boolean;
  experimentId?: ExperimentIds;
}

const DeveloperApplicationBotSettings = lazy(
  () =>
    import("@/components/settings/developer/DeveloperApplicationBotSettings"),
);

const DeveloperApplicationSettings = lazy(
  () => import("@/components/settings/developer/DeveloperApplicationSettings"),
);

const settings: Setting[] = [
  {
    path: "account",
    routePath: "/account",
    name: () => t("settings.drawer.account"),
    icon: "account_circle",
    element: lazy(() => import("@/components/settings/AccountSettings")),
  },

  {
    path: "/profile",
    routePath: "/profile",
    name: () => t("settings.account.profile"),
    icon: "person",
    element: lazy(() => import("@/components/settings/ProfileSettings")),
  },
  {
    path: "badges",
    routePath: "/badges",
    name: () => t("settings.drawer.badges"),
    icon: "local_police",
    element: lazy(() => import("@/components/settings/BadgeSettings")),
  },
  {
    path: "interface",
    routePath: "/interface",
    name: () => t("settings.drawer.interface"),
    icon: "brush",
    element: lazy(() => import("@/components/settings/InterfaceSettings")),
  },
  {
    path: "/interface/custom-css",
    routePath: "/interface/custom-css",
    name: () => t("settings.drawer.interface"),
    icon: "code",
    element: lazy(() => import("@/components/settings/CustomCssSettings")),
    hide: true,
  },
  {
    path: "notifications",
    routePath: "/notifications",
    name: () => t("settings.drawer.notifications"),
    icon: "notifications",
    element: lazy(() => import("@/components/settings/NotificationsSettings")),
  },
  {
    path: "call-settings",
    routePath: "/call-settings",
    name: () => t("settings.drawer.call-settings"),
    icon: "call",
    element: lazy(() => import("@/components/settings/CallSettings")),
  },
  {
    path: "connections",
    routePath: "/connections",
    name: () => t("settings.drawer.connections"),
    icon: "hub",
    element: lazy(() => import("@/components/settings/ConnectionsSettings")),
  },
  {
    path: "privacy",
    routePath: "/privacy",
    name: () => t("settings.drawer.privacy"),
    icon: "shield",
    element: lazy(() => import("@/components/settings/PrivacySettings")),
  },
  {
    path: "window-settings",
    routePath: "/window-settings",
    name: () => t("settings.drawer.window-settings"),
    icon: "open_in_new",
    element: lazy(() => import("@/components/settings/WindowSettings")),
  },
  {
    path: "activity-status",
    routePath: "/activity-status",
    name: () => t("settings.drawer.activity-status"),
    icon: "gamepad",
    element: lazy(() => import("@/components/settings/ActivityStatus")),
  },
  {
    path: "language",
    routePath: "/language",
    name: () => t("settings.drawer.language"),
    icon: "flag",
    element: lazy(() => import("@/components/settings/LanguageSettings")),
  },
  {
    path: "developer",
    routePath: "/developer",
    name: () => t("settings.drawer.developer"),
    icon: "code",
    element: lazy(
      () => import("@/components/settings/developer/DeveloperSettings"),
    ),
  },
  {
    path: "developer/applications",
    routePath: "/developer/applications",
    name: () => t("settings.drawer.developer"),
    icon: "code",
    hide: true,
    element: lazy(
      () =>
        import("@/components/settings/developer/DeveloperApplicationsSettings"),
    ),
  },
  {
    path: "developer/applications",
    routePath: "/developer/applications/:id",
    name: () => t("settings.drawer.developer"),
    hideHeader: true,
    icon: "code",
    hide: true,
    element: DeveloperApplicationSettings,
  },
  {
    path: "developer/applications",
    routePath: "/developer/applications/:id/oauth2",
    name: () => t("settings.drawer.developer"),
    hideHeader: true,
    icon: "code",
    hide: true,
    element: DeveloperApplicationSettings,
  },
  {
    path: "developer/applications",
    routePath: "/developer/applications/:id/bot/create-link",
    name: () => t("settings.drawer.developer"),
    hideHeader: true,
    icon: "code",
    hide: true,
    element: lazy(
      () =>
        import("@/components/settings/developer/DeveloperApplicationBotCreateLinkSettings"),
    ),
  },
  {
    path: "developer/applications",
    routePath: "/developer/applications/:id/bot/profile",
    name: () => t("settings.drawer.developer"),
    hideHeader: true,
    icon: "code",
    hide: true,
    element: DeveloperApplicationBotSettings,
  },

  {
    path: "developer/applications",
    routePath: "/developer/applications/:id/bot",
    name: () => t("settings.drawer.developer"),
    hideHeader: true,
    icon: "code",
    hide: true,
    element: DeveloperApplicationBotSettings,
  },
  {
    path: "developer/applications",
    routePath: "/developer/applications/:id/bot/publish",
    name: () => t("settings.drawer.developer"),
    hideHeader: true,
    icon: "code",
    hide: true,
    element: DeveloperApplicationBotSettings,
  },
  {
    path: "experiments",
    routePath: "/experiments",
    name: () => t("settings.drawer.experiments"),
    icon: "science",
    element: lazy(() => import("@/components/settings/ExperimentSettings")),
  },
  {
    path: "tickets",
    routePath: "/tickets/:id?",
    name: () => t("settings.drawer.tickets"),
    icon: "sell",
    element: lazy(() => import("@/components/settings/TicketSettings")),
  },
];

export default settings;
