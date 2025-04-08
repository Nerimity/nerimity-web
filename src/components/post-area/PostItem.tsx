import { cn } from "@/common/classNames";
import style from "./PostItem.module.scss";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { A, useNavigate, useSearchParams } from "solid-navigator";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import Text from "../ui/Text";
import { t } from "i18next";
import RouterEndpoints from "@/common/RouterEndpoints";
import Avatar from "../ui/Avatar";
import { CustomLink } from "../ui/CustomLink";
import { formatTimestamp, timeSince } from "@/common/date";
import { Markup } from "../Markup";
import Icon from "../ui/icon/Icon";
import Button from "../ui/Button";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { Tooltip } from "../ui/Tooltip";
import { useResizeObserver } from "@/common/useResizeObserver";
import { clamp, clampImageSize, ImageEmbed } from "../ui/ImageEmbed";
import {
  RawEmbed,
  RawPostChoice,
  RawPostPoll,
  RawUser,
} from "@/chat-api/RawData";
import { RadioBoxItem } from "../ui/RadioBox";
import { DeletePostModal, EditPostModal } from "../PostsArea";
import { css } from "solid-styled-components";
import ContextMenu from "../ui/context-menu/ContextMenu";
import {
  pinPost,
  repostPost,
  unpinPost,
} from "@/chat-api/services/PostService";
import env from "@/common/env";
import {
  OGEmbed,
  ServerInviteEmbed,
} from "../message-pane/message-item/MessageItem";
import { inviteLinkRegex, youtubeLinkRegex } from "@/common/regex";
import { useWindowProperties } from "@/common/useWindowProperties";
import { RawYoutubeEmbed } from "../message-pane/message-item/RawYoutubeEmbed";

const viewsEnabledAt = new Date();
viewsEnabledAt.setUTCFullYear(2024);
viewsEnabledAt.setUTCDate(5);
viewsEnabledAt.setUTCMonth(7);
viewsEnabledAt.setUTCHours(9);
viewsEnabledAt.setUTCMinutes(54);
const timestampViewsEnabledAt = viewsEnabledAt.getTime();

export function PostItem(props: {
  primaryColor?: string;
  bgColor?: string;
  reposted?: boolean;
  showFullDate?: boolean;
  disableClick?: boolean;
  hideDelete?: boolean;
  class?: string;
  onClick?: (id: Post) => void;
  post: Post;
  pinned?: boolean;
  showRepostsAsSelf?: boolean | any;
}) {
  const { posts } = useStore();

  if (props.post.repost) {
    posts.pushPost(props.post.repost);
    const post = () => posts.cachedPost(props.post.repost?.id!);
    return <PostItem {...props} post={post()!} reposted />;
  }
  const [search, setSearchParams] = useSearchParams<{ postId: string }>();
  const [hovered, setHovered] = createSignal(false);

  const [pinned, setPinned] = createSignal(props.pinned);

  const replyingTo = createMemo(() => {
    if (!props.post.commentToId) return;
    return posts.cachedPost(props.post.commentToId);
  });

  let startClick = { x: 0, y: 0 };
  let textSelected = false;

  const onMouseDown = (event: any) => {
    startClick = {
      x: event.clientX,
      y: event.clientY,
    };
    textSelected = !!window.getSelection()?.toString();
  };

  const onClick = (event: any) => {
    const alreadyOpened = search.postId === props.post.id;
    if (alreadyOpened) return;
    if (props.disableClick) return;
    if (props.post.deleted) return;
    if (event.target.closest(".button")) return;
    if (event.target.closest(".imageEmbedContainer")) return;
    if (event.target.closest(".pollEmbedContainer")) return;
    if (event.target.closest(".mention.timestamp")) return;
    if (event.target.closest(".spoiler")) return;
    if (event.target.closest("a")) return;
    const clickedPos =
      startClick.x !== event.clientX && startClick.y !== event.clientY;

    if (clickedPos) {
      return;
    }
    if (textSelected) return;
    setSearchParams({ postId: props.post.id });
  };

  return (
    <div
      class={cn(
        "postItem",
        props.class,
        style.postContainer,
        props.disableClick && style.disableClick,
        props.primaryColor &&
          css`
            .markup a {
              color: ${props.primaryColor};
            }
            .markup blockquote {
              border-left-color: ${props.primaryColor};
            }
          `
      )}
      style={{ "background-color": props.bgColor }}
      tabIndex="0"
      onMouseDown={onMouseDown}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Show when={props.post.deleted}>
        <Text>{t("posts.postWasDeleted")}</Text>
      </Show>
      <Show when={props.post.block}>
        <Text>This user has blocked you.</Text>
      </Show>
      <Show when={!props.post.deleted && !props.post.block}>
        <Show when={pinned()}>
          <Pinned />
        </Show>
        <Show when={props.reposted}>
          <Reposted
            post={props.post}
            showRepostsAsSelf={props.showRepostsAsSelf}
          />
        </Show>
        <Show when={replyingTo()}>
          <ReplyTo user={replyingTo()!.createdBy} />
        </Show>
        <div class={style.postInnerContainer}>
          <A
            onClick={(e) => e.stopPropagation()}
            href={RouterEndpoints.PROFILE(props.post.createdBy?.id)}
          >
            <Avatar
              resize={96}
              animate={hovered()}
              user={props.post.createdBy}
              size={40}
            />
          </A>
          <div class={style.postInnerInnerContainer}>
            <Details
              hovered={hovered()}
              showFullDate={props.showFullDate}
              post={props.post}
            />
            <Content post={props.post} hovered={hovered()} />

            <Actions
              onTogglePinned={() => setPinned(!pinned())}
              primaryColor={props.primaryColor}
              hideDelete={props.hideDelete}
              post={props.post}
              pinned={pinned()}
            />
          </div>
        </div>
      </Show>
    </div>
  );
}

