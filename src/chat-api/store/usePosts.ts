import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import { RawPost } from "../RawData";
import { createPost, deletePost, editPost, getCommentPosts, getFeedPosts, getPost, getPosts, getPostsLiked, likePost, unlikePost } from "../services/PostService";
import useAccount from "./useAccount";


export type Post = RawPost & {
  like(this: Post): Promise<string>;
  delete(this: Post): Promise<void>;
  unlike(this: Post): Promise<string>;
  loadComments(this: Post): Promise<any>;
  editPost(this: Post, content: string): Promise<any>;
  commentIds: string[] | undefined
  cachedComments(this: Post): Post[] | undefined
  submitReply(this: Post, opts: {content: string, attachment?: File}): Promise<any>;
}

interface State {
  userPostIds: Record<string, string[] | undefined>; // userPostIds[userId] -> postIds
  posts: Record<string, Post | undefined>
  feedPostIds: string[]
}

const [state, setState] = createStore<State>({
  userPostIds: {},
  posts: {},
  feedPostIds: [],
});

export function usePosts() {
  
  const pushPost = (post: RawPost, userId?: string) => {
    batch(() => {
      if (post.commentTo) {
        pushPost(post.commentTo);
      }
      setState("posts", post.id, {
        ...post,
        commentTo: undefined, 
        async delete() {
          await deletePost(this.id);
          setState("posts", this.id, { ...this, content: undefined, deleted: true })
        },
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
        async editPost(content: string) {
          const newPost = await editPost(this.id, content);
          setState("posts", newPost.id, {...this, ...newPost})
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
        async submitReply(opts: {content: string, attachment?: File}) {
          const account = useAccount();
          const formattedContent = opts.content.trim();
          const post = await createPost({content: formattedContent, attachment: opts.attachment, replyToPostId: this.id}).catch((err) => {
            alert(err.message)
          });
          if (!post) return;
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
    })
  }

  const submitPost = async (opts: {content: string, file?: File}) => {
    const account = useAccount();
    const formattedContent = opts.content.trim();
    const post = await createPost({content: formattedContent, attachment: opts.file}).catch((err) => {
      alert(err.message)
    });
    if (!post) return;
    pushPost(post, account.user()?.id!);
    setState("feedPostIds", [post.id, ...state.feedPostIds]);
    
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
  const fetchUserLikedPosts = async (userId: string) => {
    const posts = await getPostsLiked(userId);
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
    if (!post) return undefined;
    pushPost(post);
    return state.posts[postId];
  }


  const fetchFeed = async () => {
    const posts = await getFeedPosts();
    batch(() => {
      setState('feedPostIds', []);
      for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        pushPost(post);
        setState('feedPostIds', state.feedPostIds.length, post.id);
      }
    })
  }

  const cachedFeed = () => state.feedPostIds.map(id => state.posts[id] as Post);
  const cachedPost = (postId: string) => state.posts[postId];

  return {pushPost, fetchFeed, cachedFeed, cachedPost, fetchUserPosts, cachedUserPosts, submitPost, fetchAndPushPost, fetchUserLikedPosts}
}
