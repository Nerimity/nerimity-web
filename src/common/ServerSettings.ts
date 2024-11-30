import { Bitwise, ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { lazy } from "solid-js";

export interface ServerSetting {
  path?: string;
  routePath: string;
  name: string;
  icon: string;
  requiredRolePermission?: Bitwise;
  hideDrawer?: boolean;
  element: any;
}

const serverSettings: ServerSetting[] = [
  {
    path: "general",
    routePath: "/general",
    name: "servers.settings.drawer.general",
    icon: "info",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerGeneralSettings")
    ),
  },
  {
    path: "audit-logs",
    routePath: "/audit-logs",
    name: "servers.settings.drawer.audit-logs",
    icon: "history",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerAuditLogs")
    ),
  },
  {
    path: "notifications",
    routePath: "/notifications",
    name: "settings.drawer.notifications",
    icon: "notifications",
    element: lazy(
      () => import("@/components/servers/settings/ServerNotificationSettings")
    ),
  },
  {
    path: "notifications/:channelId",
    routePath: "/notifications/:channelId",
    name: "settings.drawer.notifications",
    icon: "notifications",
    hideDrawer: true,
    element: lazy(
      () => import("@/components/servers/settings/ServerNotificationSettings")
    ),
  },
  {
    path: "roles/:roleId",
    routePath: "/roles/:roleId",
    name: "servers.settings.drawer.role",
    icon: "leaderboard",
    hideDrawer: true,
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_ROLES,
    element: lazy(
      () => import("@/components/servers/settings/role/ServerSettingsRole")
    ),
  },
  {
    name: "servers.settings.drawer.roles",
    path: "roles",
    routePath: "/roles",
    icon: "leaderboard",
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_ROLES,
    element: lazy(
      () => import("@/components/servers/settings/roles/ServerSettingsRoles")
    ),
  },
  {
    name: "servers.settings.drawer.welcome-screen",
    path: "welcome-screen",
    routePath: "/welcome-screen",
    icon: "task_alt",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/welcome-screen/WelcomeScreen")
    ),
  },
  {
    name: "servers.settings.drawer.welcome-screen",
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
    path: "channels/:channelId",
    routePath: "/channels/:channelId/:tab?",
    name: "servers.settings.drawer.channel",
    icon: "storage",
    requiredRolePermission: ROLE_PERMISSIONS.MANAGE_CHANNELS,
    hideDrawer: true,
    element: lazy(
      () =>
        import("@/components/servers/settings/channel/ServerSettingsChannel")
    ),
  },
  {
    name: "servers.settings.drawer.channels",
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
    name: "servers.settings.drawer.emojis",
    icon: "face",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerSettingsEmojis")
    ),
  },
  {
    name: "servers.settings.drawer.bans",
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
    name: "servers.settings.drawer.invites",
    icon: "mail",
    element: lazy(
      () => import("@/components/servers/settings/invites/ServerSettingsInvite")
    ),
  },
  {
    name: "servers.settings.drawer.publishServer",
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
    name: "servers.settings.drawer.verify",
    icon: "verified",
    requiredRolePermission: ROLE_PERMISSIONS.ADMIN,
    element: lazy(
      () => import("@/components/servers/settings/ServerVerifySettings")
    ),
  },
];

export default serverSettings;