const Details = (props: {
  showFullDate?: boolean;
  hovered: boolean;
  post: Post;
}) => (
  <div class={style.postDetailsContainer}>
    <CustomLink
      class={style.postUsernameStyle}
      style={{ color: "white" }}
      onClick={(e) => e.stopPropagation()}
      decoration
      href={RouterEndpoints.PROFILE(props.post.createdBy?.id)}
    >
      {props.post.createdBy?.username}
    </CustomLink>
    <Show when={props.post.createdBy.bot}>
      <div class={style.botTag}>Bot</div>
    </Show>
    <Text
      style={{ "flex-shrink": 0 }}
      title={formatTimestamp(props.post.createdAt)}
      size={12}
      color="rgba(255,255,255,0.5)"
    >
      {(props.showFullDate ? formatTimestamp : timeSince)(props.post.createdAt)}
    </Text>
  </div>
);

const Content = (props: { post: Post; hovered: boolean }) => {
  return (
    <div class={style.postContentContainer}>
      <Markup text={props.post.content || ""} post={props.post} />
      <Show when={props.post.editedAt}>
        <Icon
          name="edit"
          class={style.editIconStyles}
          size={14}
          title={`Edited at ${formatTimestamp(props.post.editedAt)}`}
        />
      </Show>
      <Embeds post={props.post} hovered={props.hovered} />
    </div>
  );
};

