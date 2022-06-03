export default {
  loginEndpoint: () => "/users/login",
  registerEndpoint: () => "/users/register",


  serversEndpoint: () => `/servers`,
  serverInvitesEndpoint: (serverId: string) => `/servers/${serverId}/invites`,
  serverInviteCodeEndpoint: (inviteCode: string) => `/servers/invites/${inviteCode}`,

  openUserDMEndpoint: (userId: string) => `/users/${userId}/open-channel`,
  messagesEndpoint: (channelId: string) => `/channels/${channelId}/messages`,
  messageEndpoint: (channelId: string, messageId: string) => `/channels/${channelId}/messages/${messageId}`,
  friendsEndpoint: (friendId: string) => `/friends/${friendId}`,

}