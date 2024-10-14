import env from "../../common/env";
import { request } from "./Request";
import Endpoints from "./ServiceEndpoints";


export const postJoinVoice = async (channelId: string, socketId: string) => {
  const data = await request({
    method: "POST",
    url: env.SERVER_URL + "/api" + Endpoints.channel(channelId) + "/voice/join",
    body: {
      socketId
    },
    useToken: true
  });
  return data;
};
export const postLeaveVoice = async (channelId: string) => {
  const data = await request({
    method: "POST",
    url: env.SERVER_URL + "/api" + Endpoints.channel(channelId) + "/voice/leave",
    useToken: true
  });
  return data;
};


const lastCredentials = {
  generatedAt: null as null | number,
  result: null as null | any
};
export const postGenerateCredential = async () => {
  if (lastCredentials.generatedAt) {
    const diff = Date.now() - lastCredentials.generatedAt;
    // 1 hour after last generated
    if (diff < 60 * 60 * 1000) {
      return lastCredentials as { result: any };
    }
  }
  const data = await request<{ result: any }>({
    method: "POST",
    url: env.SERVER_URL + "/api/voice/generate",
    useToken: true
  });

  lastCredentials.generatedAt = Date.now();
  lastCredentials.result = data.result;

  return data;
};