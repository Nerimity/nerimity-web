import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { t } from "@nerimity/i18lite";
import { lazy } from "solid-js";

export interface ServerSetting {
  path?: string;
  routePath: string;
  name: () => string;
  icon: string;
  requiredRolePermission?: Bitwise;
  hideDrawer?: boolean;
  element: any;
}

const serverSettings: ServerSetting[] = [
  {
    path: "general",
    routePath: "/general",
    name: () => t("servers.settings.drawer.general"),
    icon: "info",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerGeneralSettings")
    ),
  },
  {
    path: "audit-logs",
    routePath: "/audit-logs",
    name: () => t("servers.settings.drawer.audit-logs"),
    icon: "history",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerAuditLogs")
    ),
  },
  {
    path: "notifications",
    routePath: "/notifications",
    name: () => t("settings.drawer.notifications"),
    icon: "notifications",
    element: lazy(
      () => import("@/components/servers/settings/ServerNotificationSettings")
    ),
  },
  {
    path: "notifications/:channelId",
    routePath: "/notifications/:channelId",
    name: () => t("settings.drawer.notifications"),
    icon: "notifications",
    hideDrawer: true,
    element: lazy(
      () => import("@/components/servers/settings/ServerNotificationSettings")
    ),
  },
  {
    path: "roles/:roleId",
    routePath: "/roles/:roleId",
    name: () => t("servers.settings.drawer.role"),
    icon: "leaderboard",
    hideDrawer: true,
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_ROLES,
    element: lazy(
      () => import("@/components/servers/settings/role/ServerSettingsRole")
    ),
  },
  {
    name: () => t("servers.settings.drawer.roles"),
    path: "roles",
    routePath: "/roles",
    icon: "leaderboard",
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_ROLES,
    element: lazy(
      () => import("@/components/servers/settings/roles/ServerSettingsRoles")
    ),
  },
  {
    name: () => t("servers.settings.drawer.welcome-screen"),
    path: "welcome-screen",
    routePath: "/welcome-screen",
    icon: "task_alt",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/welcome-screen/WelcomeScreen")
    ),
  },
  {
    name: () => t("servers.settings.drawer.welcome-screen"),
    path: "welcome-screen",
    routePath: "/welcome-screen/:questionId",
    icon: "task_alt",
    hideDrawer: true,
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () =>
        import("@/components/servers/settings/welcome-question/WelcomeQuestion")
    ),
  },
  {
    path: "channels/:channelId/webhooks/:webhookId",
    routePath: "/channels/:channelId/webhooks/:webhookId",
    name: () => t("servers.settings.drawer.channel"),
    icon: "storage",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    hideDrawer: true,
    element: lazy(
      () => import("@/components/servers/settings/ServerSettingsWebhook")
    ),
  },
  {
    path: "channels/:channelId",
    routePath: "/channels/:channelId/:tab?",
    name: () => t("servers.settings.drawer.channel"),
    icon: "storage",
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_CHANNELS,
    hideDrawer: true,
    element: lazy(
      () =>
        import("@/components/servers/settings/channel/ServerSettingsChannel")
    ),
  },

  {
    name: () => t("servers.settings.drawer.channels"),
    path: "channels",
    routePath: "/channels",
    icon: "storage",
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_CHANNELS,
    element: lazy(
      () =>
        import("@/components/servers/settings/channels/ServerSettingsChannels")
    ),
  },
  {
    path: "emojis",
    routePath: "/emojis",
    name: () => t("servers.settings.drawer.emoji"),
    icon: "face",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerSettingsEmojis")
    ),
  },
  {
    name: () => t("servers.settings.drawer.bans"),
    path: "bans",
    routePath: "/bans",
    icon: "block",
    requiredRolePermission: ROLE_PERMISSIONS.BAN,
    element: lazy(
      () => import("@/components/servers/settings/ServerSettingsBans")
    ),
  },
  {
    path: "invites",
    routePath: "/invites",
    name: () => t("servers.settings.drawer.invites"),
    icon: "mail",
    element: lazy(
      () => import("@/components/servers/settings/invites/ServerSettingsInvite")
    ),
  },
  {
    name: () => t("servers.settings.drawer.publishServer"),
    path: "publish-server",
    routePath: "/publish-server",
    icon: "public",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/PublishServerSettings")
    ),
  },
  {
    path: "verify",
    routePath: "/verify",
    name: () => t("servers.settings.drawer.verify"),
    icon: "verified",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerVerifySettings")
    ),
  },
  {
    path: "external-embed",
    routePath: "/external-embed",
    name: () => t("servers.settings.drawer.external-embed"),
    icon: "link",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ExternalEmbedSettings")
    ),
  },
];

export default serverSettings;
