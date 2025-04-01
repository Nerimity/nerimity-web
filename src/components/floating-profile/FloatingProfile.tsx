import styles from "./FloatingProfile.module.scss";
import {
  For,
  JSX,
  Match,
  Setter,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import Icon from "../ui/icon/Icon";
import Text from "../ui/Text";
import {
  calculateTimeElapsedForActivityStatus,
  formatTimestamp,
  millisecondsToHhMmSs,
  timeElapsed,
} from "@/common/date";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import {
  UserDetails,
  getUserDetailsRequest,
} from "@/chat-api/services/UserService";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useResizeObserver } from "@/common/useResizeObserver";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Banner } from "../ui/Banner";
import { CustomLink } from "../ui/CustomLink";
import Avatar from "../ui/Avatar";
import UserPresence from "../user-presence/UserPresence";
import { Markup } from "../Markup";
import { bannerUrl } from "@/chat-api/store/useUsers";
import { ServerMemberRoleModal } from "../member-context-menu/MemberContextMenu";
import { electronWindowAPI } from "@/common/Electron";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import { useLocation } from "solid-navigator";
import env from "@/common/env";
import {
  RichProgressBar,
  getActivityIconName,
} from "@/components/activity/Activity";
import { ActivityStatus } from "@/chat-api/RawData";
import { css } from "solid-styled-components";
import { Emoji } from "../ui/Emoji";
import { t } from "i18next";
import { PostItem } from "../post-area/PostItem";
import { Skeleton } from "../ui/skeleton/Skeleton";
import average from "@/common/chromaJS";
import Button from "../ui/Button";
import { FlexRow } from "../ui/Flexbox";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import { emojiToUrl } from "@/common/emojiToUrl";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";

interface Props {
  dmPane?: boolean;
  position?: { left: number; top: number; anchor?: "left" | "right" };
  userId?: string;
  serverId?: string;
  close?: () => void;
  triggerEl?: HTMLElement;
  colors?: { bg?: [string | null, string | null]; primary?: string | null };
  bio?: string;
  channelNotice?: string;
}

export const ProfileFlyout = (props: Props) => {
  const { isMobileWidth } = useWindowProperties();
  const location = useLocation();

  const showMobileFlyout = () => {
    if (props.dmPane) return false;
    return isMobileWidth();
  };

  const memoShowMobileFlyout = createMemo(() => showMobileFlyout());

  const onPathChange = () => {
    return location.pathname + location.search + location.query;
  };

  createEffect(
    on(
      [memoShowMobileFlyout, onPathChange],
      () => {
        props.close?.();
      },
      { defer: true }
    )
  );

  return (
    <Switch>
      <Match when={!showMobileFlyout()}>
        <DesktopProfileFlyout
          channelNotice={props.channelNotice}
          bio={props.bio}
          colors={props.colors}
          triggerEl={props.triggerEl}
          close={props.close}
          anchor={props.position?.anchor}
          left={props.position?.left}
          top={props.position?.top}
          dmPane={props.dmPane}
          userId={props.userId}
          serverId={props.serverId}
        />
      </Match>
      <Match when={showMobileFlyout()}>
        <MobileFlyout
          bio={props.bio}
          channelNotice={props.channelNotice}
          colors={props.colors}
          close={props?.close}
          serverId={props.serverId}
          userId={props.userId}
        />
      </Match>
    </Switch>
  );
};

