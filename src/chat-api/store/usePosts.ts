import { batch } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { RawPost } from "../RawData";
import { createPost, deletePost, editPost, getCommentPosts, getDiscoverPosts, getFeedPosts, getPost, getPosts, getPostsLiked, likePost, postVotePoll, unlikePost } from "../services/PostService";
import useAccount from "./useAccount";


export type Post = RawPost & {
  like(this: Post): Promise<string>;
  delete(this: Post): Promise<void>;
  unlike(this: Post): Promise<string>;
  loadComments(this: Post): Promise<RawPost[]>;
  loadMoreComments(this: Post): Promise<RawPost[]>;
  editPost(this: Post, content: string): Promise<any>;
  votePoll(this: Post, choiceId: string): Promise<any>;

  commentIds: string[] | undefined
  cachedComments(this: Post): Post[] | undefined
  submitReply(this: Post, opts: {content: string, attachment?: File}): Promise<any>;
}

interface State {
  userPostIds: Record<string, string[] | undefined>; // userPostIds[userId] -> postIds
  posts: Record<string, Post | undefined>
  feedPostIds: string[]
  discoverPostIds: string[]
}

const [state, setState] = createStore<State>({
  userPostIds: {},
  posts: {},
  feedPostIds: [],
  discoverPostIds: []
});

