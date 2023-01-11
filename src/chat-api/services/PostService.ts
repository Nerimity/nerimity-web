import env from "@/common/env";
import { RawPost } from "../RawData";
import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";

export const getFeedPosts = async (userId?: string, withReplies = true) => {
  const data = await request<RawPost[]>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.feedPosts(),
    useToken: true,
  });
  return data;
}

export const getPosts = async (userId?: string, withReplies = true) => {
  const data = await request<RawPost[]>({
    method: 'GET',
    params: {
      ...(withReplies ? {withReplies} : undefined)
    },
    url: env.SERVER_URL + '/api' + ServiceEndpoints.posts(userId),
    useToken: true,
  });
  return data;
}

export const getPost = async (postId: string) => {
  const data = await request<RawPost>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.post(postId),
    useToken: true,
  });
  return data;
}

export const getCommentPosts = async (postId: string) => {
  const data = await request<RawPost[]>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.postComments(postId),
    useToken: true,
  });
  return data;
}


export const createPost = async (content: string, postId?: string) => {
  const data = await request<RawPost>({
    method: 'POST',
    body: {
      content,
      ...(postId? {postId} : undefined)
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

