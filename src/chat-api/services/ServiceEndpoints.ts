export default {
  login: () => "/users/login",
  register: () => "/users/register",


  servers: () => `/servers`,
  server: (serverId: string) => `/servers/${serverId}`,
  serverInvites: (serverId: string) => `/servers/${serverId}/invites`,
  serverInviteCode: (inviteCode: string) => `/servers/invites/${inviteCode}`,
  serverChannels: (serverId: string) => `/servers/${serverId}/channels`,
  serverChannel: (serverId: string, channelId: string) => `/servers/${serverId}/channels/${channelId}`,
  serverRoles: (serverId: string) => `/servers/${serverId}/roles`,
  serverRole: (serverId: string, roleId: string) => `/servers/${serverId}/roles/${roleId}`,
  serverMember: (serverId: string, userId: string) => `/servers/${serverId}/members/${userId}`,
  serverMemberKick: (serverId: string, userId: string) => `/servers/${serverId}/members/${userId}/kick`,
  serverMemberBan: (serverId: string, userId: string) => `/servers/${serverId}/bans/${userId}`,

  user: (userId: string) => `/users/${userId}`,

  openUserDM: (userId: string) => `/users/${userId}/open-channel`,

  updatePresence: () => `/users/presence`,

  messages: (channelId: string) => `/channels/${channelId}/messages`,
  channelTyping: (channelId: string) => `/channels/${channelId}/typing`,
  message: (channelId: string, messageId: string) => `/channels/${channelId}/messages/${messageId}`,
  addFriend: () => `/friends/add`,
  friends: (friendId: string) => `/friends/${friendId}`,

}