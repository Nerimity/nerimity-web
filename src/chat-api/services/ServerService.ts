import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import {RawChannel, RawServer, RawServerRole, RawUser} from '../RawData'
import env from "../../common/env";


export async function getInvites(serverId: string): Promise<any> {
  return request({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInvites(serverId),
    useToken: true
  });
}

export async function updateServerSettings(serverId: string, update: any): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url: env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId),
    useToken: true
  });
}
export async function kickServerMember(serverId: string, userId: string): Promise<any> {
  return request({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverMemberKick(serverId, userId),
    useToken: true
  });
}
export async function BanServerMember(serverId: string, userId: string): Promise<any> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverMemberBan(serverId, userId),
    useToken: true
  });
}
export async function removeBanServerMember(serverId: string, userId: string): Promise<any> {
  return request({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverMemberBan(serverId, userId),
    useToken: true
  });
}

export interface Ban {
  serverId: string;
  user: RawUser;
}

export async function bannedMembersList(serverId: string): Promise<Ban[]> {
  return request({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverMemberBan(serverId, ""),
    useToken: true
  });
}

export async function createServerChannel(serverId: string): Promise<RawChannel> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverChannels(serverId),
    useToken: true
  });
}
export async function createServerRole(serverId: string): Promise<RawServerRole> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverRoles(serverId),
    useToken: true
  });
}

export async function updateServerRole(serverId: string, roleId: string, update: any): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverRole(serverId, roleId),
    useToken: true
  });
}
export async function deleteServerRole(serverId: string, roleId: string): Promise<any> {
  return request({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverRole(serverId, roleId),
    useToken: true
  });
}
export async function updateServerMember(serverId: string, userId: string, update: any): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverMember(serverId, userId),
    useToken: true
  });
}

export async function updateServerChannel(serverId: string, channelId: string, update: any): Promise<any> {
  return request({
    method: "POST",
    body: update,
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverChannel(serverId, channelId),
    useToken: true
  });
}
export async function deleteServerChannel(serverId: string, channelId: string): Promise<any> {
  return request({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverChannel(serverId, channelId),
    useToken: true
  });
}


export async function createServer(serverName: string): Promise<RawServer> {
  return request<RawServer>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.servers(),
    useToken: true,
    body: {name: serverName}
  });
}

export async function createInvite(serverId: string): Promise<any> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInvites(serverId),
    useToken: true
  });
}

export async function deleteServer(serverId: string): Promise<RawServer> {
  return request({
    method: "delete",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.server(serverId),
    useToken: true
  });
}

export async function joinServerByInviteCode(inviteCode: string) {
  return request<RawServer>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInviteCode(inviteCode),
    useToken: true
  });
}

export type ServerWithMemberCount = RawServer & { memberCount: number }; 


export async function serverDetailsByInviteCode(inviteCode: string) {
  return request<ServerWithMemberCount>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInviteCode(inviteCode),
  });
}