import { PostNotificationType, RawPost, RawPostNotification, RawUser } from "@/chat-api/RawData";
import { createPost, getCommentPosts, getLikesPosts, getPost, getPostNotifications, getPosts, getPostsLiked, LikedPost, likePost, unlikePost } from "@/chat-api/services/PostService";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { avatarUrl } from "@/chat-api/store/useUsers";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Link, useParams, useSearchParams } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, JSX, Match, on, onCleanup, onMount, Show, Switch } from "solid-js";
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
import { fileToDataUrl } from "@/common/fileToDataUrl";
import { ImageEmbed, clamp } from "./ui/ImageEmbed";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames } from "@/common/classNames";
import { useResizeObserver } from "@/common/useResizeObserver";
import FileBrowser, { FileBrowserRef } from "./ui/FileBrowser";

const NewPostContainer = styled(FlexColumn)`
  overflow: auto;
  padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
`;

const ButtonsContainer = styled(FlexRow)`
  align-self: end;
`;



function NewPostArea(props: { postId?: string }) {
  const { posts } = useStore();
  const [content, setContent] = createSignal("");
  const { isPortalOpened } = useCustomPortal();
  const [attachedFile, setAttachedFile] = createSignal<File | undefined>(undefined);
  const [fileBrowserRef, setFileBrowserRef] = createSignal<undefined | FileBrowserRef>()


  onMount(() => {
    document.addEventListener("paste", onPaste)
    onCleanup(() => {
      document.removeEventListener("paste", onPaste)
    })
  })

  const onPaste = (event: ClipboardEvent) => {
    const file = event.clipboardData?.files[0];
    if (!file) return;
    if (!file.type.startsWith("image")) return;
    setAttachedFile(() => file);
  }
  const onFilePicked = (list: FileList) => {
    const file = list.item(0) || undefined;
    setAttachedFile(() => file);
  }

  const onCreateClick = async () => {
    if (props.postId) {
      posts.cachedPost(props.postId)?.submitReply({ content: content(), attachment: attachedFile() })
    } else {
      posts.submitPost({ content: content(), file: attachedFile() });
    }
    setContent("");
    setAttachedFile(undefined);
  }

  return (
    <NewPostContainer>
      <Input placeholder={props.postId ? 'Reply...' : "Create a post..."} onText={setContent} value={content()} type="textarea" />
      <Show when={attachedFile()}><AttachFileItem cancel={() => setAttachedFile(undefined)} file={attachedFile()!} /></Show>
      <ButtonsContainer gap={5}>
        <FileBrowser accept='images' ref={setFileBrowserRef} onChange={onFilePicked}/>
        <Button margin={0} padding={5} class={css`width: 20px; height: 20px;`} iconSize={14} onClick={() => fileBrowserRef()?.open()} iconName="attach_file" />
        <Button margin={0} padding={5} iconSize={14} onClick={onCreateClick} label={props.postId ? 'Reply' : "Create"} iconName="send" />
      </ButtonsContainer>
    </NewPostContainer>
  )
}


const AttachFileItemContainer = styled(FlexRow)`
  align-items: center;
`;

const attachmentImageStyle = css`
  aspect-ratio: 16/9;
  object-fit: contain;
  flex-shrink: 0;
  max-width: 50px;
  max-height: 50px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
`;

function AttachFileItem(props: { file: File, cancel(): void }) {
  const [dataUrl, setDataUrl] = createSignal<string | undefined>(undefined);

  createEffect(async () => {
    const getDataUrl = await fileToDataUrl(props.file);
    setDataUrl(getDataUrl);
  })

  return (
    <AttachFileItemContainer gap={5}>
      <Icon name='attach_file' size={17} color='var(--primary-color)' />
      <img class={attachmentImageStyle} src={dataUrl()} alt="" />
      <Text>{props.file.name}</Text>
      <Button iconName='close' onClick={props.cancel} iconSize={14} padding={5} color='var(--alert-color)' />
    </AttachFileItemContainer>
  )

}



const PostContainer = styled(FlexColumn)`
  scroll-margin-top: 50px;
  padding: 3px;

  border-radius: 8px;

  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.06);
  &:hover {
    background: rgba(255, 255, 255, 0.1);
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
  margin-left: 48px;
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
const postUsernameStyle = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const postContentStyles = css`
  margin-left: 49px;
  word-break: break-word;
  white-space: pre-line;
  margin-top: -5px;
