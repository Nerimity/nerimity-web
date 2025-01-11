import { RawPost } from "@/chat-api/RawData";
import {
  createPost,
  getAnnouncementPosts,
  getPostNotificationCount,
  getPostNotificationDismiss,
  getPostNotifications,
  getPosts,
} from "@/chat-api/services/PostService";
import { Server } from "@/chat-api/store/useServers";
import useStore from "@/chat-api/store/useStore";
import { formatTimestamp } from "@/common/date";
import RouterEndpoints from "@/common/RouterEndpoints";
import { A, useNavigate, useSearchParams } from "solid-navigator";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  onMount,
  Show,
} from "solid-js";
import { css, styled } from "solid-styled-components";
import { Markup } from "./Markup";
import { PostNotificationsArea, PostsArea } from "./PostsArea";
import ContextMenuServer from "./servers/context-menu/ContextMenuServer";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { FlexColumn, FlexRow } from "./ui/Flexbox";
import Input from "./ui/input/Input";
import ItemContainer from "./ui/LegacyItem";
import Text from "./ui/Text";
import { Delay } from "@/common/Delay";
import { Presence } from "@/chat-api/store/useUsers";
import Icon from "./ui/icon/Icon";
import env from "@/common/env";
import { getActivityIconName } from "@/components/activity/Activity";
import { Skeleton } from "./ui/skeleton/Skeleton";
import { t } from "i18next";
import { MetaTitle } from "@/common/MetaTitle";
import { MentionUser } from "./markup/MentionUser";
import { useCustomScrollbar } from "./custom-scrollbar/CustomScrollbar";
import { Item } from "./ui/Item";
import { emojiToUrl } from "@/common/emojiToUrl";
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

const ServerListContainer = styled(FlexRow)`
  overflow: auto;
  padding-top: 5px;
  padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.06);
  padding-left: 6px;
  padding-right: 6px;
  border-radius: 8px;
  margin-left: 5px;
  margin-right: 5px;
  height: 50px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const SidebarItemContainer = styled(ItemContainer)`
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 50px;
`;

export default function DashboardPane() {
  const { header, account } = useStore();
  const { isVisible } = useCustomScrollbar();
  createEffect(() => {
    header.updateHeader({
      title: t("dashboard.title"),
      iconName: "dashboard",
    });
  });
  return (
    <DashboardPaneContainer
      style={isVisible() ? { "margin-right": "6px" } : {}}
    >
      <MetaTitle>Dashboard</MetaTitle>
      <DashboardPaneContent gap={10}>
        <Show when={account.user()}>
          <Announcements />
          <ActivityList />
          <ServerList />
          <PostsContainer />
        </Show>
      </DashboardPaneContent>
    </DashboardPaneContainer>
  );
}

const Announcements = () => {
  const [posts, setPosts] = createSignal<RawPost[]>([]);
  onMount(() => {
    getAnnouncementPosts()
      .then(setPosts)
      .catch(() => {});
  });
  return (
    <Show when={posts().length}>
      <FlexColumn gap={8}>
        <Text size={18} style={{ "margin-left": "5px" }}>
          Announcements
        </Text>
        <FlexColumn gap={4}>
          <For each={posts()}>{(post) => <PostItem post={post} />}</For>
        </FlexColumn>
      </FlexColumn>
    </Show>
  );
};

const PostItem = (props: { post: RawPost }) => {
  const [, setSearchParams] = useSearchParams<{ postId: string }>();

  return (
    <FlexColumn
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
          <Text>{formatTimestamp(props.post.createdAt)} by </Text>
          <div class="markup" style={{ "font-size": "14px" }}>
            <MentionUser user={props.post.createdBy} />
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

const TabStyle = css`
  padding-left: 8px;
  padding-right: 8px;
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
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

