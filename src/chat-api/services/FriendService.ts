
import env from '../../common/env';
import { RawFriend } from '../RawData';
import { request } from './Request';
import Endpoints from './ServiceEndpoints';


interface AddFriendOpts {
  username: string;
  tag: string;
}


export const addFriend = async (opts: AddFriendOpts) => {
  const data = await request<RawFriend>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + Endpoints.addFriend(),
    body: {username: opts.username, tag: opts.tag},
    useToken: true,
  });
  return data;
}

interface AcceptFriendOpts {
  friendId: string
}

export const acceptFriendRequest = async (opts: AcceptFriendOpts) => {
  const data = await request<{message: string}>({
    method: 'POST',
    url: env.SERVER_URL + "/api" + Endpoints.friends(opts.friendId),
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
    url: env.SERVER_URL + "/api" + Endpoints.friends(opts.friendId),
    useToken: true,
  });
  return data;
};