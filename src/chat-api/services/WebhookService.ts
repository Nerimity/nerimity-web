import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import { RawWebhook } from "../RawData";
import env from "@/common/env";

export const createWebhook = async (serverId: string, channelId: string) => {
  const data = await request<RawWebhook>({
    method: "POST",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(serverId, channelId) +
      "/webhooks",
    useToken: true,
  });
  return data;
};

export const getWebhookToken = async (
  serverId: string,
  channelId: string,
  webhookId: string
) => {
  const data = await request<{ token: string }>({
    method: "GET",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(serverId, channelId) +
      `/webhooks/${webhookId}/token`,
    useToken: true,
  });
  return data;
};

export const getWebhooks = async (serverId: string, channelId: string) => {
  const data = await request<RawWebhook[]>({
    method: "GET",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(serverId, channelId) +
      "/webhooks",
    useToken: true,
  });
  return data;
};

export const deleteWebhook = async (
  serverId: string,
  channelId: string,
  webhookId: string
) => {
  const data = await request<unknown>({
    method: "DELETE",
    url:
      env.SERVER_URL +
      "/api" +
      ServiceEndpoints.serverChannel(serverId, channelId) +
      `/webhooks/${webhookId}`,
    useToken: true,
  });
  return data;
};