`

const editIconStyles = css`
  margin-left: 3px;
  vertical-align: -2px;
  color: rgba(255, 255, 255, 0.4);
`

const ReplyingToContainer = styled("div")`
  margin-left: 5px;
  margin-top: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export function PostItem(props: { disableClick?: boolean; hideDelete?: boolean; class?: string; onClick?: (id: Post) => void; post: Post }) {
  const { posts, account } = useStore();
  const [searchParams, setSearchParams] = useSearchParams<{ postId: string }>()
  const [requestSent, setRequestSent] = createSignal(false);
  const { createPortal } = useCustomPortal();
  const [hovered, setHovered] = createSignal(false);


  const Details = () => (
    <PostDetailsContainer gap={5}>
      <CustomLink href={RouterEndpoints.PROFILE(props.post.createdBy.id)}>
        <Avatar animate={hovered()} user={props.post.createdBy} size={40} />
      </CustomLink>
      <CustomLink class={postUsernameStyle} style={{ color: 'white' }} decoration href={RouterEndpoints.PROFILE(props.post.createdBy.id)}>{props.post.createdBy.username}</CustomLink>
      <Text style={{ "margin-left": "auto", "margin-right": "5px", "flex-shrink": 0 }} size={12} color="rgba(255,255,255,0.5)">{formatTimestamp(props.post.createdAt)}</Text>

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
  createPortal?.(close => <DeletePostModal close={close} post={props.post} />)


  const onEditClicked = () => createPortal?.(close => <EditPostModal close={close} post={props.post} />)

  let startClickPos = {x: 0, y: 0}
  let textSelected = false

  const onMouseDown = (event: any) => {
    startClickPos = {
      x: event.clientX,
      y: event.clientY
    }
    textSelected = !!window.getSelection()?.toString();

  }

  const onClick = (event: any) => {
    if (props.disableClick) return;
    if (props.post.deleted) return;
    if (event.target.closest(".button")) return;
    if (event.target.closest(".imageEmbedContainer")) return;
    if (startClickPos.x !== event.clientX && startClickPos.y !== event.clientY) {
      return;
    }
    if (textSelected) return;
    setSearchParams({ postId: props.post.id })
  }



  onMount(() => {
  })

  const onCommentClick = () => setSearchParams({ postId: props.post.id });

  const Actions = () => (
    <PostActionsContainer>
      <Button margin={2} onClick={onLikeClick} class={postActionStyle} iconName={likedIcon()} label={props.post._count.likedBy.toLocaleString()} />
      <Button margin={2} onClick={onCommentClick} class={postActionStyle} iconName="comment" label={props.post._count.comments.toLocaleString()} />
      <Button margin={2} class={postActionStyle} iconName="format_quote" label="0" />
      <Button margin={2} class={postActionStyle} iconName="share" />
      <FlexRow style={{ "margin-left": "auto" }}>
        <Show when={props.post.createdBy.id === account.user()?.id && !props.hideDelete}>
          <Button onClick={onEditClicked} margin={2} class={postActionStyle} iconName="edit" />
          <Button onClick={onDeleteClick} margin={2} class={postActionStyle} color="var(--alert-color)" iconName="delete" />
        </Show>
      </FlexRow>
    </PostActionsContainer>
  );



  return (
    <PostContainer class={props.class} style={{cursor: props.disableClick  ? 'initial' : 'pointer'}} tabIndex="0" onMouseDown={onMouseDown} onClick={onClick}  onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}>
      <Show when={props.post.deleted}>
        <Text style={{ "padding": "10px" }}>This post was deleted!</Text>
      </Show>
      <Show when={!props.post.deleted}>
        <Show when={replyingTo()}>
          <ReplyingToContainer>
            <Text size={14} style={{ "margin-right": "5px" }}>Replying to</Text>
            <CustomLink decoration style={{ "font-size": "14px" }} href={RouterEndpoints.PROFILE(replyingTo()?.createdBy.id!)}>{replyingTo()?.createdBy.username}</CustomLink>
          </ReplyingToContainer>
        </Show>
        <Details />
        <Text size={14} color="rgba(255,255,255,0.8)" class={postContentStyles}>
          <Show when={props.post.content}><Markup text={props.post.content} /></Show>
          <Show when={props.post.editedAt}>
            <Icon name="edit" class={editIconStyles} size={14} title={`Edited at ${formatTimestamp(props.post.editedAt)}`} />
          </Show>
        </Text>
        <Embeds post={props.post} hovered={hovered()} />
        <Actions />
      </Show>
    </PostContainer>
  )
}



