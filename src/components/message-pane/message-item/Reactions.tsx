import style from "./Reactions.module.css";
import { RawMessageReaction, RawUser } from "@/chat-api/RawData";
import {
  addMessageReaction,
  fetchMessageReactedUsers,
  removeMessageReaction
} from "@/chat-api/services/MessageService";
import { Message } from "@/chat-api/store/useMessages";
import { classNames, conditionalClass } from "@/common/classNames";
import env from "@/common/env";
import { useResizeObserver } from "@/common/useResizeObserver";
import { useWindowProperties } from "@/common/useWindowProperties";
import { Emoji } from "@/components/markup/Emoji";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useCustomPortal } from "@/components/ui/custom-portal/CustomPortal";
import { emojiUnicodeToShortcode, unicodeToTwemojiUrl } from "@/emoji";
import { useTransContext } from "@nerimity/solid-i18lite";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

interface ReactionItemProps {
  textAreaEl?: HTMLTextAreaElement;
  reaction: RawMessageReaction;
  message: Message;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event?: MouseEvent) => void;
}

function ReactionItem(props: ReactionItemProps) {
  const { hasFocus } = useWindowProperties();

  let isHovering = false;

  const onMouseEnter = (e: MouseEvent) => {
    isHovering = true;
    props.onMouseEnter?.(e);
  };

  const onMouseLeave = (e: MouseEvent) => {
    isHovering = false;
    props.onMouseLeave?.(e);
  };
  onCleanup(() => {
    if (isHovering) props.onMouseLeave?.();
  });

  const name = () =>
    props.reaction.emojiId
      ? props.reaction.name
      : emojiUnicodeToShortcode(props.reaction.name);

  const shouldBeStatic = () => {
    const isGif = props.reaction.gif;
    const isAnimatedWebp = props.reaction.webp;

    if (!isAnimatedWebp && !isGif) {
      return false;
    }

    return !hasFocus();
  };

  const url = () => {
    if (!props.reaction.emojiId)
      return unicodeToTwemojiUrl(props.reaction.name);

    const e = props.reaction;
    const ext = e.gif && !e.webp ? "gif" : "webp";
    const url = new URL(
      `${env.NERIMITY_CDN}emojis/${props.reaction.emojiId}.${ext}`
    );
    url.searchParams.set("size", "60");
    if (shouldBeStatic()) {
      url.searchParams.set("type", "webp");
    }
    return url.href;
  };

  const addReaction = () => {
    props.textAreaEl?.focus();
    if (props.reaction.reacted) {
      removeMessageReaction({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId
      });
      return;
    }
    addMessageReaction({
      channelId: props.message.channelId,
      messageId: props.message.id,
      name: props.reaction.name,
      emojiId: props.reaction.emojiId,
      gif: props.reaction.gif
    });
  };

  return (
    <Button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      margin={0}
      padding={[2, 8, 2, 2]}
      customChildrenLeft={
        <Emoji
          class={style.emoji}
          name={name()!}
          url={url()}
          custom={!!props.reaction.emojiId}
          resize={60}
        />
      }
      onClick={addReaction}
      class={classNames(
        style.reactionItem,
        conditionalClass(props.reaction.reacted, style.reacted)
      )}
      label={props.reaction.count.toLocaleString()}
      textSize={12}
      color={!props.reaction.reacted ? "white" : undefined}
    />
  );
}

function AddNewReactionButton(props: {
  show?: boolean;
  onClick?(event: MouseEvent): void;
}) {
  const { isMobileAgent } = useWindowProperties();
  const show = () => {
    if (isMobileAgent()) return true;
    if (props.show) return true;
  };
  return (
    <Button
      onClick={props.onClick}
      margin={0}
      padding={6}
      class={style.reactionItem}
      styles={{ visibility: show() ? "visible" : "hidden" }}
      iconName="add"
      iconSize={15}
    />
  );
}

export function MessageReactions(props: {
  hovered: boolean;
  textAreaEl?: HTMLTextAreaElement;
  message: Message;
  reactionPickerClick?(event: MouseEvent): void;
}) {
  const { createPortal, closePortalById } = useCustomPortal();

  const onHover = (event: MouseEvent, reaction: RawMessageReaction) => {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    createPortal(
      () => (
        <WhoReactedModal
          {...{
            x: rect.x + rect.width / 2,
            y: rect.y,
            reaction,
            message: props.message
          }}
        />
      ),
      "whoReactedModal"
    );
  };
  const onBlur = () => {
    closePortalById("whoReactedModal");
  };

  return (
    <div class={style.reactions}>
      <For each={props.message.reactions}>
        {(reaction) => (
          <ReactionItem
            onMouseEnter={(e) => onHover(e, reaction)}
            onMouseLeave={onBlur}
            textAreaEl={props.textAreaEl}
            message={props.message}
            reaction={reaction}
          />
        )}
      </For>
      <AddNewReactionButton
        show={props.hovered}
        onClick={props.reactionPickerClick}
      />
    </div>
  );
}

function WhoReactedModal(props: {
  x: number;
  y: number;
  reaction: RawMessageReaction;
  message: Message;
}) {
  const [users, setUsers] = createSignal<null | RawUser[]>(null);
  const [el, setEL] = createSignal<undefined | HTMLDivElement>(undefined);
  const { width, height } = useResizeObserver(el);
  const [t] = useTransContext();

  onMount(() => {
    const timeoutId = window.setTimeout(async () => {
      const newReactedUsers = await fetchMessageReactedUsers({
        channelId: props.message.channelId,
        messageId: props.message.id,
        name: props.reaction.name,
        emojiId: props.reaction.emojiId,
        limit: 5
      });
      setUsers(newReactedUsers.map((u) => u.user));
    }, 500);

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });

  const inlineStyle = () => {
    if (!height()) return { pointerEvents: "none" };
    return {
      top: props.y - height() - 5 + "px",
      left: props.x - width() / 2 + "px"
    };
  };

  const reactionCount = props.reaction.count;

  const plusCount = () => reactionCount - users()?.length!;

  return (
    <Show when={users()}>
      <div ref={setEL} class={style.whoReactedModal} style={inlineStyle()}>
        <For each={users()!}>
          {(user) => (
            <div class={style.whoReactedItem}>
              <Avatar size={15} user={user} />
              <div>{user.username}</div>
            </div>
          )}
        </For>
        <Show when={plusCount()}>
          {t("message.reactions.more", { count: plusCount() })}
        </Show>
      </div>
    </Show>
  );
}