const DesktopProfileFlyout = (props: {
  channelNotice?: string;
  bio?: string;
  colors?: { bg?: [string | null, string | null]; primary?: string | null };
  triggerEl?: HTMLElement;
  style?: JSX.CSSProperties;
  dmPane?: boolean;
  mobile?: boolean;
  close?(): void;
  userId: string;
  serverId?: string;
  left?: number;
  top?: number;
  ref?: Setter<HTMLDivElement | undefined>;
  anchor?: "left" | "right";
}) => {
  const { createPortal } = useCustomPortal();
  const { users, account, serverMembers, posts } = useStore();
  const [details, setDetails] = createSignal<UserDetails | undefined>(
    undefined
  );
  const [hover, setHover] = createSignal(false);
  const { height } = useWindowProperties();
  const isMe = () => account.user()?.id === props.userId;
  const { isMobileWidth } = useWindowProperties();

  const isMobileWidthMemo = createMemo(() => isMobileWidth());
  createEffect(
    on(
      isMobileWidthMemo,
      (input, prevInput) => {
        props.close?.();
      },
      { defer: true }
    )
  );

  const user = () => {
    if (details()) return details()?.user;
    if (isMe()) return account.user();
    const user = users.get(props.userId);
    if (user) return user;
  };

  const colors = () => {
    if (props.colors) return props.colors;
    const bgColorOne = details()?.profile?.bgColorOne;
    const bgColorTwo = details()?.profile?.bgColorTwo;
    const primaryColor = details()?.profile?.primaryColor;
    return { bg: [bgColorOne, bgColorTwo], primary: primaryColor };
  };

  const bgColor = createMemo(() => {
    try {
      return average([
        colors().bg?.[0] || "rgba(40, 40, 40, 0.86)",
        colors().bg?.[1] || "rgba(40, 40, 40, 0.86)",
      ])
        .luminance(0.01)
        .alpha(0.9)
        .hex();
    } catch {
      return "rgba(40, 40, 40, 0.86)";
    }
  });

  const bio = () => {
    if (props.bio !== undefined) return props.bio;
    return details()?.profile?.bio;
  };

  const member = () =>
    props.serverId
      ? serverMembers.get(props.serverId, props.userId)
      : undefined;

  const accountMember = () =>
    props.serverId
      ? serverMembers.get(props.serverId, account.user()?.id!)
      : undefined;

  createEffect(
    on(
      () => props.userId,
      async () => {
        setDetails(undefined);
        const details = await getUserDetailsRequest(props.userId);
        setDetails(details);
        if (!details.latestPost) return;
        posts.pushPost(details.latestPost);
      }
    )
  );

  const latestPost = () => posts.cachedPost(details()?.latestPost?.id!);

  const followingCount = () =>
    details()?.user._count.following.toLocaleString();
  const followersCount = () =>
    details()?.user._count.followers.toLocaleString();

  const [flyoutRef, setFlyoutRef] = createSignal<HTMLDivElement | undefined>(
    undefined
  );
  const { height: flyoutHeight } = useResizeObserver(flyoutRef);

  createEffect(() => {
    if (!flyoutRef()) return;
    if (props.mobile) return;
    let newTop = props.top!;
    if (flyoutHeight() + props.top! > height())
      newTop =
        height() - flyoutHeight() - (electronWindowAPI()?.isElectron ? 35 : 0);
    flyoutRef()!.style.top = newTop + "px";
  });

  onMount(() => {
    document.addEventListener("mouseup", onBackgroundClick);
    onCleanup(() => {
      document.removeEventListener("mouseup", onBackgroundClick);
    });
  });

  const onBackgroundClick = (event: MouseEvent) => {
    if (props.mobile) return;
    if (event.target instanceof Element) {
      if (event.target.closest(".modal-bg")) return;
      if (event.target.closest(".modal")) return;
      if (event.target.closest(`.${styles.flyoutContainer}`)) return;
      if (props.triggerEl) {
        if (
          event.target.closest(".trigger-profile-flyout") ===
          props.triggerEl.closest(".trigger-profile-flyout")
        )
          return;
      }
      props.close?.();
    }
  };

  const left = () => {
    if (props.anchor == "left") return props.left + "px";
    return props.left! - 350 + "px";
  };

  const style = () =>
    ({
      left: left(),

      ...(props.dmPane
        ? {
            position: "relative",
            width: "initial",
            height: "initial",
            "z-index": 1,
          }
        : undefined),
    } as JSX.CSSProperties);

  const showRoleModal = () => {
    createPortal?.((close) => (
      <ServerMemberRoleModal
        close={close}
        userId={member()?.userId!}
        serverId={member()?.serverId!}
      />
    ));
  };
  const onMessageClicked = () => {
    users.openDM(props.userId);
    emitDrawerGoToMain();
  };

  const StickyArea = () => {
    return (
      <Show when={user()}>
        <Banner
          resize={900}
          maxHeight={200}
          margin={props.dmPane ? 6 : 0}
          animate={!props.dmPane ? true : hover()}
          hexColor={user()?.hexColor}
          url={bannerUrl(user()!)}
        />
        <div class={styles.flyoutDetailsContainer}>
          <CustomLink
            href={RouterEndpoints.PROFILE(props.userId)}
            class={css`
              align-self: flex-start;
            `}
          >
            <Avatar
              animate
              class={styles.flyoutAvatarStyles}
              user={user()!}
              size={82}
            />
          </CustomLink>

          <div
            class={styles.flyoutOtherDetailsContainer}
            style={{ background: bgColor() }}
          >
            <span>
              <CustomLink
                decoration
                style={{ color: "white", "line-height": "1" }}
                href={RouterEndpoints.PROFILE(props.userId)}
              >
                <Text style={{ "overflow-wrap": "anywhere" }}>
                  {user()!.username}
                </Text>
                <Text color="rgba(255,255,255,0.6)">:{user()!.tag}</Text>
              </CustomLink>
            </span>

            <UserPresence
              showFull
              hideActivity
              animate
              userId={props.userId}
              showOffline
            />
            <Show when={!details()}>
              <Skeleton.Item
                height="20px"
                style={{
                  "margin-top": "5px",
                  "border-radius": "4px",
                }}
              />
            </Show>
            <Show when={details()}>
              <Text size={12} opacity={0.6}>
                <Show when={isMe() || !details()?.hideFollowing}>
                  <CustomLink
                    href={RouterEndpoints.PROFILE(user()!.id + "/following")}
                  >
                    {followingCount()} Following
                  </CustomLink>
                </Show>
                <Show
                  when={
                    isMe() ||
                    (!details()?.hideFollowers && !details()?.hideFollowing)
                  }
                >
                  {" | "}
                </Show>
                <Show when={isMe() || !details()?.hideFollowers}>
                  <CustomLink
                    href={RouterEndpoints.PROFILE(user()!.id + "/followers")}
                  >
                    {followersCount()} Followers
                  </CustomLink>
                </Show>
              </Text>
              <div class={styles.buttonsContainer}>
                <Button
                  padding={4}
                  textSize={12}
                  iconSize={16}
                  href={RouterEndpoints.PROFILE(user()!.id)}
                  color={colors().primary}
                  class={styles.button}
                  label="Full Profile"
                  iconName="person"
                  margin={0}
                />
                <Button
                  padding={4}
                  textSize={12}
                  iconSize={16}
                  color={colors().primary}
                  class={styles.button}
                  label="Message"
                  onClick={onMessageClicked}
                  iconName="mail"
                  margin={0}
                />
              </div>
            </Show>
          </div>
        </div>
      </Show>
    );
  };
  const ProfileArea = () => (
    <>
      <Show when={member()}>
        <FlyoutTitle
          primaryColor={colors()?.primary || undefined}
          style={{ "margin-bottom": "5px" }}
          icon="leaderboard"
          title="Roles"
        />
        <div class={styles.rolesContainer}>
          <For each={member()?.roles(true)!}>
            {(role) => (
              <div class={styles.roleContainer}>
                <Show when={role?.icon}>
                  <Emoji size={16} resize={16} icon={role?.icon} hovered />
                </Show>
                <Text color={role?.hexColor} size={12}>
                  {role?.name}
                </Text>
              </div>
            )}
          </For>
          <Show
            when={accountMember()?.hasPermission(ROLE_PERMISSIONS.MANAGE_ROLES)}
          >
            <div
              class={classNames(styles.roleContainer, styles.selectable)}
              onClick={showRoleModal}
            >
              <Icon name="add" size={14} />
            </div>
          </Show>
        </div>
      </Show>

      <Show when={props.channelNotice}>
        <FlyoutTitle
          icon="info"
          title={t("informationDrawer.channelNotice")}
          primaryColor={colors()?.primary || undefined}
        />
        <div class={styles.bioContainer}>
          <Text
            size={12}
            color="rgba(255,255,255,0.7)"
            class={
              colors()?.primary
                ? css`
                    a {
                      color: ${colors()?.primary!};
                    }
                    .markup blockquote {
                      border-left-color: ${colors()?.primary!};
                    }
                  `
                : ""
            }
          >
            <Markup text={props.channelNotice!} />
          </Text>
        </div>
      </Show>

      <UserActivity
        userId={props.userId}
        primaryColor={colors()?.primary || undefined}
      />

      <Show when={!details()}>
        <Skeleton.Item height="50px" style={{ "margin-bottom": "6px" }} />
      </Show>
      <Show when={bio()?.length}>
        <FlyoutTitle
          icon="info"
          title="Bio"
          primaryColor={colors()?.primary || undefined}
        />
        <div class={styles.bioContainer}>
          <Text
            size={12}
            color="rgba(255,255,255,0.7)"
            class={
              colors()?.primary
                ? css`
                    a {
                      color: ${colors()?.primary};
                    }
                    .markup blockquote {
                      border-left-color: ${colors()?.primary!};
                    }
                  `
                : ""
            }
          >
            <Markup text={bio()!} />
          </Text>
        </div>
      </Show>
    </>
  );

  const PostArea = (props: { primaryColor?: string }) => (
    <>
      <FlyoutTitle
        style={{ "margin-bottom": "5px" }}
        icon="chat"
        title="Latest Post"
        primaryColor={props.primaryColor || undefined}
      />
      <PostItem
        primaryColor={props.primaryColor}
        class={styles.postItemContainer}
        post={latestPost()!}
      />
    </>
  );

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      ref={(el) => {
        setFlyoutRef(el);
        props.ref?.(el);
      }}
      class={classNames("modal", styles.flyoutContainer)}
      style={{ ...style(), ...props.style }}
    >
      <div
        class={styles.flyoutInnerContainer}
        style={{
          background: `linear-gradient(180deg, ${
            colors()?.bg?.[0] || "rgba(40, 40, 40, 0.86)"
          }, ${colors()?.bg?.[1] || "rgba(40, 40, 40, 0.86)"})`,
        }}
        classList={{
          [styles.dmPane]: props.dmPane,
        }}
      >
        <StickyArea />
        <div
          style={{ background: bgColor() }}
          class={classNames(
            styles.flyoutOuterScrollableContainer,
            conditionalClass(
              colors().primary,
              css`
                ::-webkit-scrollbar-thumb {
                  background-color: ${colors().primary!};
                }
              `
            )
          )}
        >
          <div class={styles.flyoutScrollableContainer}>
            <ProfileArea />
            <Show when={!details()}>
              <Skeleton.Item height="200px" />
            </Show>
            <Show when={latestPost()}>
              <PostArea primaryColor={colors()?.primary || undefined} />
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};

