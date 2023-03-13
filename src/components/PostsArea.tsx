import { PostNotificationType, RawPost, RawPostNotification, RawUser } from "@/chat-api/RawData";
import { createPost, getCommentPosts, getLikesPosts, getPost, getPostNotifications, getPosts, getPostsLiked, LikedPost, likePost, unlikePost } from "@/chat-api/services/PostService";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { avatarUrl } from "@/chat-api/store/useUsers";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Link, useParams, useSearchParams } from "@nerimity/solid-router";
import { createEffect, createMemo, createSignal, For, JSX, Match, on, onMount, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { css, styled } from "solid-styled-components";
import { Markup } from "./Markup";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { useCustomPortal } from "./ui/custom-portal/CustomPortal";
import { CustomLink } from "./ui/CustomLink";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Icon from "./ui/icon/Icon";
import Input from "./ui/input/Input";
import Modal from "./ui/Modal";
import Text from "./ui/Text";

const NewPostContainer = styled(FlexColumn)`
  overflow: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const createButtonStyles = css`
  &&{
    align-self: end;
  }
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
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
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

export function PostItem(props: { hideDelete?: boolean; class?: string; onClick?: (id: Post) => void; post: Post}) {
  const {posts, account} = useStore();
  const [searchParams, setSearchParams] = useSearchParams<{postId: string}>()
  const [requestSent, setRequestSent] = createSignal(false);
  const {createPortal} = useCustomPortal();
  const [hovered, setHovered] = createSignal(false);
  
  const Details = () => (
    <PostDetailsContainer gap={10}>
      <CustomLink href={RouterEndpoints.PROFILE(props.post.createdBy.id)}>
        <Avatar animate={hovered()} url={avatarUrl(props.post.createdBy)} hexColor={props.post.createdBy.hexColor} size={35} />
      </CustomLink>
      <CustomLink style={{color: 'white'}} decoration href={RouterEndpoints.PROFILE(props.post.createdBy.id)}>{props.post.createdBy.username}</CustomLink>
      <Text style={{"margin-left": "-2px"}} size={12} color="rgba(255,255,255,0.5)">{formatTimestamp(props.post.createdAt)}</Text>
      <Show when={props.post.editedAt}>
        <Icon name="edit" size={12} title={`Edited at ${formatTimestamp(props.post.editedAt)}`} />
      </Show>
    </PostDetailsContainer>
  )

  const isLikedByMe = () => props.post.likedBy.length;
  const likedIcon = () => isLikedByMe() ? 'favorite' : 'favorite_border'

  const replyingTo = createMemo(() => {
    if (!props.post.commentToId) return;
    return posts.cachedPost(props.post.commentToId)
  })


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

  const onDeleteClick = () => 
    createPortal?.(close => <DeletePostModal close={close} post={props.post}/>)
  

  const onEditClicked = () => createPortal?.(close => <EditPostModal close={close} post={props.post}/>)

  const onClick = (event: any) => {
    if (props.post.deleted) return;
    if (event.target.closest(".button")) return;
    setSearchParams({postId: props.post.id})
  }
  onMount(() => {
  })

  const onCommentClick = () => setSearchParams({postId: props.post.id});

  const Actions = () => (
    <PostActionsContainer>
      <Button margin={2} onClick={onLikeClick} class={postActionStyle} iconName={likedIcon()} label={props.post._count.likedBy.toLocaleString()} />
      <Button margin={2} onClick={onCommentClick} class={postActionStyle} iconName="comment" label={props.post._count.comments.toLocaleString()} />
      <Button margin={2} class={postActionStyle} iconName="format_quote" label="0" />
      <Button margin={2} class={postActionStyle} iconName="share" />
      <FlexRow style={{"margin-left": "auto"}}>
        <Show when={props.post.createdBy.id === account.user()?.id && !props.hideDelete}>
          <Button onClick={onEditClicked} margin={2} class={postActionStyle} iconName="edit" />
          <Button onClick={onDeleteClick} margin={2} class={postActionStyle} color="var(--alert-color)" iconName="delete" />
        </Show>
      </FlexRow>
    </PostActionsContainer>
  );



  return (
    <PostContainer class={props.class} tabIndex="0" onClick={onClick} onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}>
      <Show when={props.post.deleted}>
        <Text style={{"padding": "10px"}}>This post was deleted!</Text>
      </Show>
      <Show when={!props.post.deleted}>
        <Show when={replyingTo()}>
          <FlexRow gap={5} style={{"margin-left": "5px", "margin-top": "5px"}}>
            <Text size={14}>Replying to</Text>
            <CustomLink decoration style={{"font-size": "14px"}} href={RouterEndpoints.PROFILE(replyingTo()?.createdBy.id!)}>{replyingTo()?.createdBy.username}</CustomLink>
          </FlexRow>
        </Show>
        <Details/>
        <Text size={14} color="rgba(255,255,255,0.8)" style={{"margin-left": "50px"}}>
          <Markup text={props.post.content} />
        </Text>
        <Actions/>
      </Show>
    </PostContainer>
  )  
}




