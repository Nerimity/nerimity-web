import { RawPost } from "@/chat-api/RawData";
import {
  getAnnouncementPosts,
  getPostNotificationCount,
  getPostNotificationDismiss,
} from "@/chat-api/services/PostService";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate, useSearchParams } from "solid-navigator";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { css, styled } from "solid-styled-components";
import { Markup } from "./Markup";
import { PostNotificationsArea, PostsArea } from "./PostsArea";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";

import Text from "./ui/Text";
import { Delay } from "@/common/Delay";
import { Presence } from "@/chat-api/store/useUsers";
import Icon from "./ui/icon/Icon";
import env from "@/common/env";
import { getActivityIconName } from "@/components/activity/Activity";
import { Skeleton } from "./ui/skeleton/Skeleton";
import { t } from "@nerimity/i18lite";
import { MetaTitle } from "@/common/MetaTitle";
import { MentionUser } from "./markup/MentionUser";
import { Item } from "./ui/Item";
import { emojiToUrl } from "@/common/emojiToUrl";
import { useLocalStorage } from "@/common/localStorage";
const DashboardPaneContainer = styled(FlexColumn)`
  justify-content: center;
  align-items: center;
`;

const DashboardPaneContent = styled(FlexColumn)`
  place-self: stretch;
  border-radius: 8px;
  flex: 1;
  margin: 30px;
  width: 100%;
  max-width: 700px;
  align-self: center;
`;

export default function DashboardPane() {
  const { header, account } = useStore();
  createEffect(() => {
    header.updateHeader({
      title: t("dashboard.title"),
      iconName: "dashboard",
    });
  });
  return (
    <DashboardPaneContainer>
      <MetaTitle>Dashboard</MetaTitle>
      <DashboardPaneContent gap={10}>
        <Show when={account.user()}>
          <Announcements />
          <ActivityList />
          <PostsContainer />
        </Show>
      </DashboardPaneContent>
    </DashboardPaneContainer>
  );
}

const [hiddenAnnouncementIds, setHiddenAnnouncementIds] = useLocalStorage<
  string[]
>("hiddenAnnouncementIds", []);

const Announcements = () => {
  const [posts, setPosts] = useLocalStorage<RawPost[]>(
    "announcementsCache",
    []
  );

  onMount(async () => {
    const posts = await getAnnouncementPosts().catch(() => undefined);
    if (!posts) return;

    hiddenAnnouncementIds().forEach((id) => {
      if (!posts.find((post) => post.id === id)) {
        setHiddenAnnouncementIds(
          hiddenAnnouncementIds().filter((id) => id !== id)
        );
      }
    });

    setPosts(posts);
  });
  return (
    <Show when={posts().length}>
      <FlexColumn
        gap={8}
        style={{ "margin-left": "6px", "margin-right": "6px" }}
      >
        <FlexColumn gap={4}>
          <For each={posts()}>
            {(post) => (
              <Show when={!hiddenAnnouncementIds().includes(post.id)}>
                <AnnouncementItem post={post} />
              </Show>
            )}
          </For>
        </FlexColumn>
      </FlexColumn>
    </Show>
  );
};

