export default {
  login: () => "/users/login",
  register: () => "/users/register",


  tickets: (id?: string) => `/tickets/${id || ""}`,

  servers: () => "/servers",
  server: (serverId: string) => `/servers/${serverId}`,
  serverInvites: (serverId: string) => `/servers/${serverId}/invites`,
  serverInviteCode: (inviteCode: string) => `/servers/invites/${inviteCode}`,
  serverChannels: (serverId: string) => `/servers/${serverId}/channels`,
  serverChannel: (serverId: string, channelId: string) => `/servers/${serverId}/channels/${channelId}`,
  serverRoles: (serverId: string) => `/servers/${serverId}/roles`,
  serverRolesOrder: (serverId: string) => `/servers/${serverId}/roles/order`,
  serverChannelOrder: (serverId: string) => `/servers/${serverId}/channels/order`,
  serverOrder: () => "/servers/order",
  serverRole: (serverId: string, roleId: string) => `/servers/${serverId}/roles/${roleId}`,
  serverMember: (serverId: string, userId: string) => `/servers/${serverId}/members/${userId}`,
  serverMemberKick: (serverId: string, userId: string) => `/servers/${serverId}/members/${userId}/kick`,
  serverMemberBan: (serverId: string, userId: string) => `/servers/${serverId}/bans/${userId}`,

  exploreServer: (serverId: string) => `/explore/servers/${serverId}`,


  user: (userId: string) => `/users/${userId}`,

  openUserDM: (userId: string) => `/users/${userId}/open-channel`,

  updatePresence: () => "/users/presence",

  channel: (channelId: string) => `/channels/${channelId}`,
  messages: (channelId: string) => `/channels/${channelId}/messages`,
  channelAttachments: (channelId: string) => `/channels/${channelId}/attachments`,
  channelTyping: (channelId: string) => `/channels/${channelId}/typing`,
  message: (channelId: string, messageId: string) => `/channels/${channelId}/messages/${messageId}`,
  addFriend: () => "/friends/add",
  friends: (friendId: string) => `/friends/${friendId}`,

  posts: (userId?: string) => {
    return userId ? `/users/${userId}/posts` : "/posts"; 
  },
  likedPosts: (userId: string) => {
    return `/users/${userId}/posts/liked`; 
  },

  postComments: (postId: string) => {
    return `/posts/${postId}/comments`;
  },
  postLikes: (postId: string) => {
    return `/posts/${postId}/likes`;
  },

  postNotifications: () => "/posts/notifications",
  postNotificationDismiss: () => "/posts/notifications/dismiss",
  postNotificationCount: () => "/posts/notifications/count",
  post: (postId: string) => `/posts/${postId}`,
  postVotePoll: (postId: string, pollId: string, choiceId: string) => `/posts/${postId}/polls/${pollId}/choices/${choiceId}`,
  likePost: (postId: string) => `/posts/${postId}/like`,
  unlikePost: (postId: string) => `/posts/${postId}/unlike`,
  feedPosts: () => "/posts/feed",


  userFollow: (userId: string) => `/users/${userId}/follow`

};