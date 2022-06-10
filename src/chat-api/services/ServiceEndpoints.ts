export default {
  login: () => "/users/login",
  register: () => "/users/register",


  servers: () => `/servers`,
  serverInvites: (serverId: string) => `/servers/${serverId}/invites`,
  serverInviteCode: (inviteCode: string) => `/servers/invites/${inviteCode}`,

  openUserDM: (userId: string) => `/users/${userId}/open-channel`,
  messages: (channelId: string) => `/channels/${channelId}/messages`,
  message: (channelId: string, messageId: string) => `/channels/${channelId}/messages/${messageId}`,
  addFriend: () => `/friends/add`,
  friends: (friendId: string) => `/friends/${friendId}`,

}