import { cn } from "@/common/classNames";
import style from "./PostItem.module.scss";
import { Post } from "@/chat-api/store/usePosts";
import useStore from "@/chat-api/store/useStore";
import { A, useNavigate, useSearchParams } from "solid-navigator";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
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
import { ImageEmbed } from "../ui/ImageEmbed";
import { RawPostChoice, RawPostPoll, RawUser } from "@/chat-api/RawData";
import { RadioBoxItem } from "../ui/RadioBox";
import { DeletePostModal, EditPostModal } from "../PostsArea";

const viewsEnabledAt = new Date();
viewsEnabledAt.setUTCFullYear(2024);
viewsEnabledAt.setUTCDate(5);
viewsEnabledAt.setUTCMonth(7);
viewsEnabledAt.setUTCHours(9);
viewsEnabledAt.setUTCMinutes(54);
const timestampViewsEnabledAt = viewsEnabledAt.getTime();

export function PostItem(props: {
  showFullDate?: boolean;
  disableClick?: boolean;
  hideDelete?: boolean;
  class?: string;
  onClick?: (id: Post) => void;
  post: Post;
}) {
  const { posts } = useStore();
  const [, setSearchParams] = useSearchParams<{ postId: string }>();
  const [hovered, setHovered] = createSignal(false);

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
    if (props.disableClick) return;
    if (props.post.deleted) return;
    if (event.target.closest(".button")) return;
    if (event.target.closest(".imageEmbedContainer")) return;
    if (event.target.closest(".pollEmbedContainer")) return;
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
        props.class,
        style.postContainer,
        props.disableClick && style.disableClick
      )}
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

            <Actions hideDelete={props.hideDelete} post={props.post} />
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
      <Markup text={props.post.content || ""} />
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

const Actions = (props: { post: Post; hideDelete?: boolean }) => {
  const navigate = useNavigate();
  const { account } = useStore();
  const [requestSent, setRequestSent] = createSignal(false);
  const { createPortal } = useCustomPortal();
  const [, setSearchParams] = useSearchParams<{ postId: string }>();

  const onCommentClick = () => setSearchParams({ postId: props.post.id });

  const isLikedByMe = () => props.post?.likedBy?.length;
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

  const onDeleteClick = () =>
    createPortal?.((close) => (
      <DeletePostModal close={close} post={props.post} />
    ));

  const onEditClicked = () =>
    createPortal?.((close) => (
      <EditPostModal close={close} post={props.post} />
    ));

  const showViews = () => {
    return props.post.createdAt > timestampViewsEnabledAt;
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
        iconClass={style.icon}
        iconName="comment"
        label={props.post._count?.comments.toLocaleString()}
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
        <Show when={account.hasModeratorPerm()}>
          <Button
            onClick={() =>
              navigate("/app/moderation?search-post-id=" + props.post.id)
            }
            margin={0}
            iconClass={style.icon}
            class={style.postButtonStyle}
            iconName="security"
          />
        </Show>
        <Show
          when={
            props.post.createdBy?.id === account.user()?.id && !props.hideDelete
          }
        >
          <Button
            onClick={onEditClicked}
            margin={0}
            class={style.postButtonStyle}
            iconClass={style.icon}
            iconName="edit"
          />
          <Button
            onClick={onDeleteClick}
            margin={0}
            class={style.postButtonStyle}
            color="var(--alert-color)"
            iconClass={style.icon}
            iconName="delete"
          />
        </Show>
      </div>
    </div>
  );
};

function Embeds(props: { post: Post; hovered: boolean }) {
  let element: HTMLDivElement | undefined;
  const { width } = useResizeObserver(
    () => element?.parentElement?.parentElement?.parentElement
  );

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

      <Show when={props.post.poll}>
        <PollEmbed poll={props.post.poll!} post={props.post} />
      </Show>
    </div>
  );
}

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
        style={{ "font-size": "14px" }}
        href={RouterEndpoints.PROFILE(props.user?.id!)}
      >
        {props.user?.username}
      </CustomLink>
    </div>
  );
};