const Actions = (props: {
  primaryColor?: string;
  post: Post;
  hideDelete?: boolean;
  pinned?: boolean;
  onTogglePinned?: () => void;
}) => {
  const navigate = useNavigate();
  const { account } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const { createPortal } = useCustomPortal();
  const [, setSearchParams] = useSearchParams<{ postId: string }>();

  const onCommentClick = () => setSearchParams({ postId: props.post.id });

  const isLikedByMe = () => props.post?.likedBy?.length;
  const isRepostedByMe = () =>
    props.post?.reposts?.find((r) => r.createdBy.id === account.user()?.id);
  const likedIcon = () => (isLikedByMe() ? "favorite" : "favorite_border");

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
  };

  const onRepostClick = () => {
    if (isRepostedByMe()) {
      props.post.unRepostPost();
    } else {
      props.post.repostPost();
    }
  };

  const onDeleteClick = () =>
    createPortal?.((close) => (
      <DeletePostModal close={close} post={props.post} />
    ));

  const [pinRequestSent, setPinRequestSent] = createSignal(false);

  const togglePin = async () => {
    if (pinRequestSent()) return;
    setPinRequestSent(true);
    if (props.pinned) {
      await unpinPost(props.post.id).finally(() => setPinRequestSent(false));
    } else {
      await pinPost(props.post.id).finally(() => setPinRequestSent(false));
    }
    props.onTogglePinned?.();
  };

  const onEditClicked = () =>
    createPortal?.((close) => (
      <EditPostModal close={close} post={props.post} />
    ));

  const showViews = () => {
    return props.post.createdAt > timestampViewsEnabledAt;
  };

  const showDeleteAndEdit = () =>
    props.post.createdBy?.id === account.user()?.id && !props.hideDelete;

  const showContextMenu = (event: MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      const rect = event.target?.getBoundingClientRect()!;
      createPortal(
        (close) => (
          <ContextMenu
            items={[
              ...(showDeleteAndEdit()
                ? [
                    {
                      label: props.pinned ? "Unpin" : "Pin",
                      onClick: togglePin,
                      alert: props.pinned,
                      icon: "push_pin",
                    },
                    { label: "Edit", onClick: onEditClicked, icon: "edit" },
                    { separator: true },
                    {
                      label: "Delete",
                      onClick: onDeleteClick,
                      alert: true,
                      icon: "delete",
                    },
                  ]
                : []),
              ...(account.hasModeratorPerm()
                ? [
                    {
                      label: "Moderation Pane",
                      onClick: () =>
                        navigate(
                          "/app/moderation?search-post-id=" + props.post.id
                        ),
                      icon: "security",
                    },
                  ]
                : []),
              {
                label: "Copy Link",
                onClick: () => {
                  navigator.clipboard.writeText(
                    env.APP_URL + "/p/" + props.post.id
                  );
                },
                icon: "content_copy",
              },
              {
                label: "Copy ID",
                icon: "content_copy",
                onClick: () => {
                  navigator.clipboard.writeText(props.post.id);
                },
              },
            ]}
            position={rect}
            onClose={close}
            triggerClassName="post-more-button"
          />
        ),
        "post-context-menu",
        true
      );
    }
  };

  return (
    <div class={style.postActionsContainer}>
      <Button
        margin={0}
        onClick={onLikeClick}
        class={style.postButtonStyle}
        color="var(--alert-color)"
        primary={!!isLikedByMe()}
        iconClass={cn(style.icon, !isLikedByMe() && style.notLiked)}
        iconName={likedIcon()}
        label={props.post._count?.likedBy.toLocaleString()}
      />
      <Button
        margin={0}
        onClick={onCommentClick}
        class={style.postButtonStyle}
        color={props.primaryColor}
        iconClass={style.icon}
        iconName="comment"
        label={props.post._count?.comments.toLocaleString()}
      />
      <Button
        margin={0}
        onClick={onRepostClick}
        class={style.postButtonStyle}
        color="var(--success-color)"
        primary={!!isRepostedByMe()}
        iconClass={style.icon}
        iconName="repeat"
        label={props.post._count?.reposts.toLocaleString()}
      />
      <Show when={showViews()}>
        <Tooltip tooltip="Estimated Views">
          <Button
            margin={0}
            color="rgba(255,255,255,0.6)"
            class={cn(style.postButtonStyle, style.viewsStyle)}
            iconClass={style.icon}
            iconName="visibility"
            label={props.post.views.toLocaleString()}
          />
        </Tooltip>
      </Show>

      <div class={style.rightActions}>
        <Button
          onclick={showContextMenu}
          margin={0}
          class={cn(style.postButtonStyle, "post-more-button")}
          iconClass={style.icon}
          iconName="more_vert"
        />
      </div>
    </div>
  );
};

function Embeds(props: { post: Post; hovered: boolean }) {
  let element: HTMLDivElement | undefined;
  const { width } = useResizeObserver(
    () => element?.parentElement?.parentElement?.parentElement
  );

  const youtubeEmbed = () => props.post.embed?.origUrl?.match(youtubeLinkRegex);
  const inviteEmbedCode = () => props.post.content?.match(inviteLinkRegex)?.[1];
  return (
    <div ref={element} class={cn("embeds", style.embedContainer)}>
      <Show when={props.post.attachments?.[0]}>
        <ImageEmbed
          attachment={props.post.attachments?.[0]!}
          widthOffset={-50}
          customHeight={1120}
          customWidth={width()}
        />
      </Show>
      <Switch>
        <Match when={inviteEmbedCode()}>
          {(code) => <ServerInviteEmbed code={code()} />}
        </Match>

        <Match when={youtubeEmbed()}>
          {(youtubeEmbed) => (
            <YoutubeEmbed
              code={youtubeEmbed()[3]}
              embed={props.post.embed!}
              shorts={youtubeEmbed()[1].endsWith("shorts")}
              containerWidth={width()}
            />
          )}
        </Match>

        <Match when={props.post.embed}>
          <OGEmbed
            message={{ embed: props.post.embed!, content: props.post.content }}
            customWidthOffset={-50}
            customHeight={1120}
            customWidth={width()}
          />
        </Match>
      </Switch>

      <Show when={props.post.poll}>
        <PollEmbed poll={props.post.poll!} post={props.post} />
      </Show>
    </div>
  );
}

export const YoutubeEmbed = (props: {
  code: string;
  embed: RawEmbed;
  shorts: boolean;
  containerWidth: number;
}) => {
  const { height } = useWindowProperties();

  const widthOffset = -64;
  const customHeight = 0;
  const customWidth = 0;

  const style = () => {
    if (props.shorts) {
      const maxWidth = clamp(
        (customWidth || props.containerWidth) + (widthOffset || 0),
        600
      );
      const maxHeight =
        props.containerWidth <= 600
          ? (customHeight || height()) / 1.4
          : (customHeight || height()) / 2;
      return clampImageSize(1080, 1920, maxWidth, maxHeight);
    }

    const maxWidth = clamp(
      (customWidth || props.containerWidth) + (widthOffset || 0),
      600
    );

    return clampImageSize(1920, 1080, maxWidth, 999999);
  };

  return <RawYoutubeEmbed {...props} style={style()} />;
};

