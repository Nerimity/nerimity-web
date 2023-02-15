import env from "@/common/env";
import { RawPost, RawPostNotification, RawUser } from "../RawData";
import { Post } from "../store/usePosts";
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

export const getPostsLiked = async (userId: string) => {
  const data = await request<RawPost[]>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.likedPosts(userId),
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
export const deletePost = async (postId: string) => {
  const data = await request<any>({
    method: 'DELETE',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.post(postId),
    useToken: true,
  });
  return data;
}
export const editPost = async (postId: string, content: string) => {
  const data = await request<Post>({
    method: 'PATCH',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.post(postId),
    body: { content},
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

export interface LikedPost {likedBy: RawUser, createdAt: number};

export const getLikesPosts = async (postId: string) => {
  const data = await request<LikedPost[]>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.postLikes(postId),
    useToken: true,
  });
  return data;
}

export const getPostNotifications = async () => {
  const data = await request<RawPostNotification[]>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.postNotifications(),
    useToken: true,
  });
  return data;
}
export const getPostNotificationCount = async () => {
  const data = await request<number>({
    method: 'GET',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.postNotificationCount(),
    useToken: true,
  });
  return data;
}
export const getPostNotificationDismiss = async () => {
  const data = await request<number>({
    method: 'POST',
    url: env.SERVER_URL + '/api' + ServiceEndpoints.postNotificationDismiss(),
    useToken: true,
    notJSON: true,
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