function MobileFlyout(props: {
  channelNotice?: string;
  bio?: string;
  colors?: { bg?: [string | null, string | null]; primary?: string | null };
  userId: string;
  serverId?: string;
  close?: () => void;
}) {
  let mouseDownTarget: HTMLDivElement | null = null;
  const [flyoutEl, setFlyoutEl] = createSignal<HTMLDivElement>();
  const { height: flyoutHeight } = useResizeObserver(
    () => flyoutEl()?.firstChild! as HTMLDivElement
  );
  const { height } = useWindowProperties();

  const onBackgroundClick = (event: MouseEvent) => {
    if (mouseDownTarget?.closest(".modal")) return;
    props.close?.();
  };

  const style = () => {
    const seventyPercentOfHeight = height() * 0.7;
    const top = height() - flyoutHeight();
    const res = flyoutHeight() > seventyPercentOfHeight ? "70%" : `${top}px`;
    return {
      "margin-top": res,
    } as JSX.CSSProperties;
  };
  return (
    <div
      class={cn(styles.backgroundContainer, styles.mobile)}
      onClick={onBackgroundClick}
      onMouseDown={(e) => (mouseDownTarget = e.target as any)}
    >
      <DesktopProfileFlyout
        ref={setFlyoutEl}
        channelNotice={props.channelNotice}
        bio={props.bio}
        style={style()}
        colors={props.colors}
        mobile
        close={props.close}
        serverId={props.serverId}
        userId={props.userId}
      />
    </div>
  );
}

