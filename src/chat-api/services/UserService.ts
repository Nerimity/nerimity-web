import env from "../../common/env";
import { RawChannel, RawInboxWithoutChannel } from "../RawData";
import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";



// Returns {token}
// error returns {path?, message}
export async function loginRequest(email: string, password: string): Promise<{token: string}> {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.login(),
    method: "POST",
    body: {
      email,
      password
    }
  });
}


// Returns {token}
// error returns {path?, message}
export async function registerRequest(email: string, username: string, password: string): Promise<{token: string}> {
  return request({
    url: env.SERVER_URL + "/api" + ServiceEndpoints.register(),
    method: "POST",
    body: {
      email,
      username,
      password
    }
  });
}


export async function openDMChannelRequest(userId: string) {
  return request<RawInboxWithoutChannel & {channel: RawChannel}>({
    url:  env.SERVER_URL + "/api" + ServiceEndpoints.openUserDM(userId),
    method: 'POST',
    useToken: true
  });
}