function ServerList() {
  const { servers } = useStore();
  const [contextPosition, setContextPosition] = createSignal<
    { x: number; y: number } | undefined
  >();
  const [contextServerId, setContextServerId] = createSignal<
    string | undefined
  >();

  const onContextMenu = (event: MouseEvent, serverId: string) => {
    event.preventDefault();
    setContextServerId(serverId);
    setContextPosition({ x: event.clientX, y: event.clientY });
  };

  let serverListEl: undefined | HTMLDivElement;
  const onWheel = (event: any) => {
    if (!serverListEl) return;
    event.preventDefault();

    serverListEl.scrollLeft -= event.wheelDelta;
  };

  return (
    <FlexColumn>
      <Text
        size={18}
        style={{
          "margin-left": "5px",
          "margin-bottom": "5px",
          "margin-top": "20px",
        }}
      >
        Servers
      </Text>
      <ServerListContainer ref={serverListEl} onwheel={onWheel}>
        <ContextMenuServer
          position={contextPosition()}
          onClose={() => setContextPosition(undefined)}
          serverId={contextServerId()}
        />
        <For each={servers.orderedArray()}>
          {(server) => (
            <ServerItem
              server={server!}
              onContextMenu={(e) => onContextMenu(e, server!.id)}
            />
          )}
        </For>
      </ServerListContainer>
    </FlexColumn>
  );
}

function ServerItem(props: {
  server: Server;
  onContextMenu?: (e: MouseEvent) => void;
}) {
  const { id, defaultChannelId } = props.server;
  const hasNotifications = () => props.server.hasNotifications();
  const [hovered, setHovered] = createSignal(false);

  return (
    <A
      onmouseover={() => setHovered(true)}
      onmouseout={() => setHovered(false)}
      href={RouterEndpoints.SERVER_MESSAGES(id, defaultChannelId)}
      onContextMenu={props.onContextMenu}
    >
      <SidebarItemContainer handlePosition="bottom" alert={hasNotifications()}>
        <NotificationCountBadge
          count={props.server.mentionCount()}
          top={5}
          right={2}
        />
        <Avatar animate={hovered()} server={props.server} size={35} />
      </SidebarItemContainer>
    </A>
  );
}

const NotificationCountBadgeContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-left: 5px;
  font-size: 0.8em;
  background-color: var(--alert-color);
  border-radius: 50%;
  height: 17px;
  width: 17px;
  z-index: 111111111;
`;

function NotificationCountBadge(props: {
  count: number;
  top: number;
  right: number;
}) {
  return (
    <Show when={props.count}>
      <NotificationCountBadgeContainer
        style={{
          top: `${props.top}px`,
          right: `${props.right}px`,
        }}
      >
        {props.count}
      </NotificationCountBadgeContainer>
    </Show>
  );
}

const ActivityListContainer = styled(FlexRow)`
  display: flex;
  gap: 8px;
  height: 80px;
  margin-left: 5px;
  margin-right: 5px;
  overflow: auto;

  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ActivityList = () => {
  const { account, users } = useStore();

  const store = useStore();
  let activityListEl: undefined | HTMLDivElement;

  const onWheel = (event: any) => {
    if (!activityListEl) return;
    event.preventDefault();

    activityListEl.scrollLeft -= event.wheelDelta;
  };

  const activities = () => {
    const presences = store.users.presencesArray();
    // sort by if activity img exists exists first
    return presences
      .filter((p) => {
        if (!p.activity) return false;
        const user = users.get(p.userId);
        if (user?.bot) return false;
        return true;
      })
      .sort((a, b) => b.activity!.startedAt - a.activity!.startedAt);
  };

  const authenticatedInPast = () => account.lastAuthenticatedAt();

  return (
    <>
      <Text size={18} style={{ "margin-left": "5px" }}>
        {t("dashboard.activeUsers")}
      </Text>

      <ActivityListContainer onwheel={onWheel} ref={activityListEl}>
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
    </>
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

  width: 240px;
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
  filter: blur(20px) brightness(0.6);
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

  return (
    <PresenceItemContainer
      onClick={() => navigate(RouterEndpoints.PROFILE(props.presence.userId))}
    >
      <Show when={imgSrc()}>
        <div
          class={presenceBackgroundImageStyles}
          style={{
            "background-image": `url(${imgSrc()})`,
          }}
        />
        <img
          src={imgSrc()}
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
