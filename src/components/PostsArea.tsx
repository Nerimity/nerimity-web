import {
  PostNotificationType,
  RawPostChoice,
  RawPostNotification,
} from "@/chat-api/RawData";
import {
  DiscoverSort,
  getLikesPosts,
  getPostNotifications,
  LikedPost,
} from "@/chat-api/services/PostService";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp, timeSince } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useSearchParams } from "solid-navigator";
import {
  createEffect,
  createSignal,
  For,
  Index,
  JSX,
  lazy,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { SetStoreFunction, createStore, reconcile } from "solid-js/store";
import { css, styled } from "solid-styled-components";
import { Markup } from "./Markup";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { useCustomPortal } from "./ui/custom-portal/CustomPortal";
import { CustomLink } from "./ui/CustomLink";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Icon from "./ui/icon/Icon";
import Input from "./ui/input/Input";
import LegacyModal from "./ui/legacy-modal/LegacyModal";
import Text from "./ui/Text";
import { fileToDataUrl } from "@/common/fileToDataUrl";
import { useWindowProperties } from "@/common/useWindowProperties";
import { classNames } from "@/common/classNames";
import FileBrowser, { FileBrowserRef } from "./ui/FileBrowser";
import { EmojiPicker } from "./ui/emoji-picker/EmojiPicker";
import { formatMessage } from "./message-pane/MessagePane";
import { t } from "i18next";
import { Trans } from "@mbarzda/solid-i18next";
import ItemContainer from "./ui/Item";
import { Skeleton } from "./ui/skeleton/Skeleton";
import { Notice } from "./ui/Notice/Notice";
import { AdvancedMarkupOptions } from "./advanced-markup-options/AdvancedMarkupOptions";
import { PostItem } from "./post-area/PostItem";
import { MetaTitle } from "@/common/MetaTitle";
import DropDown from "./ui/drop-down/DropDown";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";

const PhotoEditor = lazy(() => import("./ui/photo-editor/PhotoEditor"));

const NewPostContainer = styled(FlexColumn)`
  background: rgba(0, 0, 0, 0.6);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin-bottom: 15px;
  border: solid 1px rgba(255, 255, 255, 0.2);
  border-top: none;
  transition: 0.2s;
  &[data-focused="true"] {
    border-bottom-color: var(--primary-color);
    border-bottom-width: 2px;
  }
`;
const NewPostOuterContainer = styled(FlexColumn)``;

const ButtonsContainer = styled(FlexRow)`
  position: relative;
  align-self: end;
  margin: 4px;
`;

const EmojiPickerContainer = styled("div")`
  position: absolute;
  top: 50px;
  right: -10px;
  z-index: 111111;
`;

function NewPostArea(props: {
  bgColor?: string;
  postId?: string;
  primaryColor?: string;
}) {
  const { posts, account } = useStore();

  const isSupporter = () =>
    hasBit(account.user()?.badges || 0, USER_BADGES.SUPPORTER.bit);
  const [content, setContent] = createSignal("");
  const { isPortalOpened } = useCustomPortal();
  const [attachedFile, setAttachedFile] = createSignal<File | undefined>(
    undefined
  );
  const [fileBrowserRef, setFileBrowserRef] = createSignal<
    undefined | FileBrowserRef
  >();
  const [showEmojiPicker, setShowEmojiPicker] = createSignal(false);
  const [textAreaEl, setTextAreaEl] = createSignal<
    undefined | HTMLTextAreaElement
  >(undefined);
  const { createPortal } = useCustomPortal();

  const [inputFocused, setInputFocused] = createSignal(false);

  const [showPollOptions, setShowPollOptions] = createSignal(false);
  const [pollOptions, setPollOptions] = createStore<string[]>([""]);

  onMount(() => {
    document.addEventListener("paste", onPaste);
    onCleanup(() => {
      document.removeEventListener("paste", onPaste);
    });
  });

  const editDone = (file: File) => {
    setAttachedFile(() => file);
  };
  const openEditor = async () => {
    const dataUrl = await fileToDataUrl(attachedFile()!);
    createPortal((close) => (
      <PhotoEditor done={editDone} src={dataUrl} close={close} />
    ));
  };

  const onPaste = (event: ClipboardEvent) => {
    const file = event.clipboardData?.files[0];
    if (!file) return;
    if (!file.type.startsWith("image")) return;
    setAttachedFile(() => file);
  };
  const onFilePicked = (list: FileList) => {
    const file = list.item(0) || undefined;
    setAttachedFile(() => file);
  };

  const onCreateClick = () => {
    const formattedContent = formatMessage(content().trim());
    if (props.postId) {
      posts.cachedPost(props.postId)?.submitReply({
        content: formattedContent,
        attachment: attachedFile(),
      });
    } else {
      posts.submitPost({
        content: formattedContent,
        file: attachedFile(),
        poll: showPollOptions() ? { choices: pollOptions } : undefined,
      });
    }
    setContent("");
    setPollOptions(reconcile([""]));
    setAttachedFile(undefined);
  };

  const onEmojiPicked = (shortcode: string, shiftMode?: boolean) => {
    textAreaEl()!.focus();
    textAreaEl()!.setRangeText(
      `:${shortcode}: `,
      textAreaEl()!.selectionStart,
      textAreaEl()!.selectionEnd,
      "end"
    );
    setContent(textAreaEl()!.value);
    if (!shiftMode) setShowEmojiPicker(false);
  };

  const togglePollOptions = () => {
    const newVal = !showPollOptions();
    setShowPollOptions(newVal);
    if (!newVal) {
      setPollOptions(reconcile([""]));
    }
  };

  const hasContentOrFocused = () => inputFocused() || content().length;
  return (
    <NewPostOuterContainer>
      <Show when={hasContentOrFocused()}>
        <Notice
          type="warn"
          class={css`
            margin-bottom 4px;
          `}
          description={"Self-harm content is not allowed on Nerimity."}
        />
      </Show>
      <AdvancedMarkupOptions
        hideEmojiPicker
        class={css`
          && {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            margin-bottom: 0;
          }
        `}
        primaryColor={props.primaryColor}
        inputElement={textAreaEl()!}
        updateText={setContent}
      />
      <NewPostContainer
        data-focused={inputFocused()}
        style={{ "background-color": props.bgColor }}
      >
        <Input
          primaryColor={props.primaryColor}
          maxLength={isSupporter() ? 1500 : 500}
          margin={[0, 0, 4, 0]}
          onBlur={() => setTimeout(() => setInputFocused(false), 100)}
          onFocus={() => setTimeout(() => setInputFocused(true), 100)}
          minHeight={hasContentOrFocused() ? 60 : undefined}
          class={css`
            div {
              background-color: transparent;
              border: transparent;
            }
          `}
          ref={setTextAreaEl}
          placeholder={
            props.postId
              ? t("posts.replyInputPlaceholder")
              : t("posts.createAPostInputPlaceholder")
          }
          onText={setContent}
          value={content()}
          type="textarea"
        />
        <Show when={showPollOptions()}>
          <PollOptions options={pollOptions} setOptions={setPollOptions} />
        </Show>
        <Show when={attachedFile()}>
          <AttachFileItem
            cancel={() => setAttachedFile(undefined)}
            file={attachedFile()!}
            onEditClick={openEditor}
          />
        </Show>
        <ButtonsContainer gap={6}>
          <FileBrowser
            accept="images"
            ref={setFileBrowserRef}
            onChange={onFilePicked}
          />

          <Button
            margin={0}
            padding={5}
            color={props.primaryColor}
            class={css`
              width: 20px;
              height: 20px;
            `}
            iconSize={16}
            onClick={() => fileBrowserRef()?.open()}
            iconName="attach_file"
          />
          <Button
            margin={0}
            padding={5}
            color={props.primaryColor}
            class={css`
              width: 20px;
              height: 20px;
            `}
            iconSize={16}
            onClick={togglePollOptions}
            iconName="poll"
          />
          <Button
            margin={0}
            padding={5}
            color={props.primaryColor}
            class={classNames(
              "emojiPickerButton",
              css`
                width: 20px;
                height: 20px;
              `
            )}
            iconSize={16}
            onClick={() => setShowEmojiPicker(!showEmojiPicker())}
            iconName="face"
          />
          <Button
            margin={0}
            padding={5}
            color={props.primaryColor}
            iconSize={16}
            onClick={onCreateClick}
            label={
              props.postId ? t("posts.replyButton") : t("posts.createButton")
            }
            iconName="send"
          />
          <Show when={showEmojiPicker()}>
            <EmojiPickerContainer>
              <EmojiPicker
                close={() => setShowEmojiPicker(false)}
                onClick={onEmojiPicked}
              />
            </EmojiPickerContainer>
          </Show>
        </ButtonsContainer>
      </NewPostContainer>
    </NewPostOuterContainer>
  );
}

const PollOptions = (props: {
  options: string[];
  setOptions: SetStoreFunction<string[]>;
}) => {
  const updateOption = (i: number, text: string) => {
    props.setOptions(i, text);
  };
  return (
    <FlexColumn gap={6} style={{ margin: "10px" }}>
      <Text>{t("posts.pollOptions")}</Text>
      <FlexColumn gap={4}>
        <Index each={props.options}>
          {(option, i) => (
            <PollOptionItem
              index={i}
              onText={(t) => updateOption(i, t)}
              value={option()}
              showAddButton={
                i === props.options.length - 1 && props.options.length <= 5
              }
              onAddClick={() => props.setOptions([...props.options, ""])}
            />
          )}
        </Index>
      </FlexColumn>
    </FlexColumn>
  );
};

const PollOptionItem = (props: {
  index: number;
  value: string;
  onText: (text: string) => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
}) => {
  return (
    <FlexRow itemsCenter gap={4}>
      <Input
        placeholder={t("posts.optionNumberPlaceholder", {
          number: props.index + 1,
        })}
        value={props.value}
        maxLength={56}
        onText={props.onText}
      />
      <Show when={props.showAddButton}>
        <Button margin={0} iconName="add" onClick={props.onAddClick} />
      </Show>
    </FlexRow>
  );
};

const AttachFileItemContainer = styled(FlexRow)`
  align-items: center;
  margin: 10px;
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

function AttachFileItem(props: {
  file: File;
  cancel(): void;
  onEditClick(): void;
}) {
  const [dataUrl, setDataUrl] = createSignal<string | undefined>(undefined);

  createEffect(async () => {
    const getDataUrl = await fileToDataUrl(props.file);
    setDataUrl(getDataUrl);
  });

  return (
    <AttachFileItemContainer gap={6}>
      <Icon name="attach_file" size={17} color="var(--primary-color)" />
      <img class={attachmentImageStyle} src={dataUrl()} alt="" />
      <Text>{props.file.name}</Text>
      <FlexRow gap={4}>
        <Button
          iconName="brush"
          onClick={props.onEditClick}
          iconSize={14}
          padding={5}
          margin={0}
        />
        <Button
          iconName="close"
          onClick={props.cancel}
          iconSize={14}
          padding={5}
          color="var(--alert-color)"
          margin={0}
        />
      </FlexRow>
    </AttachFileItemContainer>
  );
}

const PostOuterContainer = styled(FlexColumn)`
  scroll-margin-top: 50px;
  padding: 10px;

  border-bottom: solid 1px rgba(255, 255, 255, 0.2);

  &:first-child {
    border-top: solid 1px rgba(255, 255, 255, 0.2);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.07);
  }
