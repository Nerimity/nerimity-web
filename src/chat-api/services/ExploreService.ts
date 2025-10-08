import env from "@/common/env";
import { RawExploreItem } from "../RawData";
import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";

export async function BumpExploreItem(id: string, token: string) {
  return request<RawExploreItem>({
    method: "POST",
    body: { token },
    url: env.SERVER_URL + "/api" + ServiceEndpoints.explore(id) + "/bump",
    useToken: true,
  });
}

export async function upsertExploreBotApp(
  botAppId: string,
  description: string,
  permissions: number
) {
  return request<RawExploreItem>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.explore("bots/" + botAppId),
    body: { description, permissions },
    useToken: true,
  });
}
export async function getExploreBotApp(botAppId: string) {
  return request<RawExploreItem>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.explore("bots/" + botAppId),
    useToken: true,
  });
}

export type PublicServerSort =
  | "pinned_at"
  | "most_bumps"
  | "most_members"
  | "recently_added"
  | "recently_bumped";
export type PublicServerFilter = "pinned" | "all" | "verified";

interface getExploreItemsOpts {
  sort: PublicServerSort;
  filter: PublicServerFilter;
  limit?: number;
  afterId?: string;
  search?: string;
  type?: "bot" | "server";
}
export async function getExploreItems(opts: getExploreItemsOpts) {
  return request<RawExploreItem[]>({
    params: opts,
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.explore(""),
    useToken: true,
  });
}