const LikedUserContainer = styled(FlexRow)`
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 5px;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

function LikedUsers(props: {postId: string}) {
  const [users, setUsers] = createSignal<LikedPost[]>([]);

  createEffect(async () => {
    const newUsers = await getLikesPosts(props.postId);
    return setUsers(newUsers);
  })

  return (
    <FlexColumn gap={3}>
      <For each={users()}>
        {user => (
          <CustomLink href={RouterEndpoints.PROFILE(user.id)}>
            <LikedUserContainer gap={10}>
              <Avatar url={avatarUrl(user.likedBy)} size={20} hexColor={user.likedBy.hexColor} />
              <FlexRow style={{"margin-right": "auto"}}>
                <Text>{user.likedBy.username}</Text>
                <Text opacity={0.6}>:{user.likedBy.tag}</Text>
              </FlexRow>
              <Text opacity={0.6} size={12}>{formatTimestamp(user.createdAt)}</Text>
            </LikedUserContainer>
          </CustomLink>
        )}
      </For>
    </FlexColumn>
  )
}


const PostsContainer = styled(FlexColumn)`
  overflow: auto;

`;

export function PostsArea(props: { showLiked?: boolean, showFeed?: boolean, showReplies?: boolean, postId?: string, userId?: string, showCreateNew?: boolean, style?: JSX.CSSProperties}) {

  const {posts} = useStore();

  const cachedPosts = () => {
    if (props.showFeed) return posts.cachedFeed();
    if (props.userId) return posts.cachedUserPosts(props.userId!);
    return posts.cachedPost(props.postId!)?.cachedComments();
  };

  createEffect(() => {
    if (props.userId) {
      if (props.showLiked) {
        return posts.fetchUserLikedPosts(props.userId)
      }
      posts.fetchUserPosts(props.userId!, props.showReplies)
    }
  })

  createEffect(on(() => props.postId, () => {
    if (props.showFeed) {
      posts.fetchFeed();
      return;
    }
    if (props.postId) {
      posts.cachedPost(props.postId!)?.loadComments();
      return;
    }
  }));

  return (
    <PostsContainer gap={5} style={props.style}>
      <Show when={props.showCreateNew}><NewPostArea/></Show>
      <Show when={props.postId}><NewPostArea postId={props.postId}/></Show>
      <For each={cachedPosts()}>
        {(post, i) => (
          <PostItem post={post} />
        )}
      </For>
    </PostsContainer>
  )
}



function PostNotification (props: {notification: RawPostNotification}) {
  const {posts} = useStore();
  const {createPortal} = useCustomPortal();
  const [,setSearchParams] = useSearchParams<{postId: string}>();

  const Reply = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!)

    const showPost = () => setSearchParams({postId: props.notification.post?.id!})

    return (
      <FlexRow gap={5} style={{"align-items": 'center'}} onclick={showPost}>
        <Icon name="reply" color="var(--primary-color)" />
        <Link onclick={(e) => e.stopPropagation()} href={RouterEndpoints.PROFILE(props.notification.by.id)}><Avatar url={avatarUrl(props.notification.by)} hexColor={props.notification.by.hexColor} size={30} /></Link>
        <FlexColumn gap={2}>
          <FlexRow gap={5}  style={{"align-items": 'center'}}>
            <Text size={14}><strong>{props.notification.by.username}</strong> replied to your Post!</Text>
            <Text opacity={0.6} size={12}>{formatTimestamp(props.notification.createdAt)}</Text>
          </FlexRow>
          <div style={{opacity: 0.6, "font-size": "14px"}}>
            <Show when={!cachedPost()?.deleted}><Markup text={cachedPost()?.content!} /></Show>
            <Show when={cachedPost()?.deleted}>This post was deleted!</Show>
          </div>
        </FlexColumn>
      </FlexRow>
    )
  }
  
  const Followed = () => {
    return (
      <Link href={RouterEndpoints.PROFILE(props.notification.by.id)} style={{"text-decoration": 'none'}} >
        <FlexRow gap={5} style={{"align-items": 'center'}}>
          <Icon name="add_circle" color="var(--primary-color)" />
          <Avatar url={avatarUrl(props.notification.by)} hexColor={props.notification.by.hexColor} size={30} />
          <FlexRow gap={2} style={{"align-items": 'center'}}>
            <Text size={14}><strong>{props.notification.by.username}</strong> followed you!</Text>
            <Text opacity={0.6} size={12}>{formatTimestamp(props.notification.createdAt)}</Text>
          </FlexRow>
        </FlexRow>
      </Link>
    )
  }

  const Liked = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!)

    const showPost = () => setSearchParams({postId: props.notification.post?.id!})

    return (
      <FlexRow gap={5} style={{"align-items": 'center'}} onclick={showPost}>
        <Icon name="favorite" color="var(--primary-color)" />
        <Link onclick={(e) => e.stopPropagation()} href={RouterEndpoints.PROFILE(props.notification.by.id)}><Avatar url={avatarUrl(props.notification.by)} hexColor={props.notification.by.hexColor} size={30} /></Link>
        <FlexColumn gap={2}>
          <FlexRow gap={5} style={{"align-items": 'center'}}>
            <Text size={14}><strong>{props.notification.by.username}</strong> liked your post!</Text>
            <Text opacity={0.6} size={12}>{formatTimestamp(props.notification.createdAt)}</Text>
          </FlexRow>
          <div style={{opacity: 0.6, "font-size": "14px"}}>
            <Show when={!cachedPost()?.deleted}><Markup text={cachedPost()?.content!} /></Show>
            <Show when={cachedPost()?.deleted}>This post was deleted!</Show>
          </div>
        </FlexColumn>
      </FlexRow>
    )
  }




  return (
    <PostContainer>

      <Show when={props.notification.type === PostNotificationType.LIKED}>
        <Liked/>
      </Show>

      <Show when={props.notification.type === PostNotificationType.FOLLOWED}>
        <Followed/>
      </Show>

      <Show when={props.notification.type === PostNotificationType.REPLIED}>
        <Reply/>
      </Show>
      
    </PostContainer>
  )
}


export function PostNotificationsArea (props: { style?: JSX.CSSProperties}) {
  const [notifications, setNotifications] = createSignal<RawPostNotification[]>([]);
  
  onMount(async () => {
    const fetchNotifications = await getPostNotifications();
    setNotifications(fetchNotifications)
  })
  return (
    <PostsContainer gap={5} style={props.style}>
      <For each={notifications()}>
        {notification => <PostNotification notification={notification} />}
      </For>
    </PostsContainer>
  )
}


export function ViewPostModal (props: { close(): void }) {
  const [searchParams, setSearchParams] = useSearchParams<{postId: string}>();
  const [selectedTab, setSelectedTab] = createSignal<"comments" | "likes">('comments');

  const postId = () => searchParams.postId


  const {posts} = useStore();

  const post = () => posts.cachedPost(postId());

  const [commentedToIds, setCommentedToIds] = createSignal<string[]>([]);
  const commentToList = () => commentedToIds().map(postId => posts.cachedPost(postId))


  
  createEffect(on(() => searchParams.postId, async (postId) => {
    setCommentedToIds([]);
    setSelectedTab("comments")
    if (!postId) return;
    getPost(postId);

  }))


  const getPost = async (postId: string) => {
    const newPost = await posts.fetchAndPushPost(postId);
    newPost && setCommentedToIds([newPost.id, ...commentedToIds()]);
    if (newPost?.commentToId) getPost(newPost.commentToId);
    return newPost;
  }

  const onClose = () => {
    setSearchParams({postId: undefined})
  }

  return (
    <Modal close={onClose} title="Post" class={css`width: 600px; max-height: 700px; height: 100%;`}>
      <FlexColumn style={{overflow: "auto", height: "100%"}}>
        <Show when={post()}>
          <FlexColumn gap={5}>
            <For each={commentToList()}>
              {post => <PostItem post={post!} />}
            </For>
          </FlexColumn>
          <FlexRow gap={5} style={{"margin-top": "10px","margin-bottom": "10px"}}>
            <Button onClick={() => setSelectedTab("comments")} padding={5} textSize={14} iconSize={14} margin={0} iconName="comment" primary={selectedTab() === "comments"} label={`Replies (${post()?._count.comments})`}/>
            <Button onClick={() => setSelectedTab("likes")} padding={5} textSize={14} iconSize={14} margin={0} iconName="favorite" primary={selectedTab() === "likes"}  label={`Liked by (${post()?._count.likedBy})`}/>
          </FlexRow>
          <Switch>
            <Match when={selectedTab() === 'comments'}><PostsArea style={{overflow: 'initial'}} postId={post()?.id} /></Match>
            <Match when={selectedTab() === 'likes'}><LikedUsers style={{overflow: 'initial'}} postId={post()?.id} /></Match>
          </Switch>
        </Show>
      </FlexColumn>
    </Modal>
  )
}



const DeletePostModalContainer = styled(FlexColumn)`
  overflow: auto;
