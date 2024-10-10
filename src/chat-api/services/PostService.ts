import env from "@/common/env";
import { RawPost, RawPostNotification, RawUser } from "../RawData";
import { Post } from "../store/usePosts";
import { request } from "./Request";
import ServiceEndpoints from "./ServiceEndpoints";
import { uploadAttachment } from "./nerimityCDNService";
import useAccount from "../store/useAccount";

interface GetFeedPostsOpts {
  limit?: number
  beforeId?: string
  afterId?: string
}

export const getAnnouncementPosts = async () => {
  const data = await request<RawPost[]>({
    method: "GET",
    url: env.SERVER_URL + "/api/posts/announcement",
    useToken: true
  });
  return data;
};
export const getFeedPosts = async (opts?: GetFeedPostsOpts) => {
  const data = await request<RawPost[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.feedPosts(),
    params: {
      ...(opts?.limit ? { limit: opts.limit } : undefined),
      ...(opts?.beforeId ? { beforeId: opts.beforeId } : undefined),
      ...(opts?.afterId ? { afterId: opts.afterId } : undefined)
    },
    useToken: true
  });
  return data;
};

interface GetDiscoverPostsOpts {
  limit?: number
  beforeId?: string
  afterId?: string
}

export const getDiscoverPosts = async (opts?: GetDiscoverPostsOpts) => {
  const data = await request<RawPost[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.post("discover"),
    params: {
      ...(opts?.limit ? { limit: opts.limit } : undefined),
      ...(opts?.beforeId ? { beforeId: opts.beforeId } : undefined),
      ...(opts?.afterId ? { afterId: opts.afterId } : undefined)
    },
    useToken: true
  });
  return data;
};

interface GetPostsOpts {
  userId?: string
  withReplies?: boolean
  limit?: number
  beforeId?: string
  afterId?: string
}

export const getPosts = async (opts: GetPostsOpts) => {
  const defaultOpts: GetPostsOpts = {
    ...opts,
    withReplies: opts.withReplies ?? true
  };
  const data = await request<RawPost[]>({
    method: "GET",
    params: {
      ...(defaultOpts.withReplies ? { withReplies: defaultOpts.withReplies } : undefined),
      ...(defaultOpts.limit ? { limit: defaultOpts.limit } : undefined),
      ...(defaultOpts.beforeId ? { beforeId: defaultOpts.beforeId } : undefined),
      ...(defaultOpts.afterId ? { afterId: defaultOpts.afterId } : undefined)
    },
    url: env.SERVER_URL + "/api" + ServiceEndpoints.posts(defaultOpts.userId),
    useToken: true
  });
  return data;
};

export const getPostsLiked = async (userId: string) => {
  const data = await request<RawPost[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.likedPosts(userId),
    useToken: true
  });
  return data;
};

export const getPost = async (postId: string) => {
  const data = await request<RawPost>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.post(postId),
    useToken: true
  });
  return data;
};
export const deletePost = async (postId: string) => {
  const data = await request<any>({
    method: "DELETE",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.post(postId),
    useToken: true
  });
  return data;
};
export const editPost = async (postId: string, content: string) => {
  const data = await request<Post>({
    method: "PATCH",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.post(postId),
    body: { content },
    useToken: true
  });
  return data;
};

export const postVotePoll = async (postId: string, pollId: string, choiceId: string) => {
  const data = await request<Post>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.postVotePoll(postId, pollId, choiceId),
    useToken: true
  });
  return data;
};


interface GetCommentPostsOpts {
  postId: string;
  limit?: number;
  beforeId?: string;
  afterId?: string;
}

export const getCommentPosts = async (opts: GetCommentPostsOpts) => {
  const data = await request<RawPost[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.postComments(opts.postId),
    params: {
      ...(opts.limit ? { limit: opts.limit } : undefined),
      ...(opts.beforeId ? { beforeId: opts.beforeId } : undefined),
      ...(opts.afterId ? { afterId: opts.afterId } : undefined)
    },
    useToken: true
  });
  return data;
};

export interface LikedPost { likedBy: RawUser, createdAt: number }

export const getLikesPosts = async (postId: string) => {
  const data = await request<LikedPost[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.postLikes(postId),
    useToken: true
  });
  return data;
};

export const getPostNotifications = async () => {
  const data = await request<RawPostNotification[]>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.postNotifications(),
    useToken: true
  });
  return data;
};
export const getPostNotificationCount = async () => {
  const data = await request<number>({
    method: "GET",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.postNotificationCount(),
    useToken: true
  });
  return data;
};
export const getPostNotificationDismiss = async () => {
  const data = await request<number>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.postNotificationDismiss(),
    useToken: true,
    notJSON: true
  });
  return data;
};


export const createPost = async (opts: { content?: string, attachment?: File, replyToPostId?: string, poll?: { choices: string[] } }) => {
  const account = useAccount();
  const userId = account.user()?.id;


  let fileId;
  if (opts.attachment) {
    const res = await uploadAttachment(userId!, {
      file: opts.attachment,
    });
    fileId = res.fileId;
  }

  const body: any = {
    content: opts.content,
    poll: opts.poll,
    ...(fileId ? { nerimityCdnFileId: fileId } : undefined),
    ...(opts.replyToPostId ? { postId: opts.replyToPostId } : undefined)
  };


  const data = await request<RawPost>({
    method: "POST",
    body,
    url: env.SERVER_URL + "/api" + ServiceEndpoints.posts(""),
    useToken: true
  });
  return data;
};

export const likePost = async (postId: string) => {
  const data = await request<RawPost>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.likePost(postId),
    useToken: true
  });
  return data;
};

export const unlikePost = async (postId: string) => {
  const data = await request<RawPost>({
    method: "POST",
    url: env.SERVER_URL + "/api" + ServiceEndpoints.unlikePost(postId),
    useToken: true
  });
  return data;
};