export function usePosts() {
  
  const pushPost = (post: RawPost, userId?: string, prependUserPost = false) => {
    batch(() => {
      if (post.commentTo) {
        pushPost(post.commentTo);
      }
      setState("posts", post.id, {
        ...post,
        commentTo: undefined, 
        async delete() {
          await deletePost(this.id);
          setState("posts", this.id, { ...this, content: undefined, deleted: true });
        },
        async like() {
          const newPost = await likePost(this.id);
          setState("posts", newPost.id, {...this, ...newPost});
          return this.id;
        },
        async unlike() {
          const newPost = await unlikePost(this.id);
          setState("posts", newPost.id, {...this, ...newPost});
          return this.id;
        },
        async editPost(content: string) {
          const newPost = await editPost(this.id, content);
          setState("posts", newPost.id, {...this, ...newPost});
        },
        async votePoll(choiceId) {

          await postVotePoll(this.id, this.poll?.id!, choiceId).then(() => {

            const poll = structuredClone(unwrap(this.poll!));
            poll._count.votedUsers++;
            const choiceIndex = poll.choices.findIndex(choice => choice.id === choiceId);
            if (choiceIndex === -1) return;
            poll.choices[choiceIndex]!._count.votedUsers++;

            poll.votedUsers = [{pollChoiceId: choiceId}];

            setState("posts", this.id, {...this, poll});
          }).catch(e => alert(e.message));

        },
        async loadComments() {
          const comments = await getCommentPosts({postId: this.id, limit: 30});
          setState("posts", this.id, "commentIds", reconcile([]));
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
          });
          return comments;
        },
        async loadMoreComments() {
          const afterId = this.commentIds?.at(-1);
          if (!afterId) return [];
          const comments = await getCommentPosts({postId: this.id, limit: 30, afterId});
          comments.reverse();
          batch(() => {
            for (let index = 0; index < comments.length; index++) {
              const comment = comments[index];
              pushPost(comment);
              if (!this.commentIds) {
                setState("posts", this.id, "commentIds", []);
              }
              if (this.commentIds?.includes(comment.id)) continue;
              setState("posts", this.id, "commentIds", [...this.commentIds!, comment.id]);
            }
          });
          return comments;
        },
        async submitReply(opts: {content: string, attachment?: File}) {
          const account = useAccount();
          const formattedContent = opts.content.trim();
          const post = await createPost({content: formattedContent, attachment: opts.attachment, replyToPostId: this.id}).catch((err) => {
            alert(err.message);
          });
          if (!post) return;
          batch(() => {
            if (!this.commentIds) {
              setState("posts", this.id, "commentIds", []);
            }
            pushPost(post, account.user()?.id!);
            setState("posts", this.id, "commentIds", [post.id, ...this.commentIds!]);
          });
        },
        cachedComments() {
          return this.commentIds?.map(postId => state.posts[postId] as Post);
        }
      });
      if (!userId) return;

  
      if (!state.userPostIds[userId]) {
        setState("userPostIds", userId, []);
      }
      if (state.userPostIds[userId]?.includes(post.id)) return;
      if (prependUserPost) {
        setState("userPostIds", userId, [...state.userPostIds[userId]!, post.id]);
      }
      else {
        setState("userPostIds", userId, [post.id, ...state.userPostIds[userId]!]);
      }
    });
  };

  const submitPost = async (opts: {content: string, file?: File, poll?: {choices: string[]}}) => {
    const account = useAccount();
    const formattedContent = opts.content.trim();
    const post = await createPost({content: formattedContent, attachment: opts.file, poll: opts.poll}).catch((err) => {
      alert(err.message);
    });
    if (!post) return;
    pushPost(post, account.user()?.id!);
    setState("feedPostIds", [post.id, ...state.feedPostIds]);
    setState("discoverPostIds", [post.id, ...state.discoverPostIds]);
  };

  const fetchUserPosts = async (userId: string, withReplies?: boolean) => {
    setState("userPostIds", userId, []);
    const posts = await getPosts({userId, withReplies});
    batch(() => {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        pushPost(post, userId);
      }
    });
    return posts;
  };
  const fetchMoreUserPosts = async (userId: string, withReplies?: boolean) => {
    const afterId = state.userPostIds?.[userId]?.at(-1);
    if (!afterId) return [];
    const posts = await getPosts({userId, withReplies, afterId});
    posts.reverse();
    batch(() => {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        pushPost(post, userId, true);
      }
    });
    return posts;
  };
  const fetchUserLikedPosts = async (userId: string) => {
    setState("userPostIds", userId, []);
    const posts = await getPostsLiked(userId);
    batch(() => {
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        pushPost(post, userId);
      }
    });
  };

  const cachedUserPosts = (userId: string) => {
    const postIds = state.userPostIds?.[userId];
    return postIds?.map(postId => state.posts[postId] as Post);
  };
  const fetchAndPushPost = async (postId: string) => {
    if (state.posts[postId]) return state.posts[postId];
    const post = await getPost(postId);
    if (!post) return undefined;
    pushPost(post);
    return state.posts[postId];
  };


  const fetchFeed = async () => {
    setState("feedPostIds", []);
    const posts = await getFeedPosts();
    batch(() => {
      for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        pushPost(post);
        setState("feedPostIds", state.feedPostIds.length, post.id);
      }
    });
    return posts;
  };

  const fetchMoreFeed = async () => {
    const afterId = state.feedPostIds?.at(-1);
    if (!afterId) return [];
    const posts = await getFeedPosts({afterId});
    batch(() => {
      for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        pushPost(post);
        setState("feedPostIds", [...state.feedPostIds, post.id]);
      }
    });
    return posts;
  };


  const fetchDiscover = async () => {
    setState("discoverPostIds", []);
    const posts = await getDiscoverPosts();
    posts.reverse();
    
    batch(() => {
      for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        pushPost(post);
        setState("discoverPostIds", state.discoverPostIds.length, post.id);
      }
    });
    return posts;
  };

  const fetchMoreDiscover = async () => {
    const afterId = state.discoverPostIds?.at(-1);
    if (!afterId) return [];
    const posts = await getDiscoverPosts({afterId});
    posts.reverse();
    batch(() => {
      for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        pushPost(post);
        setState("discoverPostIds", [...state.discoverPostIds, post.id]);
      }
    });
    return posts;
  };




  const cachedFeed = () => state.feedPostIds.map(id => state.posts[id] as Post);
  const cachedDiscover = () => state.discoverPostIds.map(id => state.posts[id] as Post);
  const cachedPost = (postId: string) => state.posts[postId];

  return {cachedDiscover, fetchDiscover, fetchMoreDiscover, pushPost, fetchFeed, cachedFeed, fetchMoreFeed, cachedPost, fetchUserPosts, fetchMoreUserPosts, cachedUserPosts, submitPost, fetchAndPushPost, fetchUserLikedPosts};
}