function FlyoutTitle(props: {
  style?: JSX.CSSProperties;
  icon: string;
  title: string;
  primaryColor?: string;
}) {
  return (
    <div class={styles.flyoutTitle} style={props.style}>
      <Icon
        color={props.primaryColor || "var(--primary-color)"}
        name={props.icon}
        size={14}
      />
      <Text size={13}>{props.title}</Text>
    </div>
  );
}

export const UserActivity = (props: {
  primaryColor?: string;
  userId?: string;
  exampleActivity?: ActivityStatus;
}) => {
  const { users, account } = useStore();
  const user = () => users.get(props.userId! || account.user()?.id!);
  const activity = () => props.exampleActivity || user()?.presence()?.activity;
  const [playedFor, setPlayedFor] = createSignal("");

  const isMusic = () =>
    !!activity()?.action.startsWith("Listening") &&
    !!activity()?.startedAt &&
    !!activity()?.endsAt;
  const isVideo = () =>
    !!activity()?.action.startsWith("Watching") &&
    !!activity()?.startedAt &&
    !!activity()?.endsAt;

  const isLiveStream = () =>
    !!activity()?.action.startsWith("Watching") && !activity()?.endsAt;

  createEffect(
    on(activity, () => {
      if (!activity()) return;

      setPlayedFor(
        calculateTimeElapsedForActivityStatus(activity()?.startedAt!, isMusic())
      );
      const intervalId = setInterval(() => {
        setPlayedFor(
          calculateTimeElapsedForActivityStatus(
            activity()?.startedAt!,
            isMusic()
          )
        );
      }, 1000);

      onCleanup(() => {
        clearInterval(intervalId);
      });
    })
  );

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
    <Show when={activity()}>
      <div class={styles.userActivityContainer}>
        <Icon
          class={styles.icon}
          name={getActivityIconName(activity()!)}
          size={14}
          color={props.primaryColor || "var(--primary-color)"}
        />

        <div class={styles.activityInfo}>
          <div class={styles.activityInfoRow}>
            <Text size={13}>{activity()?.action}</Text>
            <Text size={13} opacity={0.6}>
              {activity()?.name}
            </Text>
          </div>
          <Show when={activity()?.imgSrc || activity()?.emoji}>
            <div class={styles.richPresence}>
              <Show when={imgSrc()}>
                <div
                  class={styles.backgroundImage}
                  style={{
                    "background-image": `url(${imgSrc()})`,
                  }}
                />
              </Show>
              <img
                src={imgSrc()}
                class={styles.activityImg + " activityImage"}
                classList={{
                  [styles.videoActivityImg!]: isVideo() || isLiveStream(),
                }}
              />
              <div class={styles.richInfo}>
                <Text
                  href={activity()?.link}
                  isDangerousLink
                  newTab
                  size={13}
                  opacity={0.9}
                >
                  {activity()?.title || activity()?.name}
                </Text>
                <Text size={13} opacity={0.6}>
                  {activity()?.subtitle}
                </Text>
                <Show when={!isMusic() && !isVideo()}>
                  <Text
                    class={styles.playedFor}
                    size={13}
                    opacity={0.6}
                    title={formatTimestamp(activity()?.startedAt || 0)}
                  >
                    {playedFor()}
                  </Text>
                </Show>
                <Show when={isMusic() || isVideo()}>
                  <RichProgressBar
                    updatedAt={activity()?.updatedAt}
                    primaryColor={props.primaryColor}
                    speed={activity()?.speed}
                    startedAt={activity()?.startedAt!}
                    endsAt={activity()?.endsAt!}
                  />
                </Show>
              </div>
            </div>
          </Show>
          <Show when={!activity()?.imgSrc && !activity()?.emoji}>
            <Text
              class={styles.playedFor}
              size={13}
              title={formatTimestamp(activity()?.startedAt || 0)}
            >
              For {playedFor()}
            </Text>
          </Show>
        </div>
      </div>
    </Show>
  );
};
