import { request } from "./request";
import ServiceEndpoints from "./ServiceEndpoints";
import {RawServer} from '../RawData'
import env from "../../common/env";


export async function getInvites(serverId: string): Promise<any> {
  return request({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInvitesEndpoint(serverId),
    useToken: true
  });
}


export async function createServer(serverName: string): Promise<RawServer> {
  return request<RawServer>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serversEndpoint(),
    useToken: true,
    body: {name: serverName}
  });
}

export async function createInvite(serverId: string): Promise<any> {
  return request({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInvitesEndpoint(serverId),
    useToken: true
  });
}

export async function joinServerByInviteCode(inviteCode: string) {
  return request<RawServer>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInviteCodeEndpoint(inviteCode),
    useToken: true
  });
}

export type ServerWithMemberCount = RawServer & { memberCount: number }; 


export async function serverDetailsByInviteCode(inviteCode: string) {
  return request<ServerWithMemberCount>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.serverInviteCodeEndpoint(inviteCode),
  });
}