export default {

  SERVER_MESSAGES: (serverId: string, channelId: string) => `/app/servers/${serverId}/${channelId}`,
  SERVER: (serverId: string) => `/app/servers/${serverId}`,

  LOGIN: (redirect?: string) => `/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
  REGISTER: (redirect?: string) => `/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
  
  SERVER_SETTINGS_GENERAL: (serverId: string) => `/app/servers/${serverId}/settings/general`,
  SERVER_SETTINGS_INVITES: (serverId: string) => `/app/servers/${serverId}/settings/invites`,
  SERVER_SETTINGS_CHANNELS: (serverId: string) => `/app/servers/${serverId}/settings/channels`,
  SERVER_SETTINGS_CHANNEL: (serverId: string, channelId: string) => `/app/servers/${serverId}/settings/channels/${channelId}`,
  SERVER_SETTINGS_ROLES: (serverId: string) => `/app/servers/${serverId}/settings/roles`,
  SERVER_SETTINGS_ROLE: (serverId: string, roleId: string) => `/app/servers/${serverId}/settings/roles/${roleId}`,
  
  EXPLORE_SERVER: (serverId: string) => `/app/explore/servers/${serverId}`,
  
  PROFILE: (userId: string) => `/app/profile/${userId}`,

  EXPLORE_SERVER_INVITE: (inviteId: string) => `/app/explore/servers/invites/${inviteId}`,
  EXPLORE_SERVER_INVITE_SHORT: (inviteId: string) => `/i/${inviteId}`,
  
  INBOX: () => '/app/inbox',
  INBOX_MESSAGES: (channelId: string) => `/app/inbox/${channelId}`,
}
