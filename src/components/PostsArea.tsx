import {
  PostNotificationType,
  RawPost,
  RawPostChoice,
  RawPostNotification,
  RawUser,
} from "@/chat-api/RawData";
import {
  DiscoverSort,
  getLikesPosts,
  getPostNotifications,
  getPostReposts,
  LikedPost,
} from "@/chat-api/services/PostService";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useSearchParams } from "solid-navigator";
import {
  batch,
  children,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Index,
  JSX,
  lazy,
  Match,
  on,
  onCleanup,
  onMount,
  ParentComponent,
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
import { classNames, cn } from "@/common/classNames";
import FileBrowser, { FileBrowserRef } from "./ui/FileBrowser";
import { EmojiPicker } from "./ui/emoji-picker/EmojiPicker";
import { formatMessage } from "./message-pane/MessagePane";
import { t } from "@nerimity/i18lite";
import { Trans, TransProps } from "@nerimity/solid-i18lite";
import ItemContainer from "./ui/LegacyItem";
import { Skeleton } from "./ui/skeleton/Skeleton";
import { Notice } from "./ui/Notice/Notice";
import { AdvancedMarkupOptions } from "./advanced-markup-options/AdvancedMarkupOptions";
import { PostItem } from "./post-area/PostItem";
import { MetaTitle } from "@/common/MetaTitle";
import DropDown from "./ui/drop-down/DropDown";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import { escape, Portal } from "solid-js/web";
import { getSearchUsers } from "@/chat-api/services/UserService";
import { useSelectedSuggestion } from "@/common/useSelectedSuggestion";
import { createFilter } from "vite";
import { TenorImage } from "@/chat-api/services/TenorService";
import { Modal } from "./ui/modal";
import { UnescapedTrans } from "./UnescapedTrans";
import { StorageKeys, useLocalStorage } from "@/common/localStorage";

const PhotoEditor = lazy(() => import("./ui/photo-editor/PhotoEditor"));

const NewPostContainer = styled(FlexColumn)`
  background: rgba(0, 0, 0, 0.6);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border: solid 1px rgba(255, 255, 255, 0.2);
  border-top: none;
  transition: 0.2s;
  &[data-focused="true"] {
    border-bottom-color: var(--primary-color);
    border-bottom-width: 2px;
  }
`;
const NewPostOuterContainer = styled(FlexColumn)`
  margin-bottom: 6px;
`;

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
    undefined,
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
    const tempContent = content();
    const formattedContent = formatMessage(content().trim());
    const pollOpts = [...pollOptions];

    if (props.postId) {
      posts
        .cachedPost(props.postId)
        ?.submitReply({
          content: formattedContent,
          attachment: attachedFile(),
          poll: showPollOptions() ? { choices: pollOpts } : undefined,
        })
        .then((res) => {
          if (!res) {
            setContent(tempContent);
          }
        });
    } else {
      console.log(pollOpts);
      posts
        .submitPost({
          content: formattedContent,
          file: attachedFile(),
          poll: showPollOptions() ? { choices: pollOpts } : undefined,
        })
        .then((res) => {
          if (!res) {
            setContent(tempContent);
          }
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
      "end",
    );
    setContent(textAreaEl()!.value);
    if (!shiftMode) setShowEmojiPicker(false);
  };
  const gifPicked = (gif: TenorImage) => {
    textAreaEl()!.focus();
    textAreaEl()!.setRangeText(
      `${gif.gifUrl} `,
      textAreaEl()!.selectionStart,
      textAreaEl()!.selectionEnd,
      "end",
    );
    setContent(textAreaEl()!.value);
    setShowEmojiPicker(false);
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
          class={cn(
            css`
              div {
                background-color: transparent;
                border: transparent;
              }
            `,
            "newPostInput",
          )}
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
        <Suggestions
          textArea={textAreaEl()}
          content={content()}
          updateContent={setContent}
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
            iconName="checklist"
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
              `,
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
                showGifPicker
                close={() => setShowEmojiPicker(false)}
                gifPicked={gifPicked}
                onClick={onEmojiPicked}
              />
            </EmojiPickerContainer>
          </Show>
        </ButtonsContainer>
      </NewPostContainer>
      <Show when={hasContentOrFocused()}>
        <Notice
          type="warn"
          class={css`
            margin-top: 6px;
          `}
          description={t("posts.postWarning")}
        />
      </Show>
    </NewPostOuterContainer>
  );
}

function Suggestions(props: {
  textArea?: HTMLTextAreaElement;
  content: string;
  updateContent: (content: string) => void;
}) {
  const [textBefore, setTextBefore] = createSignal("");
  const [isFocus, setIsFocus] = createSignal(false);

  const onFocus = () => setIsFocus(true);

  const onClick = (e: any) => {
    setIsFocus(
      e.target.closest(".newPostInput") ===
        props.textArea?.parentElement?.parentElement,
    );
  };

  const update = () => {
    if (props.textArea?.selectionStart !== props.textArea?.selectionEnd)
      return setIsFocus(false);
    setIsFocus(true);
    const textBefore = getTextBeforeCursor(props.textArea);
    setTextBefore(textBefore);
  };

  const onSelectionChange = () => {
    if (!isFocus()) return;
    update();
  };

  createEffect(() => {
    props.textArea?.addEventListener("focus", onFocus);
    document.addEventListener("click", onClick);
    document.addEventListener("selectionchange", onSelectionChange);
    onCleanup(() => {
      props.textArea?.removeEventListener("focus", onFocus);
      document.removeEventListener("click", onClick);
      document.removeEventListener("selectionchange", onSelectionChange);
    });
  });

  const suggestUsers = () => textBefore().startsWith("@");

  createEffect(on(() => props.content, update));

  // search={textBefore().substring(1)}
  return (
    <Show when={isFocus() && suggestUsers()}>
      <SuggestUsers
        updateContent={props.updateContent}
        content={props.content}
        search={textBefore().substring(1)}
        textAreaEl={props.textArea}
      />
    </Show>
  );
}

function getCursorPositionPx(
  textarea: HTMLTextAreaElement,
): { x: number; y: number } | null {
  if (!textarea) {
    return null; // Handle cases where the textarea is not provided or doesn't exist
  }

  try {
    // Create a dummy element to measure text width
    const temp = document.createElement("span");
    temp.style.cssText = `
      position: absolute;
      left: -9999px; /* Hide off-screen */
      top: 0;
      white-space: pre-wrap; /* Preserve whitespace */
    `;

    // Copy styles from the textarea to the dummy element
    const styles = window.getComputedStyle(textarea);
    temp.style.font = styles.font;
    temp.style.padding = styles.padding;
    temp.style.border = styles.border;
    temp.style.letterSpacing = styles.letterSpacing; // Important for accurate positioning
    temp.style.textTransform = styles.textTransform;

    document.body.appendChild(temp);

    const value = textarea.value;
    const position = textarea.selectionStart; // Get cursor/selection start

    // Calculate text before cursor
    const textBeforeCursor = value.substring(0, position);

    temp.textContent = textBeforeCursor;

    // Get width and height of the text before the cursor
    const width = temp.offsetWidth;
    const height = temp.offsetHeight;

    // Get textarea's position relative to the document
    const textareaRect = textarea.getBoundingClientRect();

    // Calculate the absolute position based on the text width, height, and textarea position.
    const x = textareaRect.left + width;
    const y = textareaRect.top + height;

    document.body.removeChild(temp); // Clean up

    return { x, y };
  } catch (error) {
    console.error("Error getting cursor position:", error);
    return null;
  }
}
function SuggestUsers(props: {
  search: string;
  textAreaEl?: HTMLTextAreaElement;
  content: string;
  updateContent: (content: string) => void;
}) {
  const [users, setUsers] = createSignal<RawUser[]>([]);

  const onUserClick = (user?: RawUser) => {
    appendText(
      props.textAreaEl!,
      props.search,
      `${user?.username}:${user?.tag} `,
      props.content,
      props.updateContent,
    );
  };

  const [current, , , setCurrent] = useSelectedSuggestion(
    () => users().length,
    () => props.textAreaEl!,
    (i) => onUserClick(users()[i]),
  );

  let timeoutId: number | undefined;
  const [position, setPosition] = createSignal({
    top: "0px",
    left: "0px",
    textAreaWidth: 0,
  });

  const fetchAndSetUsers = async () => {
    if (!props.search.trim()) {
      setUsers([]);
      return;
    }
    const users = await getSearchUsers(props.search);
    setCurrent(0);
    setUsers(users);
    const pos = getCursorPositionPx(props.textAreaEl!);
    const rect = props.textAreaEl?.getBoundingClientRect()!;
    if (pos && rect)
      setPosition({
        top: `${pos.y}px`,
        left: `${rect.left}px`,
        textAreaWidth: rect?.width,
      });
  };
  createEffect(
    on(
      () => props.search,
      () => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(fetchAndSetUsers, 500);
      },
    ),
  );

  return (
    <Show when={users().length}>
      <Portal>
        <FlexColumn
          class={css`
            background: var(--pane-color);
            position: absolute;
            margin-left: 10px;
            max-height: 200px;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 6px;
            border-radius: 6px;
            border: solid 1px rgba(255, 255, 255, 0.2);
            z-index: 11111111111111111111111111111111;
          `}
          style={{
            ...position(),
            "max-width": `${position().textAreaWidth - 30}px`,
          }}
        >
          <For each={users()}>
            {(user, i) => (
              <SuggestUserItem
                onHover={() => setCurrent(i())}
                selected={current() === i()}
                onClick={onUserClick}
                user={user}
              />
            )}
          </For>
        </FlexColumn>
      </Portal>
    </Show>
  );
}

function appendText(
  textArea: HTMLTextAreaElement,
  query: string,
  name: string,
  content: string,
  updateContent: (content: string) => void,
) {
  const cursorPosition = textArea.selectionStart!;
  const removeCurrentQuery = removeByIndex(
    content,
    cursorPosition - query.length,
    query.length,
  );
  const result =
    removeCurrentQuery.slice(0, cursorPosition - query.length) +
    name +
    removeCurrentQuery.slice(cursorPosition - query.length);

  updateContent(result);

  textArea.focus();
  textArea.selectionStart = cursorPosition + (name.length - query.length);
  textArea.selectionEnd = cursorPosition + (name.length - query.length);
}

function removeByIndex(val: string, index: number, remove: number) {
  return val.substring(0, index) + val.substring(index + remove);
}

const SuggestUserItemContainer = styled(FlexRow)`
  padding: 6px;
  &[data-selected="true"] {
    background: rgba(255, 255, 255, 0.08);
  }
  border-radius: 4px;
`;

function SuggestUserItem(props: {
  user: RawUser;
  onHover: () => void;
  onClick: (user: RawUser) => void;
  selected: boolean;
}) {
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.selected) {
      ref?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });
  return (
    <SuggestUserItemContainer
      gap={6}
      itemsCenter
      onmousemove={props.onHover}
      data-selected={props.selected}
      onclick={() => props.onClick(props.user)}
      ref={ref}
    >
      <Avatar user={props.user} size={30} />
      <div>{props.user.username}</div>
    </SuggestUserItemContainer>
  );
}

function getTextBeforeCursor(element?: HTMLTextAreaElement) {
  if (!element) return "";
  const cursorPosition = element.selectionStart;
  const textBeforeCursor = element.value.substring(0, cursorPosition);
  const lastWord = textBeforeCursor.split(/\s+/).reverse()[0];
  return lastWord;
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
function RepostedUsers(props: { postId: string }) {
  const [reposts, setReposts] = createSignal<RawPost[]>([]);

  const fetchAndSetReposts = async () => {
    const newReposts = await getPostReposts(props.postId);
    return setReposts(newReposts);
  };

  createEffect(() => {
    fetchAndSetReposts();
  });

  return (
    <FlexColumn gap={3}>
      <For each={reposts()}>
        {(repost) => (
          <CustomLink href={RouterEndpoints.PROFILE(repost.createdBy.id)}>
            <LikedUserContainer gap={10}>
              <Avatar user={repost.createdBy} size={20} />
              <FlexRow style={{ "margin-right": "auto" }}>
                <Text>{repost.createdBy.username}</Text>
                <Text opacity={0.6}>:{repost.createdBy.tag}</Text>
              </FlexRow>
              <Text opacity={0.6} size={12}>
                {formatTimestamp(repost.createdAt)}
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
  pinnedPosts?: Post[] | RawPost[];
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

  const [sort, setSort] = useLocalStorage<
    (DiscoverSort | "latest") | undefined
  >(StorageKeys.DASHBOARD_POST_SORT, "mostLiked7Days");

  const { posts } = useStore();
  const [lastFetchCount, setLastFetchCount] = createSignal(0);
  let postsContainerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.pinnedPosts?.length) {
      batch(() => {
        for (let i = 0; i < props.pinnedPosts!.length; i++) {
          const post = props.pinnedPosts![i]!;
          posts.pushPost(post);
        }
      });
    }
  });

  const pinnedPosts = createMemo(() => {
    if (!props.pinnedPosts?.length) return [];
    return props.pinnedPosts
      .map((post) => posts.cachedPost(post.id))
      .filter((post) => post) as Post[];
  });

  const cachedReplies = () => {
    if (props.showDiscover) return posts.cachedDiscover();
    if (props.showFeed) return removeDuplicateReposts(posts.cachedFeed());
    if (props.showFeed) return posts.cachedFeed();
    if (props.userId) return posts.cachedUserPosts(props.userId!);
    return posts.cachedPost(props.postId!)?.cachedComments();
  };

  const removeDuplicateReposts = (posts: Post[]) => {
    const duplicateIds: string[] = [];
    return posts.filter((post) => {
      if (!post.repost?.id) return true;
      if (duplicateIds.includes(post.repost?.id)) return false;
      duplicateIds.push(post.repost?.id!);
      return true;
    });
  };

  createEffect(async () => {
    if (props.userId) {
      if (props.showLiked) {
        return posts.fetchUserLikedPosts(props.userId);
      }
      setLoading(true);
      const newPosts = await posts.fetchUserPosts(
        props.userId!,
        props.showReplies,
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

  let abortController: AbortController | undefined = undefined;

  const fetchDiscover = async () => {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const sortValue = sort();
    if (!props.showDiscover) return;
    setLoading(true);
    const newPosts = await posts.fetchDiscover(
      sortValue === "latest" ? undefined : sortValue,
      abortController.signal,
    );
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
    }),
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
      props.showReplies,
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
    const sortValue = sort();
    const newPosts = await posts.fetchMoreDiscover(
      sortValue === "latest" ? undefined : sortValue,
    );
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
          onChange={(v) => setSort(v.id)}
          selectedId={sort() || "0"}
          items={[
            { id: "latest", label: t("posts.sort.latest") },
            { id: "mostLiked7Days", label: t("posts.sort.mostLiked7Days") },
            { id: "mostLiked30days", label: t("posts.sort.mostLiked30Days") },
            { id: "mostLikedAllTime", label: t("posts.sort.mostLikedAllTime") },
          ]}
        />
      </Show>
      <FlexColumn ref={postsContainerRef}>
        <For each={pinnedPosts()}>
          {(post) => (
            <PostItem
              bgColor={props.bgColor}
              post={post}
              pinned
              primaryColor={props.primaryColor}
            />
          )}
        </For>
        <For each={cachedReplies()}>
          {(post, i) => (
            <PostItem
              bgColor={props.bgColor}
              post={post}
              showRepostsAsSelf={props.userId}
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
    window.innerWidth || 0,
  );
  const hw = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0,
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
  const Mention = () => {
    posts.pushPost(props.notification.post!);
    const cachedPost = () => posts.cachedPost(props.notification.post?.id!);

    const showPost = () =>
      setSearchParams({ postId: props.notification.post?.id! });

    return (
      <FlexRow gap={6} onclick={showPost}>
        <Icon
          class={css`
            margin-top: 6px;
          `}
          name="alternate_email"
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
              <UnescapedTrans
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
              </UnescapedTrans>
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
              <UnescapedTrans
                key="posts.someoneLikedYourPost"
                options={{
                  username: props.notification.by.username,
                }}
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
              </UnescapedTrans>
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
  const Reposted = () => {
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
          name="repeat"
          color="var(--success-color)"
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
              <UnescapedTrans
                key="posts.someoneRepostedYourPost"
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
                reposted your post!
              </UnescapedTrans>
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
      <Show when={props.notification.type === PostNotificationType.REPOSTED}>
        <Reposted />
      </Show>
      <Show when={props.notification.type === PostNotificationType.MENTIONED}>
        <Mention />
      </Show>
    </PostOuterContainer>
  );
}

export function PostNotificationsArea(props: { style?: JSX.CSSProperties }) {
  const [notifications, setNotifications] = createSignal<RawPostNotification[]>(
    [],
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
  const [selectedTab, setSelectedTab] = createSignal<
    "comments" | "likes" | "reposts"
  >("comments");
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
      },
    ),
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
      title={t("posts.title")}
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
          ? t("posts.title")
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
                  {t("posts.sections.replies", { count: `${post()?._count?.comments}` })}
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
                  {t("posts.sections.likes", { count: `${post()?._count?.likedBy}` })}
                </Text>
              </ItemContainer>
              <ItemContainer
                handlePosition="bottom"
                selected={selectedTab() === "reposts"}
                style={{ padding: "8px", gap: "4px" }}
                onClick={() => setSelectedTab("reposts")}
              >
                <Icon size={14} name="repeat" />
                <Text
                  size={14}
                  color={
                    selectedTab() === "reposts"
                      ? "white"
                      : "rgba(255,255,255,0.6)"
                  }
                >
                  {t("posts.sections.reposts", { count: `${post()?._count?.reposts}` })}
                </Text>
              </ItemContainer>
            </Show>
          </FlexRow>
          <Switch>
            <Match when={selectedTab() === "comments"}>
              <PostsArea style={{ overflow: "initial" }} postId={post()?.id} />
            </Match>
            <Match when={selectedTab() === "likes"}>
              <LikedUsers postId={post()?.id!} />
            </Match>
            <Match when={selectedTab() === "reposts"}>
              <RepostedUsers postId={post()?.id!} />
            </Match>
          </Switch>
        </Show>
      </FlexColumn>
    </LegacyModal>
  );
}

const deletePostItemContainerStyles = css`
  pointer-events: none;
  border-radius: 8px;
  margin-top: 5px;

  && {
    &:before {
      border-bottom: none;
    }
    padding: 10px;
    border: solid 1px rgba(255, 255, 255, 0.1);
  }
`;

const deletePostModalStyles = css`
  max-height: 800px;
  overflow: hidden;
`;
const deletePostBodyContainerStyles = css`
  overflow: auto;
  max-height: 600px;
`;

export function DeletePostModal(props: { post: Post; close: () => void }) {
  const onDeleteClick = () => {
    props.close();
    props.post.delete();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onDeleteClick();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  return (
    <Modal.Root
      desktopMaxWidth={600}
      desktopMinWidth={400}
      close={props.close}
      class={deletePostModalStyles}
    >
      <Modal.Header title={t("posts.deletePostModal.title")} icon="delete" alert />
      <Modal.Body class={deletePostBodyContainerStyles}>
        <Text size={14}>{t("posts.deletePostModal.message")}</Text>
        <PostItem
          hideDelete
          class={deletePostItemContainerStyles}
          post={props.post}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("general.cancelButton")}
          onClick={props.close}
          iconName="close"
        />
        <Modal.Button
          primary
          label={t("general.deleteButton")}
          onClick={onDeleteClick}
          iconName="delete"
          color="var(--alert-color)"
        />
      </Modal.Footer>
    </Modal.Root>
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
  const store = useStore();

  const [textAreaEl, setTextAreaEl] = createSignal<HTMLTextAreaElement>();

  const isSupporter = () =>
    hasBit(store.account.user()?.badges || 0, USER_BADGES.SUPPORTER.bit);

  const onEditClick = () => {
    const formattedContent = formatMessage(content().trim());
    props.close();
    props.post.editPost(formattedContent);
  };

  return (
    <Modal.Root
      close={props.close}
      class={editPostModalStyles}
      desktopMaxWidth={600}
      desktopMinWidth={400}
    >
      <Modal.Header title={t("posts.editPostModalTitle")} icon="edit" />
      <Modal.Body>
        <AdvancedMarkupOptions
          showGifPicker
          class={css`
            && {
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
              margin-bottom: 0;
            }
          `}
          inputElement={textAreaEl()!}
          updateText={setContent}
        />

        <Input
          ref={setTextAreaEl}
          maxLength={isSupporter() ? 1500 : 500}
          type="textarea"
          minHeight={40}
          class={css`
            div {
              border-top-left-radius: 0;
              border-top-right-radius: 0;
              border-top: none;
              background-color: rgba(0, 0, 0, 0.6);
            }
          `}
          value={content()}
          onText={setContent}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Button
          label={t("general.cancelButton")}
          onClick={props.close}
          iconName="close"
          alert
        />
        <Modal.Button
          label={t("general.editButton")}
          onClick={onEditClick}
          primary
          iconName="edit"
        />
      </Modal.Footer>
    </Modal.Root>
  );
}
