import env from "@/common/env";
import { request } from "./Request";
import { RawApplication, RawUser } from "../RawData";

export interface OAuth2Details {
  user: RawUser;
  application: RawApplication;
}
export const Oauth2GetDetails = async (opts: {
  clientId: string;
  redirectUri: string;
}) => {
  const data = await request<OAuth2Details>({
    method: "GET",
    url: env.SERVER_URL + "/api/oauth2/authorize",
    params: {
      clientId: opts.clientId,
      redirectUri: opts.redirectUri,
    },
    useToken: true,
  });
  return data;
};

interface Oauth2AuthorizeResponse {
  redirectUri: string;
  code: string;
}
export const Oauth2Authorize = async (opts: {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}) => {
  const data = await request<Oauth2AuthorizeResponse>({
    method: "POST",
    url: env.SERVER_URL + "/api/oauth2/authorize",
    params: {
      clientId: opts.clientId,
      redirectUri: opts.redirectUri,
      scopes: opts.scopes.join(" "),
    },
    useToken: true,
  });
  return data;
};

export interface OAuth2AuthorizedApplication {
  application: RawApplication;
  createdAt: number;
  id: string;
}
export const OAuth2AuthorizedApplications = async () => {
  const data = await request<OAuth2AuthorizedApplication[]>({
    method: "GET",
    url: env.SERVER_URL + "/api/oauth2/applications",
    useToken: true,
  });
  return data;
};
export const OAuth2Unauthorize = async (appId: string) => {
  const data = await request<{ status: true }>({
    method: "DELETE",
    url: env.SERVER_URL + `/api/oauth2/applications/${appId}`,
    useToken: true,
  });
  return data;
};
