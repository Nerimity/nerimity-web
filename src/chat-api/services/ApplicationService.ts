import env from "@/common/env";
import { RawApplication, RawUser } from "../RawData";
import { request } from "./Request";

export const getApplication = async (id: string) => {
  const data = await request<RawApplication>({
    method: "GET",
    url: env.SERVER_URL + "/api/applications/" + id,
    useToken: true
  });
  return data;
};

export const getApplications = async () => {
  const data = await request<RawApplication[]>({
    method: "GET",
    url: env.SERVER_URL + "/api/applications",
    useToken: true
  });
  return data;
};

export const createApplication = async () => {
  const data = await request<RawApplication>({
    method: "POST",
    url: env.SERVER_URL + "/api/applications",
    useToken: true
  });
  return data;
};

export const createAppBotUser = async (appId: string) => {
  const data = await request<RawUser>({
    method: "POST",
    url: env.SERVER_URL + `/api/applications/${appId}/bot`,
    useToken: true
  });
  return data;
};
export const updateAppBotUser = async (appId: string, update: {username?: string, tag?: string}) => {
  const data = await request<RawUser>({
    method: "PATCH",
    url: env.SERVER_URL + `/api/applications/${appId}/bot`,
    body: update,
    useToken: true
  });
  return data;
};

export const getAppBotToken = async (appId: string) => {
  const data = await request<{token: string}>({
    method: "GET",
    url: env.SERVER_URL + `/api/applications/${appId}/token`,
    useToken: true
  });
  return data;
};
export const refreshAppBotToken = async (appId: string) => {
  const data = await request<{token: string}>({
    method: "POST",
    url: env.SERVER_URL + `/api/applications/${appId}/token`,
    useToken: true
  });
  return data;
};
export const deleteApp = async (appId: string) => {
  const data = await request<{success: string}>({
    method: "DELETE",
    url: env.SERVER_URL + `/api/applications/${appId}`,
    useToken: true
  });
  return data;
};



export type RawBotUser = RawUser  & {application: {creatorAccount: {user: RawUser}}};


export const getApplicationBot = async (appId: string, includeServers: boolean) => {
  const data = await request<{bot: RawBotUser, servers: {id: string, name: string}[]}>({
    method: "GET",
    url: env.SERVER_URL + `/api/applications/${appId}/bot`,
    params: { includeServers },
    useToken: true
  });
  return data;
};