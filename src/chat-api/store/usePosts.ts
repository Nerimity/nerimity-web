import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import { RawPost } from "../RawData";
import { createPost, getCommentPosts, getPost, getPosts, likePost, unlikePost } from "../services/PostService";
import useAccount from "./useAccount";


export type Post = RawPost & {
  like(this: Post): Promise<string>;
  unlike(this: Post): Promise<string>;
  loadComments(this: Post): Promise<any>;
  commentIds: string[] | undefined
  cachedComments(this: Post): Post[] | undefined
  submitReply(this: Post, content: string): Promise<any>;
}

interface State {
  userPostIds: Record<string, string[] | undefined>; // userPostIds[userId] -> postIds
  posts: Record<string, Post | undefined>
}

const [state, setState] = createStore<State>({
  userPostIds: {},
  posts: {}
});

export function usePosts() {
  
  const pushPost = (post: RawPost, userId?: string) => {
    setState("posts", post.id, {
      ...post,
      async like() {
        const newPost = await likePost(this.id);
        setState("posts", newPost.id, {...this, ...newPost})
        return this.id;
      },
      async unlike() {
        const newPost = await unlikePost(this.id);
        setState("posts", newPost.id, {...this, ...newPost})
        return this.id;
      },
      async loadComments() {
        const comments = await getCommentPosts(this.id);
        batch(() => {
          for (let index = 0; index < comments.length; index++) {
            const comment = comments[index];
            pushPost(comment);
            if (!this.commentIds) {
              setState("posts", this.id, "commentIds", []);
            }
            if (this.commentIds?.includes(comment.id)) continue;
            setState("posts", this.id, "commentIds", [comment.id, ...this.commentIds!]);
          }
        })
      },
      async submitReply(content: string) {
        const account = useAccount();
        const formattedContent = content.trim();
        const post = await createPost(formattedContent, this.id);
        batch(() => {
          if (!this.commentIds) {
            setState("posts", this.id, "commentIds", []);
          }
          pushPost(post, account.user()?.id!);
          setState("posts", this.id, "commentIds", [post.id, ...this.commentIds!]);
        })
      },
      cachedComments() {
        return this.commentIds?.map(postId => state.posts[postId] as Post)
      }
    });
    if (!userId) return;

    if (!state.userPostIds[userId]) {
      setState("userPostIds", userId, []);
    }
    if (state.userPostIds[userId]?.includes(post.id)) return;
    setState("userPostIds", userId, [post.id, ...state.userPostIds[userId]!]);
  }

  const submitPost = async (content: string) => {
    const account = useAccount();
    const formattedContent = content.trim();
    const post = await createPost(formattedContent);
    pushPost(post, account.user()?.id!);
  }

  const fetchUserPosts = async (userId: string, withReplies?: boolean) => {
    const posts = await getPosts(userId, withReplies);
    setState("userPostIds", userId, []);
    batch(() => {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        pushPost(post, userId);
      }
    })
  }

  const cachedUserPosts = (userId: string) => {
    const postIds = state.userPostIds?.[userId];
    return postIds?.map(postId => state.posts[postId] as Post);
  }
  const fetchAndPushPost = async (postId: string) => {
    if (state.posts[postId]) return state.posts[postId];
    const post = await getPost(postId);
    pushPost(post);
    return state.posts[postId];
  }

  const cachedPost = (postId: string) => state.posts[postId];

  return {cachedPost, fetchUserPosts, cachedUserPosts, submitPost, fetchAndPushPost}
}
