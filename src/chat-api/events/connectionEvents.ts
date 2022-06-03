import useStore from "../store/useStore";
import { AuthenticatedPayload } from "./connectionEventTypes";

export const onAuthenticated = (payload: AuthenticatedPayload) => {
  const {account, servers, users, channels} = useStore();
  console.log('[WS] Authenticated.');

  account.setUser(payload.user);

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
    users.set(serverMember.user);

  }

  for (let i = 0; i < payload.friends.length; i++) {
    const friend = payload.friends[i];
    users.set(friend.recipient);
  }



}