`;

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
  });

  return (
    <FlexColumn gap={3}>
      <For each={users()}>
        {(user) => (
          <CustomLink href={RouterEndpoints.PROFILE(user.likedBy.id)}>
            <LikedUserContainer gap={10}>
              <Avatar user={user.likedBy} size={20} />
              <FlexRow style={{ "margin-right": "auto" }}>
                <Text>{user.likedBy.username}</Text>
                <Text opacity={0.6}>:{user.likedBy.tag}</Text>
              </FlexRow>
              <Text opacity={0.6} size={12}>
                {formatTimestamp(user.createdAt)}
              </Text>
            </LikedUserContainer>
          </CustomLink>
        )}
      </For>
    </FlexColumn>
  );
}

const PostsContainer = styled(FlexColumn)`
  overflow: auto;
`;

export function PostsArea(props: {
  showLiked?: boolean;
  showFeed?: boolean;
  showDiscover?: boolean;
  showReplies?: boolean;
  postId?: string;
  userId?: string;
  showCreateNew?: boolean;
  style?: JSX.CSSProperties;
  primaryColor?: string;
  bgColor?: string;
}) {
  const [loading, setLoading] = createSignal(false);
  const [sort, setSort] = createSignal<DiscoverSort | undefined>(
    "mostLiked7Days"
  );
  const { posts } = useStore();
  const [lastFetchCount, setLastFetchCount] = createSignal(0);
  let postsContainerRef: HTMLDivElement | undefined;

  const cachedReplies = () => {
    if (props.showDiscover) return posts.cachedDiscover();
    if (props.showFeed) return posts.cachedFeed();
    if (props.userId) return posts.cachedUserPosts(props.userId!);
    return posts.cachedPost(props.postId!)?.cachedComments();
  };

  createEffect(async () => {
    if (props.userId) {
      if (props.showLiked) {
        return posts.fetchUserLikedPosts(props.userId);
      }
      setLoading(true);
      const newPosts = await posts.fetchUserPosts(
        props.userId!,
        props.showReplies
      );
      setLastFetchCount(newPosts?.length || 0);
      setLoading(false);
    }
  });

  const fetchFeed = async () => {
    if (!props.showFeed) return;
    setLoading(true);
    const newPosts = await posts.fetchFeed();
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };

  const fetchDiscover = async () => {
    if (!props.showDiscover) return;
    setLoading(true);
    const newPosts = await posts.fetchDiscover(sort());
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };

  const fetchReplies = async () => {
    if (!props.postId) return;
    setLoading(true);
    const newPosts = await posts.cachedPost(props.postId!)?.loadComments();
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };

  createEffect(
    on([() => props.postId, sort], () => {
      fetchFeed();
      fetchDiscover();
      fetchReplies();
    })
  );

  const hasMorePosts = () => lastFetchCount() >= 30;

  const loadMoreComments = async () => {
    if (loading()) return;
    setLoading(true);
    const newPosts = await posts.cachedPost(props.postId!)?.loadMoreComments();
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };

  const loadMoreUserPosts = async () => {
    if (loading()) return;
    setLoading(true);
    const newPosts = await posts.fetchMoreUserPosts(
      props.userId!,
      props.showReplies
    );
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };

  const loadMoreFeed = async () => {
    if (loading()) return;
    setLoading(true);
    const newPosts = await posts.fetchMoreFeed();
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };
  const loadMoreDiscover = async () => {
    if (loading()) return;
    setLoading(true);
    const newPosts = await posts.fetchMoreDiscover(sort());
    setLastFetchCount(newPosts?.length || 0);
    setLoading(false);
  };

  const loadMore = () => {
    if (props.postId) {
      loadMoreComments();
    }
    if (props.userId) {
      loadMoreUserPosts();
    }
    if (props.showFeed) {
      loadMoreFeed();
    }
    if (props.showDiscover) {
      loadMoreDiscover();
    }
  };

  // TODO: use method to update post stats in real time.
  // onMount(() => {
  //   setInterval(() => {
  //     console.log(findIndexInViewport(postsContainerRef!));
  //   }, 5000);
  // });

  return (
    <PostsContainer gap={2} style={props.style}>
      <Show when={props.showCreateNew && (!props.showDiscover || !sort())}>
        <NewPostArea
          bgColor={props.bgColor}
          primaryColor={props.primaryColor}
        />
      </Show>
      <Show when={props.postId}>
        <NewPostArea
          bgColor={props.bgColor}
          primaryColor={props.primaryColor}
          postId={props.postId}
        />
      </Show>
      <Show when={props.showDiscover}>
        <DropDown
          class={css`
            margin-left: 2px;
            margin-bottom: 6px;
          `}
          onChange={(v) =>
            setSort(v.id === "0" ? undefined : (v.id as DiscoverSort))
          }
          selectedId={sort() || "0"}
          items={[
            { id: "0", label: "Latest" },
            { id: "mostLiked7Days", label: "Most Liked (7 days)" },
            { id: "mostLiked30days", label: "Most Liked (30 days)" },
            { id: "mostLikedAllTime", label: "Most Liked (All time)" },
          ]}
        />
      </Show>
      <FlexColumn ref={postsContainerRef}>
        <For each={cachedReplies()}>
          {(post, i) => (
            <PostItem
              bgColor={props.bgColor}
              post={post}
              primaryColor={props.primaryColor}
            />
          )}
        </For>

        <Show when={hasMorePosts() || loading()}>
          <For each={Array(10).fill(0)}>
            {() => (
              <Skeleton.Item
                class={css`
                  && {
                    border-radius: 0;
                    border-top: solid 1px rgba(255, 255, 255, 0.2);
                  }
                `}
                onInView={() => loadMore()}
                height="100px"
                width="100%"
              />
            )}
          </For>
        </Show>
      </FlexColumn>
    </PostsContainer>
  );
}

function partInViewport(elem: HTMLElement) {
  const x = elem.getBoundingClientRect().left;
  const y = elem.getBoundingClientRect().top;
  const ww = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  );
  const hw = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );
  const w = elem.clientWidth;
  const h = elem.clientHeight;
  return y < hw && y + h > 0 && x < ww && x + w > 0;
}

function findIndexInViewport(element: HTMLElement) {
  const children = element.children || [];
  for (let i = 0; i < children.length; i++) {
    const childEl = children[i]! as HTMLElement;
    if (partInViewport(childEl)) {
      return i;
    }
  }
  return -1;
}

const notificationUsernameStyles = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

function PostNotification(props: { notification: RawPostNotification }) {
  const { posts } = useStore();
  const [, setSearchParams] = useSearchParams<{ postId: string }>();

  const Reply = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!);

    const showPost = () =>
      setSearchParams({ postId: props.notification.post?.id! });

    return (
      <FlexRow gap={6} onclick={showPost}>
        <Icon
          class={css`
            margin-top: -2px;
          `}
          name="reply"
          color="var(--primary-color)"
        />
        <FlexColumn
          gap={2}
          class={notificationUsernameStyles}
          style={{ width: "100%" }}
        >
          <PostItem
            post={cachedPost()!}
            disableClick
            class={css`
              && {
                margin: 0;
                padding: 0;
                background: none;
                &:hover {
                  background: none;
                }
                box-shadow: none;
                &::before {
                  border: none;
                }
                &:first-child {
                  border: none;
                }
              }
            `}
          />
        </FlexColumn>
      </FlexRow>
    );
  };

  const Followed = () => {
    return (
      <A
        href={RouterEndpoints.PROFILE(props.notification.by.id)}
        style={{ "text-decoration": "none" }}
      >
        <FlexRow gap={6}>
          <Icon
            class={css`
              margin-top: 4px;
            `}
            name="add_circle"
            color="var(--primary-color)"
          />
          <Avatar
            class={css`
              margin-left: 6px;
              margin-right: 6px;
            `}
            user={props.notification.by}
            size={30}
          />
          <FlexRow
            gap={6}
            style={{ "align-items": "center" }}
            class={notificationUsernameStyles}
          >
            <Text size={14} class={notificationUsernameStyles}>
              <Trans
                key="posts.someoneFollowedYou"
                options={{ username: props.notification.by.username }}
              >
                <strong
                  class={notificationUsernameStyles}
                  style={{
                    display: "inline-block",
                    "max-width": "200px",
                    "vertical-align": "bottom",
                  }}
                >
                  {"username"}
                </strong>
                followed you!
              </Trans>
            </Text>
            <Text opacity={0.6} size={12}>
              {formatTimestamp(props.notification.createdAt)}
            </Text>
          </FlexRow>
        </FlexRow>
      </A>
    );
  };

  const Liked = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!);

    const showPost = () =>
      setSearchParams({ postId: props.notification.post?.id! });

    return (
      <FlexRow gap={6} onclick={showPost}>
        <Icon
          class={css`
            margin-top: 4px;
          `}
          name="favorite"
          color="var(--alert-color)"
        />
        <A
          onclick={(e) => e.stopPropagation()}
          href={RouterEndpoints.PROFILE(props.notification.by.id)}
          style={{ "margin-left": "6px", "margin-right": "6px" }}
        >
          <Avatar user={props.notification.by} size={30} />
        </A>
        <FlexColumn gap={2} style={{ overflow: "hidden" }}>
          <FlexRow gap={6} style={{ "align-items": "center" }}>
            <Text size={14} class={notificationUsernameStyles}>
              <Trans
                key="posts.someoneLikedYourPost"
                options={{ username: props.notification.by.username }}
              >
                <strong
                  class={notificationUsernameStyles}
                  style={{
                    display: "inline-block",
                    "max-width": "200px",
                    "vertical-align": "bottom",
                  }}
                >
                  {"username"}
                </strong>
                liked your post!
              </Trans>
            </Text>
            <Text opacity={0.6} size={12}>
              {formatTimestamp(props.notification.createdAt)}
            </Text>
          </FlexRow>
          <div
            style={{
              opacity: 0.6,
              "font-size": "14px",
              overflow: "hidden",
              "text-overflow": "ellipsis",
              "-webkit-line-clamp": "3",
              display: "-webkit-box",
              "-webkit-box-orient": "vertical",
            }}
          >
            <Show when={!cachedPost()?.deleted}>
              <Markup text={cachedPost()?.content || ""} />
            </Show>
            <Show when={cachedPost()?.deleted}>
              {t("posts.postWasDeleted")}
            </Show>
          </div>
        </FlexColumn>
      </FlexRow>
    );
  };

  return (
    <PostOuterContainer>
      <Show when={props.notification.type === PostNotificationType.LIKED}>
        <Liked />
      </Show>

      <Show when={props.notification.type === PostNotificationType.FOLLOWED}>
        <Followed />
      </Show>

      <Show when={props.notification.type === PostNotificationType.REPLIED}>
        <Reply />
      </Show>
    </PostOuterContainer>
  );
}

export function PostNotificationsArea(props: { style?: JSX.CSSProperties }) {
  const [notifications, setNotifications] = createSignal<RawPostNotification[]>(
    []
  );

  onMount(async () => {
    const fetchNotifications = await getPostNotifications();
    setNotifications(fetchNotifications);
  });
  return (
    <PostsContainer style={props.style}>
      <For each={notifications()}>
        {(notification) => <PostNotification notification={notification} />}
      </For>
    </PostsContainer>
  );
}

export function ViewPostModal(props: { close(): void }) {
  const [searchParams, setSearchParams] = useSearchParams<{ postId: string }>();
  const [selectedTab, setSelectedTab] = createSignal<"comments" | "likes">(
    "comments"
  );
  const { paneWidth } = useWindowProperties();

  const postId = () => searchParams.postId;

  const { posts } = useStore();

  const post = () => posts.cachedPost(postId());

  const [commentedToIds, setCommentedToIds] = createSignal<string[]>([]);
  const commentToList = () =>
    commentedToIds().map((postId) => posts.cachedPost(postId));

  createEffect(
    on(
      () => searchParams.postId,
      async (postId) => {
        setCommentedToIds([]);
        setSelectedTab("comments");
        if (!postId) return;
        getPost(postId);
      }
    )
  );

  const getPost = async (postId: string) => {
    const newPost = await posts.fetchAndPushPost(postId);
    newPost && setCommentedToIds([newPost.id, ...commentedToIds()]);
    if (newPost?.commentToId) getPost(newPost.commentToId);
    return newPost;
  };

  const onClose = () => {
    setSearchParams({ postId: undefined });
  };

  return (
    <LegacyModal
      close={onClose}
      title="Post"
      class={css`
        display: flex;
        flex-direction: column;
        width: 610px;
        max-height: 800px;
        height: calc(100% - 20px);
      `}
    >
      <MetaTitle>
        {!post() || post()?.deleted
          ? "Post"
          : `${post()?.createdBy.username}: ${post()?.content}`}
      </MetaTitle>
      <FlexColumn style={{ overflow: "auto", height: "100%" }}>
        <Show when={post()}>
          <FlexColumn>
            <For each={commentToList()}>
              {(post) => <PostItem showFullDate post={post!} />}
            </For>
          </FlexColumn>
          <FlexRow
            gap={6}
            style={{ "margin-top": "10px", "margin-bottom": "10px" }}
          >
            <Show when={!post()?.block}>
              <ItemContainer
                handlePosition="bottom"
                selected={selectedTab() === "comments"}
                style={{ padding: "8px", gap: "4px" }}
                onClick={() => setSelectedTab("comments")}
              >
                <Icon size={14} name="comment" />
                <Text
                  size={14}
                  color={
                    selectedTab() === "comments"
                      ? "white"
                      : "rgba(255,255,255,0.6)"
                  }
                >
                  {`Replies (${post()?._count?.comments})`}
                </Text>
              </ItemContainer>
              <ItemContainer
                handlePosition="bottom"
                selected={selectedTab() === "likes"}
                style={{ padding: "8px", gap: "4px" }}
                onClick={() => setSelectedTab("likes")}
              >
                <Icon size={14} name="favorite" />
                <Text
                  size={14}
                  color={
                    selectedTab() === "likes"
                      ? "white"
                      : "rgba(255,255,255,0.6)"
                  }
                >
                  {`Liked by (${post()?._count?.likedBy})`}
                </Text>
              </ItemContainer>
            </Show>
          </FlexRow>
          <Switch>
            <Match when={selectedTab() === "comments"}>
              <PostsArea style={{ overflow: "initial" }} postId={post()?.id} />
            </Match>
            <Match when={selectedTab() === "likes"}>
              <LikedUsers
                style={{ overflow: "initial" }}
                postId={post()?.id!}
              />
            </Match>
          </Switch>
        </Show>
      </FlexColumn>
    </LegacyModal>
  );
}

const DeletePostModalContainer = styled(FlexColumn)`
  overflow: auto;
  height: 100%;
  position: relative;
