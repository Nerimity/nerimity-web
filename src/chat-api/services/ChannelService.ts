import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import { RawChannelNotice } from "../RawData";
import env from "@/common/env";

export const getChannelNotice = async (channelId: string) => {
  const data = await request<{notice: RawChannelNotice}>({
    method: 'GET',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.channel(channelId) + "/notice",
    useToken: true,
  });
  return data;
};

export const updateChannelNotice = async (serverId: string, channelId: string, content: string) => {
  const data = await request<{notice: RawChannelNotice}>({
    method: 'PUT',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverChannel(serverId, channelId) + "/notice",
    body: {content},
    useToken: true,
  });
  return data;
};

export const deleteChannelNotice = async (serverId: string, channelId: string) => {
  const data = await request({
    method: 'DELETE',
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverChannel(serverId, channelId) + "/notice",
    useToken: true,
  });
  return data;
};