`;
const deletePostItemContainerStyles = css`
  padding-top: 5px;
  border-radius: 8px;
  margin-top: 5px;
  background-color: var(--pane-color);
  &&{
    &:hover {
      background-color: var(--pane-color);
    }

  }
`

const deletePostModalStyles = css`
  max-width: 600px;
  max-height: 600px;
  overflow: hidden;
`

function DeletePostModal(props: {post: Post, close: () => void}) {

  const onDeleteClick = () => {
    props.close();
    props.post.delete();
  }

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} iconName="close" label="Cancel" />
      <Button onClick={onDeleteClick} iconName="delete" color='var(--alert-color)' label="Delete" />
    </FlexRow>
  )

  return (
    <Modal close={props.close} title='Delete Post?'icon='delete' class={deletePostModalStyles} actionButtons={ActionButtons}>
      <DeletePostModalContainer>
        <Text>Are you sure you would like to delete this post?</Text>
          <PostItem hideDelete class={deletePostItemContainerStyles} post={props.post} />
      </DeletePostModalContainer>
    </Modal>
  )
}


const editPostModalStyles = css`
  max-width: 600px;
  max-height: 600px;
  width: 100%;
  overflow: hidden;
`


function EditPostModal(props: {post: Post, close: () => void}) {
  const [content, setContent] = createSignal(props.post.content || "");

  const onEditClick = () => {
    props.close();
    props.post.editPost(content())
  }

  const ActionButtons = (
    <FlexRow style={{"justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} color='var(--alert-color)'iconName="close" label="Cancel" />
      <Button onClick={onEditClick} iconName="edit"label="Edit" />
    </FlexRow>
  )

  return (
    <Modal close={props.close} title='Edit Post' icon='delete' class={editPostModalStyles} actionButtons={ActionButtons}>
      <DeletePostModalContainer>
          <Input height={100}  type="textarea" value={content()} onText={setContent} />
      </DeletePostModalContainer>
    </Modal>
  )
}