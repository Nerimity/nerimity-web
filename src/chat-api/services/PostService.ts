import env from "@/common/env";
import { RawPost } from "../RawData";
import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";

export const getPosts = async (userId?: string) => {
  const data = await request<RawPost[]>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.posts(userId),
    useToken: true,
  });
  return data;
}


export const createPost = async (content: string) => {
  const data = await request<RawPost>({
    method: 'POST',
    body: {
      content,
    },
    url: env.SERVER_URL + '/api' + ServiceEndpoints.posts(''),
    useToken: true,
  });
  return data;
}

export const likePost = async (postId: string) => {
  const data = await request<RawPost>({
    method: 'POST',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.likePost(postId),
    useToken: true,
  });
  return data;
}

export const unlikePost = async (postId: string) => {
  const data = await request<RawPost>({
    method: 'POST',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.unlikePost(postId),
    useToken: true,
  });
  return data;
}

