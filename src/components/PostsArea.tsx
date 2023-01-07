import { RawPost } from "@/chat-api/RawData";
import { createPost, getPosts, likePost, unlikePost } from "@/chat-api/services/PostService";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { css, styled } from "solid-styled-components";
import { Markup } from "./Markup";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Input from "./ui/input/Input";
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


function NewPostArea (props: {onPostCreated: (post: RawPost) => void}) {

  const [content, setContent] = createSignal("");

  const onCreateClick = async () => {
    const formattedContent = content().trim();
    setContent("");

    const post = await createPost(formattedContent);
    props.onPostCreated(post);
  }

  return (
    <NewPostContainer>
      <Input label="Write your post..." onText={setContent} value={content()} type="textarea" height={60} />
      <Button margin={0} class={createButtonStyles} onClick={onCreateClick} label="Create" iconName="send"  />
    </NewPostContainer>
  )
}

const PostContainer = styled(FlexColumn)`
  padding: 5px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 6px;
  padding-right: 6px;
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

function Post(props: {post: RawPost, onUpdate: (updatePost: RawPost) => void}) {
  const [requestSent, setRequestSent] = createSignal(false);
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
      const newPost = await unlikePost(props.post.id);
      props.onUpdate(newPost);
      setRequestSent(false);
      return;
    }
    const newPost = await likePost(props.post.id);
    props.onUpdate(newPost);
    setRequestSent(false);
  } 

  const Actions = () => (
    <PostActionsContainer>
      <Button margin={2} onClick={onLikeClick} class={postActionStyle} iconName={likedIcon()} label={props.post._count.likedBy.toLocaleString()} />
      <Button margin={2} class={postActionStyle} iconName="comment" label="0" />
      <Button margin={2} class={postActionStyle} iconName="format_quote" label="0" />
      <Button margin={2} class={postActionStyle} iconName="share" />
    </PostActionsContainer>
  );

  return (
    <PostContainer>
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
  margin-left: 10px;
  margin-right: 10px;
`;

export function PostsArea(props: {userId?: string, showCreateNew?: boolean, style?: JSX.CSSProperties}) {
  const [posts, setPosts] = createStore<RawPost[]>([]);

  onMount(async() => {
    const fetchedPosts = await getPosts(props.userId);
    setPosts(fetchedPosts);
  })

  const addPost = (post: RawPost) => {
    setPosts([post, ...posts])
  }

  const updatePost = (index: number, newPost: RawPost) => {
    setPosts(index, newPost)
  }


  return (
    <PostsContainer gap={5} style={props.style}>
      <Show when={props.showCreateNew}><NewPostArea onPostCreated={addPost}/></Show>
      <For each={posts}>
        {(post, i) => (
          <Post post={post} onUpdate={newPost => updatePost(i(), newPost)} />
        )}
      </For>
    
    </PostsContainer>
  )
}