const embedStyles = css`
  display: flex;
  flex-direction: column;
  margin-left: 50px;
  align-items: start;
`;


function Embeds(props: { post: Post, hovered: boolean }) {
  let element: HTMLDivElement | undefined;
  const [width] = useResizeObserver(() => element);
  const {height} = useWindowProperties();

  const clampedHeight = () => clamp(height(), 600)
  return (
    <div ref={element} class={classNames("embeds", embedStyles)}>
      <Show when={props.post.attachments?.[0]}>
        <ImageEmbed attachment={props.post.attachments?.[0]!} widthOffset={0} customHeight={clampedHeight()}  customWidth={width()} />
      </Show>
    </div>
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

function LikedUsers(props: { postId: string }) {
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
              <Avatar user={user.likedBy} size={20} />
              <FlexRow style={{ "margin-right": "auto" }}>
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

export function PostsArea(props: { showLiked?: boolean, showFeed?: boolean, showReplies?: boolean, postId?: string, userId?: string, showCreateNew?: boolean, style?: JSX.CSSProperties }) {

  const { posts } = useStore();

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
    <PostsContainer gap={2} style={props.style}>
      <Show when={props.showCreateNew}><NewPostArea /></Show>
      <Show when={props.postId}><NewPostArea postId={props.postId} /></Show>
      <For each={cachedPosts()}>
        {(post, i) => (
          <PostItem post={post} />
        )}
      </For>
    </PostsContainer>
  )
}


const notificationUsernameStyles = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

function PostNotification(props: { notification: RawPostNotification }) {
  const { posts } = useStore();
  const { createPortal } = useCustomPortal();
  const [, setSearchParams] = useSearchParams<{ postId: string }>();

  const Reply = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!)

    const showPost = () => setSearchParams({ postId: props.notification.post?.id! })

    return (
      <FlexRow gap={5} style={{ "align-items": 'center' }} onclick={showPost}>
        <Icon name="reply" color="var(--primary-color)" />
        <Link onclick={(e) => e.stopPropagation()} href={RouterEndpoints.PROFILE(props.notification.by.id)}><Avatar user={props.notification.by} size={30} /></Link>
        <FlexColumn gap={2} class={notificationUsernameStyles}>
          <FlexRow gap={5} style={{ "align-items": 'center' }}  >
            <Text size={14} class={notificationUsernameStyles}><strong class={notificationUsernameStyles}>{props.notification.by.username}</strong> replied to your Post!</Text>
            <Text opacity={0.6} size={12}>{formatTimestamp(props.notification.createdAt)}</Text>
          </FlexRow>
          <div style={{ opacity: 0.6, "font-size": "14px" }}>
            <Show when={!cachedPost()?.deleted}><Markup text={cachedPost()?.content!} /></Show>
            <Show when={cachedPost()?.deleted}>This post was deleted!</Show>
          </div>
        </FlexColumn>
      </FlexRow>
    )
  }

  const Followed = () => {
    return (
      <Link href={RouterEndpoints.PROFILE(props.notification.by.id)} style={{ "text-decoration": 'none' }} >
        <FlexRow gap={5} style={{ "align-items": 'center' }}>
          <Icon name="add_circle" color="var(--primary-color)" />
          <Avatar user={props.notification.by} size={30} />
          <FlexRow gap={2} style={{ "align-items": 'center' }} class={notificationUsernameStyles}>
            <Text size={14} class={notificationUsernameStyles}><strong class={notificationUsernameStyles}>{props.notification.by.username}</strong> followed you!</Text>
            <Text opacity={0.6} size={12}>{formatTimestamp(props.notification.createdAt)}</Text>
          </FlexRow>
        </FlexRow>
      </Link>
    )
  }

  const Liked = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!)

    const showPost = () => setSearchParams({ postId: props.notification.post?.id! })

    return (
      <FlexRow gap={5} style={{ "align-items": 'center' }} onclick={showPost}>
        <Icon name="favorite" color="var(--primary-color)" />
        <Link onclick={(e) => e.stopPropagation()} href={RouterEndpoints.PROFILE(props.notification.by.id)}><Avatar user={props.notification.by} size={30} /></Link>
        <FlexColumn gap={2}>
          <FlexRow gap={5} style={{ "align-items": 'center' }}>
            <Text size={14} class={notificationUsernameStyles}><strong class={notificationUsernameStyles}>{props.notification.by.username}</strong> liked your post!</Text>
            <Text opacity={0.6} size={12}>{formatTimestamp(props.notification.createdAt)}</Text>
          </FlexRow>
          <div style={{ opacity: 0.6, "font-size": "14px" }}>
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
        <Liked />
      </Show>

      <Show when={props.notification.type === PostNotificationType.FOLLOWED}>
        <Followed />
      </Show>

      <Show when={props.notification.type === PostNotificationType.REPLIED}>
        <Reply />
      </Show>

    </PostContainer>
  )
}