const AnnouncementItem = (props: { post: RawPost }) => {
  const [, setSearchParams] = useSearchParams<{ postId: string }>();

  return (
    <FlexColumn
      gap={6}
      onClick={() => {
        setSearchParams({ postId: props.post.id });
      }}
      class={css`
        background: rgba(255, 255, 255, 0.06);

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}
      style={{
        padding: "12px",
        "border-radius": "6px",
        cursor: "pointer",
      }}
    >
      <Show when={props.post.content}>
        <FlexRow itemsCenter gap={4}>
          <Text size={14} opacity={0.6}>
            {formatTimestamp(props.post.createdAt)} by{" "}
          </Text>
          <div class="markup" style={{ "font-size": "14px" }}>
            <MentionUser user={props.post.createdBy} />
          </div>
          <div style={{ "margin-left": "auto" }}>
            <Button
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setHiddenAnnouncementIds(
                  hiddenAnnouncementIds().concat([props.post.id])
                );
              }}
              iconName="close"
              alert
              padding={4}
              iconSize={14}
              margin={0}
            />
          </div>
        </FlexRow>
        <Markup
          text={props.post.content!}
          class={css`
            font-size: 14px;
            opacity: 0.8;
          `}
        />
      </Show>
    </FlexColumn>
  );
};

const NotificationCountContainer = styled(FlexRow)<{ selected: boolean }>`
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  border-radius: 50%;
  height: 18px;
  width: 18px;
  font-size: 12px;
  ${(props) =>
    props.selected
      ? `
    background: white;
    color: var(--primary-color);  
  `
      : ""}
`;

const PostTabItem = (props: {
  label: string;
  selected: boolean;
  onClick?: () => void;
  suffix?: JSXElement;
  icon?: JSXElement;
}) => {
  return (
    <Item.Root
      gap={4}
      onClick={props.onClick}
      handlePosition="bottom"
      selected={props.selected}
    >
      <Item.Icon>{props.icon}</Item.Icon>
      <Item.Label>{props.label}</Item.Label>
      {props.suffix}
    </Item.Root>
  );
};

function PostsContainer() {
  const [selectedTab, setSelectedTab] = createSignal<
    "FEED" | "DISCOVER" | "NOTIFICATIONS"
  >("FEED");

  const [notificationCount, setNotificationCount] = createSignal(0);
  onMount(async () => {
    const count = await getPostNotificationCount();
    setNotificationCount(count);
  });

  const NotificationIndicator = () => {
    return (
      <Show when={notificationCount()}>
        <NotificationCountContainer
          selected={selectedTab() === "NOTIFICATIONS"}
        >
          {notificationCount()}
        </NotificationCountContainer>
      </Show>
    );
  };

  createEffect(async () => {
    if (selectedTab() !== "NOTIFICATIONS") return;
    await getPostNotificationDismiss();
    setNotificationCount(0);
  });

  return (
    <FlexColumn
      class={css`
        background-color: rgba(255, 255, 255, 0.07);
        border-radius: 8px;
        margin-left: 6px;
        margin-right: 6px;
      `}
    >
      {/* <Text
        size={18}
        style={{
          "margin-left": "5px",
          "margin-bottom": "5px",
          "margin-top": "4px",
        }}
      >
        {t("dashboard.posts")}
      </Text> */}
      <FlexRow
        gap={5}
        style={{
          "margin-bottom": "5px",
          "margin-left": "5px",
          height: "28px",
          "margin-top": "6px",
        }}
      >
        <PostTabItem
          label={t("dashboard.feed")}
          selected={selectedTab() === "FEED"}
          onClick={() => setSelectedTab("FEED")}
          icon="home"
        />

        <PostTabItem
          label={t("dashboard.discover")}
          selected={selectedTab() === "DISCOVER"}
          icon="public"
          onClick={() => setSelectedTab("DISCOVER")}
        />
        <PostTabItem
          label={t("dashboard.notifications")}
          selected={selectedTab() === "NOTIFICATIONS"}
          onClick={() => setSelectedTab("NOTIFICATIONS")}
          icon="notifications"
          suffix={<NotificationIndicator />}
        />
      </FlexRow>
      <Delay>
        <>
          <Show when={selectedTab() === "FEED"}>
            <PostsArea
              showFeed
              style={{ "margin-left": "5px", "margin-right": "5px" }}
              showCreateNew
            />
          </Show>
          <Show when={selectedTab() === "DISCOVER"}>
            <PostsArea
              showDiscover
              style={{ "margin-left": "5px", "margin-right": "5px" }}
              showCreateNew
            />
          </Show>
          <Show when={selectedTab() === "NOTIFICATIONS"}>
            <PostNotificationsArea
              style={{ "margin-left": "5px", "margin-right": "5px" }}
            />
          </Show>
        </>
      </Delay>
    </FlexColumn>
  );
}

const ActivityListContainer = styled(FlexRow)`
  display: flex;
  gap: 8px;
  height: 80px;
  margin-left: 5px;
  margin-right: 5px;
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ActivityList = () => {
  const { account, users } = useStore();
  const store = useStore();
  let activityListEl: HTMLDivElement | undefined;

  let isDragging = false;
  let hasDragged = false;
  let startX = 0;
  let scrollLeftStart = 0;

  const onMouseDown = (e: MouseEvent) => {
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseup", stopDragging, { once: true });
    if (!activityListEl) return;

    isDragging = true;
    hasDragged = false;
    startX = e.pageX - activityListEl.offsetLeft;
    scrollLeftStart = activityListEl.scrollLeft;
    activityListEl.classList.add("dragging");
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !activityListEl) return;
    const x = e.pageX - activityListEl.offsetLeft;
    const walk = x - startX;

    if (!hasDragged && Math.abs(walk) > 4) {
      hasDragged = true;
    }

    activityListEl.scrollLeft = scrollLeftStart - walk;
  };

  const stopDragging = (e: MouseEvent) => {
    document.removeEventListener("mousemove", onMouseMove);
    e.preventDefault();
    e.stopPropagation();
    if (!activityListEl) return;
    isDragging = false;
    activityListEl.classList.remove("dragging");
  };

  const onClick = (e: MouseEvent) => {
    if (!hasDragged) return;
    e.preventDefault();
    e.stopPropagation();
    hasDragged = false;
  };

  const onWheel = (event: WheelEvent) => {
    if (!activityListEl) return;
    event.preventDefault();
    activityListEl.scrollLeft += event.deltaY;
  };

  const activities = () => {
    const presences = store.users.presencesArray();
    return presences
      .filter(
        (p) =>
          p.activity &&
          !users.get(p.userId)?.bot &&
          !store.friends.hasBeenBlockedByMe(p.userId)
      )
      .sort((a, b) => b.activity!.startedAt - a.activity!.startedAt);
  };

  const authenticatedInPast = () => account.lastAuthenticatedAt();

  onMount(() => {
    activityListEl?.addEventListener("click", onClick);

    onCleanup(() => {
      activityListEl?.removeEventListener("click", onClick);
    });
  });

  return (
    <ActivityListContainer
      ref={activityListEl}
      onwheel={onWheel}
      onmousedown={onMouseDown}
    >
      <Show when={!authenticatedInPast()}>
        <Skeleton.List count={5} style={{ "flex-direction": "row" }}>
          <Skeleton.Item height="80px" width="240px" />
        </Skeleton.List>
      </Show>

      <Show when={authenticatedInPast() && !activities().length}>
        <div
          style={{
            display: "flex",
            "text-align": "center",
            "flex-direction": "column",
            "align-items": "center",
            "justify-content": "center",
            background: "rgba(255,255,255,0.04)",
            width: "100%",
            height: "100%",
            "border-radius": "8px",
          }}
        >
          <Text size={14} opacity={0.6}>
            {t("dashboard.noActiveUsers")}
          </Text>
        </div>
      </Show>

      <Show when={authenticatedInPast() && activities().length}>
        <For each={activities()}>
          {(activity) => <PresenceItem presence={activity} />}
        </For>
      </Show>
    </ActivityListContainer>
  );
};

const PresenceItemContainer = styled(FlexRow)`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  display: flex;
  padding: 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 11;

  overflow: hidden;

  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const textOverflowHiddenStyles = css`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;
const activityImageStyles = css`
  aspect-ratio: 1/1;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;

  &.videoActivityImg {
    object-fit: contain;
    aspect-ratio: 16/9;
    flex-shrink: 0;
  }
`;

const activityDetailsStyles = css`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 10px;
  padding-right: 10px;
  margin-top: 4px;
  max-width: 180px;
  overflow: hidden;
  padding-top: 2px;
  padding-bottom: 2px;
`;

const presenceBackgroundImageStyles = css`
  position: absolute;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  filter: blur(50px) brightness(0.6);
  z-index: -1;
  inset: -20px;
`;

const PresenceItem = (props: { presence: Presence }) => {
  const navigate = useNavigate();
  const store = useStore();

  const activity = () => props.presence.activity!;

  const user = () => {
    return store.users.get(props.presence.userId);
  };

  const isEmoji = () => activity().emoji;

  const imgSrc = createMemo(() => {
    if (activity()?.emoji) {
      return emojiToUrl(activity()?.emoji!, false);
    }
    if (!activity()?.imgSrc) return;
    return `${env.NERIMITY_CDN}proxy/${encodeURIComponent(
      activity()?.imgSrc!
    )}/a`;
  });

  const isLiveStream = () =>
    !!activity()?.action.startsWith((t("activityNames.watching") || "Watching")) && !activity()?.endsAt;

  const isVideo = () =>
    !!activity()?.action.startsWith((t("activityNames.watching") || "Watching")) &&
    !!activity()?.startedAt &&
    !!activity()?.endsAt;

  return (
    <PresenceItemContainer
      onClick={() => navigate(RouterEndpoints.PROFILE(props.presence.userId))}
    >
      <Show when={imgSrc()}>
        <div
          class={presenceBackgroundImageStyles}
          style={{
            "background-image": `url(${imgSrc()})`,
            "pointer-events": "none",
          }}
        />
        <img
          src={imgSrc()}
          draggable={false}
          classList={{
            videoActivityImg: isLiveStream() || isVideo(),
          }}
          class={activityImageStyles}
          style={{
            "background-color": isEmoji() ? "transparent" : "black",
          }}
        />
      </Show>

      <div class={activityDetailsStyles}>
        <div
          class={css`
            display: flex;
            gap: 8px;
            align-items: center;
          `}
        >
          <Avatar user={user()} size={20} />
          <Text class={textOverflowHiddenStyles} size={14} bold>
            {user()?.username}
          </Text>
        </div>

        <span class={textOverflowHiddenStyles}>
          <Icon
            name={getActivityIconName(activity())}
            size={14}
            class={css`
              vertical-align: -2px;
            `}
            color="var(--primary-color)"
          />
          <Text size={14} opacity={0.7}>
            {" "}
            {props.presence.activity?.name}
          </Text>
        </span>

        <Show when={activity().title}>
          <Text size={12} opacity={0.7} class={textOverflowHiddenStyles}>
            {" "}
            {activity().title}
          </Text>
        </Show>
      </div>
    </PresenceItemContainer>
  );
};
