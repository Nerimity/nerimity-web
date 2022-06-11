import useStore from "../store/useStore";
import { AuthenticatedPayload } from "./connectionEventTypes";

export const onAuthenticated = (payload: AuthenticatedPayload) => {
  const {account, servers, users, channels, serverMembers, friends, inbox} = useStore();
  console.log('[WS] Authenticated.');

  account.setUser(payload.user);
  users.set(payload.user)

  for (let i = 0; i < payload.servers.length; i++) {
    const server = payload.servers[i];
    servers.set(server);
  }

  
  for (let i = 0; i < payload.channels.length; i++) {
    const channel = payload.channels[i];
    channels.set(channel);
  } 


  for (let i = 0; i < payload.serverMembers.length; i++) {
    const serverMember = payload.serverMembers[i];
    serverMembers.set(serverMember);
  }


  for (let i = 0; i < payload.inbox.length; i++) {
    const item = payload.inbox[i];
    inbox.set(item);
        
  }

  for (let i = 0; i < payload.friends.length; i++) {
    const friend = payload.friends[i];
    friends.set(friend);
  }

  for (let i = 0; i < payload.presences.length; i++) {
    const presence = payload.presences[i];
    users.setPresence(presence.userId, presence);   
  }
  



}