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
