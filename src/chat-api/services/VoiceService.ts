import env from '../../common/env';
import { request } from './Request';
import Endpoints from './ServiceEndpoints';


export const postJoinVoice = async (channelId: string, socketId: string) => {
  const data = await request({
    method: 'POST',
    url: env.SERVER_URL + "/api" + Endpoints.channel(channelId) + "/voice/join",
    body: {
      socketId
    },
    useToken: true
  });
  return data;
};