export function PostNotificationsArea(props: { style?: JSX.CSSProperties }) {
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


export function ViewPostModal(props: { close(): void }) {
  const [searchParams, setSearchParams] = useSearchParams<{ postId: string }>();
  const [selectedTab, setSelectedTab] = createSignal<"comments" | "likes">('comments');
  const {paneWidth} = useWindowProperties();

  const postId = () => searchParams.postId


  const { posts } = useStore();

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
    setSearchParams({ postId: undefined })
  }

  return (
    <Modal close={onClose} title="Post" class={css` width: 800px; max-height: 800px; height: calc(100% - 20px);`}>
      <FlexColumn style={{ overflow: "auto", height: "100%" }}>
        <Show when={post()}>
          <FlexColumn gap={5}>
            <For each={commentToList()}>
              {post => <PostItem disableClick post={post!} />}
            </For>
          </FlexColumn>
          <FlexRow gap={5} style={{ "margin-top": "10px", "margin-bottom": "10px" }}>
            <Button onClick={() => setSelectedTab("comments")} padding={5} textSize={14} iconSize={14} margin={0} iconName="comment" primary={selectedTab() === "comments"} label={`Replies (${post()?._count.comments})`} />
            <Button onClick={() => setSelectedTab("likes")} padding={5} textSize={14} iconSize={14} margin={0} iconName="favorite" primary={selectedTab() === "likes"} label={`Liked by (${post()?._count.likedBy})`} />
          </FlexRow>
          <Switch>
            <Match when={selectedTab() === 'comments'}><PostsArea style={{ overflow: 'initial' }} postId={post()?.id} /></Match>
            <Match when={selectedTab() === 'likes'}><LikedUsers style={{ overflow: 'initial' }} postId={post()?.id} /></Match>
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

function DeletePostModal(props: { post: Post, close: () => void }) {

  const onDeleteClick = () => {
    props.close();
    props.post.delete();
  }

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} iconName="close" label="Cancel" />
      <Button onClick={onDeleteClick} iconName="delete" color='var(--alert-color)' label="Delete" />
    </FlexRow>
  )

  return (
    <Modal close={props.close} title='Delete Post?' icon='delete' class={deletePostModalStyles} actionButtons={ActionButtons}>
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


function EditPostModal(props: { post: Post, close: () => void }) {
  const [content, setContent] = createSignal(props.post.content || "");

  const onEditClick = () => {
    props.close();
    props.post.editPost(content())
  }

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button onClick={props.close} color='var(--alert-color)' iconName="close" label="Cancel" />
      <Button onClick={onEditClick} iconName="edit" label="Edit" />
    </FlexRow>
  )

  return (
    <Modal close={props.close} title='Edit Post' icon='delete' class={editPostModalStyles} actionButtons={ActionButtons}>
      <DeletePostModalContainer>
        <Input height={100} type="textarea" value={content()} onText={setContent} />
      </DeletePostModalContainer>
    </Modal>
  )
}