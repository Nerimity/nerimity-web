import style from "./DashboardPane.module.css";
import { RawPost } from "@/chat-api/RawData";
import {
  getAnnouncementPosts,
  getPostNotificationCount,
  getPostNotificationDismiss
} from "@/chat-api/services/PostService";
import useStore from "@/chat-api/store/useStore";
import RouterEndpoints from "@/common/RouterEndpoints";
import { useNavigate } from "solid-navigator";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  onCleanup,
  onMount,
  Show
} from "solid-js";
import { PostNotificationsArea, PostsArea } from "./PostsArea";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn } from "./ui/Flexbox";

import Text from "./ui/Text";
import { Delay } from "@/common/Delay";
import { Presence } from "@/chat-api/store/useUsers";
import Icon from "./ui/icon/Icon";
import env from "@/common/env";
import { getActivityIconName } from "@/components/activity/Activity";
import { Skeleton } from "./ui/skeleton/Skeleton";
import { t } from "@nerimity/i18lite";
import { MetaTitle } from "@/common/MetaTitle";
import { Item } from "./ui/Item";
import { emojiToUrl } from "@/common/emojiToUrl";
import { useLocalStorage } from "@/common/localStorage";
import { getActivityType } from "@/common/activityType";
import { PostItem } from "./post-area/PostItem";

export default function DashboardPane() {
  const { header, account } = useStore();
  createEffect(() => {
    header.updateHeader({
      title: t("dashboard.title"),
      iconName: "dashboard"
    });
  });
  return (
    <div class={style.dashboardPaneContainer}>
      <MetaTitle>Dashboard</MetaTitle>
      <div class={style.dashboardPaneContent}>
        <Show when={account.user()}>
          <Announcements />
          <ActivityList />
          <PostsContainer />
        </Show>
      </div>
    </div>
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
  const store = useStore();
  onMount(() => {
    store.posts.pushPost(props.post);
  });
  const post = () => store.posts.cachedPost(props.post.id);

  return (
    <Show when={post()}>
      <FlexColumn gap={6} class={style.announcementPostContainer}>
        <Button
          onclick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setHiddenAnnouncementIds(
              hiddenAnnouncementIds().concat([props.post.id])
            );
          }}
          iconName="close"
          class={style.closeButton}
          alert
          padding={4}
          iconSize={14}
          margin={0}
        />

        <PostItem post={post()!} class={style.announcementPostInner} />
      </FlexColumn>
    </Show>
  );
};

const PostTabItem = (props: {
  label: string;
  selected: boolean;
  onClick?: () => void;
  suffix?: JSXElement;
  icon?: string;
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
        <div class={style.postTabNotificationContainer}>
          {notificationCount()}
        </div>
      </Show>
    );
  };

  const dismissNotifications = async () => {
    await getPostNotificationDismiss();
    setNotificationCount(0);
  };

  createEffect(() => {
    if (selectedTab() !== "NOTIFICATIONS") return;
    dismissNotifications();
  });

  return (
    <FlexColumn class={style.postsContainer}>
      <div class={style.postTabsContainer}>
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
      </div>
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
    activityListEl.scrollLeft += event.deltaX;
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
    <div
      class={style.activityListContainer}
      ref={activityListEl}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
    >
      <Show when={!authenticatedInPast()}>
        <Skeleton.List count={5} style={{ "flex-direction": "row" }}>
          <Skeleton.Item height="80px" width="240px" />
        </Skeleton.List>
      </Show>

      <Show when={authenticatedInPast() && !activities().length}>
        <div class={style.noActivity}>
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
    </div>
  );
};

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

  const activityType = () => getActivityType(activity());

  const isLiveStream = () => !!activityType().isVideo && !activity()?.endsAt;

  const isVideo = () =>
    !!activityType().isVideo && !!activity()?.startedAt && !!activity()?.endsAt;

  return (
    <div
      class={style.presenceItemContainer}
      onClick={() => navigate(RouterEndpoints.PROFILE(props.presence.userId))}
    >
      <Show when={imgSrc()}>
        <div
          class={style.activityBackdrop}
          style={{
            "background-image": `url(${imgSrc()})`
          }}
        />
        <img
          src={imgSrc()}
          draggable={false}
          data-isWide={isLiveStream() || isVideo()}
          data-isEmoji={isEmoji()}
          class={style.activityImage}
          style={{}}
        />
      </Show>

      <div class={style.activityDetails}>
        <div class={style.userHeader}>
          <Avatar user={user()} size={20} />
          <Text class={style.ellipsis} size={14} bold>
            {user()?.username}
          </Text>
        </div>

        <span class={style.ellipsis}>
          <Icon
            name={getActivityIconName(activity())}
            size={14}
            class={style.activityIcon}
            color="var(--primary-color)"
          />
          <Text size={14} opacity={0.7}>
            {" "}
            {props.presence.activity?.name}
          </Text>
        </span>

        <Show when={activity().title}>
          <Text size={12} opacity={0.7} class={style.ellipsis}>
            {" "}
            {activity().title}
          </Text>
        </Show>
      </div>
    </div>
  );
};
