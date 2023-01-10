import { RawPost } from "@/chat-api/RawData";
import { createPost, getCommentPosts, getPost, getPosts, likePost, unlikePost } from "@/chat-api/services/PostService";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import { createEffect, createSignal, For, JSX, on, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { css, styled } from "solid-styled-components";
import { Markup } from "./Markup";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { useCustomPortal } from "./ui/custom-portal/CustomPortal";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Input from "./ui/input/Input";
import Modal from "./ui/Modal";
import Text from "./ui/Text";

const NewPostContainer = styled(FlexColumn)`
  overflow: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.06);
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const createButtonStyles = css`
  align-self: end;
`;


function NewPostArea (props: {postId?: string}) {
  const {posts} = useStore();
  const [content, setContent] = createSignal("");

  const onCreateClick = async () => {
    if (props.postId) {
      posts.cachedPost(props.postId)?.submitReply(content())
    } else {
      posts.submitPost(content());
    }
    setContent("");
  }

  return (
    <NewPostContainer>
      <Input label={props.postId ? 'Write your reply...' : "Write your post..."} onText={setContent} value={content()} type="textarea" height={60} />
      <Button margin={0} class={createButtonStyles} onClick={onCreateClick} label={props.postId ? 'Reply' : "Create"} iconName="send"  />
    </NewPostContainer>
  )
}

const PostContainer = styled(FlexColumn)`
  scroll-margin-top: 50px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 6px;
  padding-right: 6px;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.07);
  }
`;

const PostDetailsContainer = styled(FlexRow)`
  align-items: center;
  margin-top: 5px;
  margin-left: 5px;
`;

const PostActionsContainer = styled(FlexRow)`
  align-items: center;
  margin-top: 5px;
  margin-left: 41px;
`;

const postActionStyle = css`
  background: transparent;
  padding: 5px;
  .label {
    font-size: 14px;
  }
  .icon {
    font-size: 14px;
  }
`;

function PostItem(props: { onClick?: (id: Post) => void; post: Post}) {
  const [requestSent, setRequestSent] = createSignal(false);
  const createPortal = useCustomPortal();
  const Details = () => (
    <PostDetailsContainer gap={10}>
      <Avatar hexColor={props.post.createdBy.hexColor} size={35} />
      <Text>{props.post.createdBy.username}</Text>
      <Text style={{"margin-left": "-2px"}} size={12} color="rgba(255,255,255,0.5)">{formatTimestamp(props.post.createdAt)}</Text>
    </PostDetailsContainer>
  )

  const isLikedByMe = () => props.post.likedBy.length;
  const likedIcon = () => isLikedByMe() ? 'favorite' : 'favorite_border'

  const onLikeClick = async () => {
    if (requestSent()) return;
    setRequestSent(true);
    if (isLikedByMe()) {
      await props.post.unlike();
      setRequestSent(false);
      return;
    }
    await props.post.like();
    setRequestSent(false);
  } 

  const Actions = () => (
    <PostActionsContainer>
      <Button margin={2} onClick={onLikeClick} class={postActionStyle} iconName={likedIcon()} label={props.post._count.likedBy.toLocaleString()} />
      <Button margin={2} class={postActionStyle} iconName="comment" label={props.post._count.comments.toLocaleString()} />
      <Button margin={2} class={postActionStyle} iconName="format_quote" label="0" />
      <Button margin={2} class={postActionStyle} iconName="share" />
    </PostActionsContainer>
  );

  const onClick = () => {
    createPortal?.((close) => <ViewPostModal close={close} postId={props.post.id} />)
  }

  return (
    <PostContainer tabIndex="0" onClick={onClick}>
      <Details/>
      <Text size={14} color="rgba(255,255,255,0.8)" style={{"margin-left": "50px"}}>
        <Markup text={props.post.content} />
      </Text>
      <Actions/>
    </PostContainer>
  )  
}


const PostsContainer = styled(FlexColumn)`
  overflow: auto;

`;

export function PostsArea(props: {postId?: string, userId?: string, showCreateNew?: boolean, style?: JSX.CSSProperties}) {

  const {posts} = useStore();

  const cachedPosts = () => {
    if (props.userId) return posts.cachedUserPosts(props.userId!);
    return posts.cachedPost(props.postId!)?.cachedComments();
  };

  onMount(() => {
    if (props.postId) {
      posts.cachedPost(props.postId!)?.loadComments();
      return;
    }
    posts.fetchUserPosts(props.userId!)
  })


  const onPostClick = (post: Post) => {
  }


  return (
    <PostsContainer gap={5} style={props.style}>
      <Show when={props.showCreateNew}><NewPostArea/></Show>
      <For each={cachedPosts()}>
        {(post, i) => (
          <PostItem onClick={onPostClick} post={post} />
        )}
      </For>
    </PostsContainer>
  )
}


function ViewPostModal (props: { close(): void; postId: string}) {
  const [postId, setPostId] = createSignal(props.postId);


  const {posts} = useStore();

  const post = () => posts.cachedPost(postId());

  const [commentedToIds, setCommentedToIds] = createSignal<string[]>([]);
  const commentToList = () => commentedToIds().map(postId => posts.cachedPost(postId))


  onMount(async () => {
    const newPost = await getPost(postId());
    newPost?.loadComments();
  })

  const getPost = async (postId: string) => {
    const newPost = await posts.fetchAndPushPost(postId);
    newPost && setCommentedToIds([newPost.id, ...commentedToIds()]);
    if (newPost?.commentToId) getPost(newPost.commentToId);

    return newPost;
  }

  return (
    <Modal close={props.close} title="Post" class={css`width: 600px; max-height: 600px; height: 100%;`}>
      <FlexColumn style={{overflow: "auto", height: "100%"}}>
        <Show when={post()}>
          <FlexColumn gap={5}>
            <For each={commentToList()}>
              {post => <PostItem post={post!} />}
            </For>
          <NewPostArea postId={postId()}/>
          </FlexColumn>
          <Text style={{"margin-bottom": "10px", "margin-top": "10px"}}>Replies</Text>
          <PostsArea postId={post()?.id} />
        </Show>
      </FlexColumn>
    </Modal>
  )
}