const PollEmbed = (props: { post: Post; poll: RawPostPoll }) => {
  const votedChoiceId = () => props.poll.votedUsers[0]?.pollChoiceId;

  const [selectedChoiceId, setSelectedChoiceId] = createSignal<string | null>(
    null
  );

  createEffect(() => {
    setSelectedChoiceId(votedChoiceId() || null);
  });

  const onVoteClick = async () => {
    await props.post.votePoll(selectedChoiceId()!);
  };

  return (
    <div class={cn("pollEmbedContainer", style.pollEmbedContainer)}>
      <div
        class={cn(
          style.pollChoicesContainer,
          votedChoiceId() && style.notAllowed
        )}
      >
        <For each={props.poll.choices}>
          {(choice) => (
            <PollChoice
              post={props.post}
              votedChoiceId={votedChoiceId()}
              poll={props.poll}
              choice={choice}
              selectedId={selectedChoiceId()}
              setSelected={setSelectedChoiceId}
            />
          )}
        </For>
      </div>

      <div class={style.footer}>
        <span class={style.votes}>
          <Text size={12}>{props.poll._count.votedUsers} </Text>
          <Text size={12} opacity={0.6}>
            votes
          </Text>
        </span>

        <Show when={selectedChoiceId() && !votedChoiceId()}>
          <Button
            onClick={onVoteClick}
            class={style.voteButton}
            primary
            label="Vote"
            iconName="done"
            padding={4}
            margin={0}
            iconSize={16}
          />
        </Show>
      </div>
    </div>
  );
};

const PollChoice = (props: {
  post: Post;
  votedChoiceId?: string;
  choice: RawPostChoice;
  poll: RawPostPoll;
  selectedId: string | null;
  setSelected: (id: string | null) => void;
}) => {
  const store = useStore();

  // (100 * vote) / totalVotes
  const votes = () =>
    Math.round(
      (100 * props.choice._count.votedUsers) / props.poll._count.votedUsers || 0
    );

  const showResults = () => {
    if (props.votedChoiceId) return true;
    if (store.account.user()?.id === props.post.createdBy.id) return true;

    return false;
  };

  return (
    <div
      class={cn(
        style.pollChoiceContainer,
        props.votedChoiceId === props.choice.id && "selected"
      )}
      onClick={() =>
        props.setSelected(
          props.choice.id === props.selectedId ? null : props.choice.id
        )
      }
    >
      <RadioBoxItem
        checkboxSize={8}
        class={cn(!props.votedChoiceId && style.radioBoxItem)}
        item={{ id: "0", label: props.choice.content }}
        labelSize={14}
        selected={props.selectedId === props.choice.id}
      />

      <Show when={showResults()}>
        <Text opacity={0.8} size={12} class={style.percentText}>
          {votes()}%
        </Text>
      </Show>
      <Show when={showResults()}>
        <div
          class={style.progressBarContainer}
          style={{ width: `${votes()}%` }}
        />
      </Show>
    </div>
  );
};

const ReplyTo = (props: { user: RawUser }) => {
  return (
    <div class={style.replyToContainer}>
      <Text size={14} style={{ "margin-right": "5px" }}>
        Replying to
      </Text>
      <CustomLink
        decoration
        style={{ "font-size": "14px", "line-height": "1" }}
        href={RouterEndpoints.PROFILE(props.user?.id!)}
      >
        {props.user?.username}
      </CustomLink>
    </div>
  );
};
const Pinned = () => {
  return (
    <div class={style.pinnedContainer}>
      <Icon name="push_pin" color="var(--primary-color)" size={16} />
      <Text size={14} style={{ "margin-right": "5px" }}>
        Pinned
      </Text>
    </div>
  );
};
const Reposted = (props: { post: Post; showRepostsAsSelf: boolean | any }) => {
  const repostUsers = createMemo(() =>
    props.post.reposts.map((r) => r.createdBy)
  );
  return (
    <div class={style.pinnedContainer}>
      <Icon name="repeat" color="var(--success-color)" size={16} />
      <Text size={14} style={{ "margin-right": "5px" }}>
        <Show when={props.showRepostsAsSelf}>Reposted</Show>
        <Show when={!props.showRepostsAsSelf}>
          Reposted by{" "}
          <For each={repostUsers()}>
            {(user, i) => (
              <>
                {i() ? ", " : null}
                <CustomLink
                  style={{ "line-height": "1" }}
                  decoration
                  href={RouterEndpoints.PROFILE(user?.id!)}
                >
                  {user?.username}
                </CustomLink>
              </>
            )}
          </For>
        </Show>
      </Text>
    </div>
  );
};