`;
const deletePostItemContainerStyles = css`
  pointer-events: none;
  && {
    background-color: rgba(0, 0, 0, 0.3);
    &:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }
`;

const deletePostModalStyles = css`
  display: flex;
  flex-direction: column;
  max-height: 800px;
  height: 100%;
  overflow: auto;
`;

export function DeletePostModal(props: { post: Post; close: () => void }) {
  const onDeleteClick = () => {
    props.close();
    props.post.delete();
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        onClick={props.close}
        iconName="close"
        label={t("posts.deletePostModal.cancelButton")}
      />
      <Button
        onClick={onDeleteClick}
        iconName="delete"
        color="var(--alert-color)"
        label={t("posts.deletePostModal.deleteButton")}
      />
    </FlexRow>
  );
  return (
    <LegacyModal
      close={props.close}
      title="Delete Post?"
      icon="delete"
      class={deletePostModalStyles}
      actionButtons={ActionButtons}
      maxWidth={500}
    >
      <DeletePostModalContainer>
        <Text>{t("posts.deletePostModal.message")}</Text>
        <PostItem
          hideDelete
          class={deletePostItemContainerStyles}
          post={props.post}
        />
      </DeletePostModalContainer>
    </LegacyModal>
  );
}

const editPostModalStyles = css`
  max-width: 600px;
  max-height: 600px;
  width: 100%;
  overflow: hidden;
`;

export function EditPostModal(props: { post: Post; close: () => void }) {
  const [content, setContent] = createSignal(props.post.content || "");

  const onEditClick = () => {
    const formattedContent = formatMessage(content().trim());
    props.close();
    props.post.editPost(formattedContent);
  };

  const ActionButtons = (
    <FlexRow style={{ "justify-content": "flex-end", flex: 1, margin: "5px" }}>
      <Button
        onClick={props.close}
        color="var(--alert-color)"
        iconName="close"
        label="Cancel"
      />
      <Button onClick={onEditClick} iconName="edit" label="Edit" />
    </FlexRow>
  );

  return (
    <LegacyModal
      close={props.close}
      title="Edit Post"
      icon="delete"
      class={editPostModalStyles}
      actionButtons={ActionButtons}
    >
      <DeletePostModalContainer>
        <Input
          maxLength={500}
          height={100}
          type="textarea"
          value={content()}
          onText={setContent}
        />
      </DeletePostModalContainer>
    </LegacyModal>
  );
}
