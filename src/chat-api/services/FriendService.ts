
import env from '../../common/env';
import { request } from './Request';
import Endpoints from './ServiceEndpoints';

interface AcceptFriendOpts {
  friendId: string
}

export const acceptFriendRequest = async (opts: AcceptFriendOpts) => {
  const data = await request<{message: string}>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + Endpoints.friendsEndpoint(opts.friendId),
    useToken: true,
  });
  return data;
};

interface RemoveFriendOpts {
  friendId: string
}

export const removeFriend = async (opts: RemoveFriendOpts) => {
  const data = await request<{message: string}>({
    method: 'DELETE',
    url: env.SERVER_URL + "/api" + Endpoints.friendsEndpoint(opts.friendId),
    useToken: true,
  });
  return data;
};