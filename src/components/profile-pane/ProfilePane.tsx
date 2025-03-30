import styles from "./styles.module.scss";
import { A, useNavigate, useParams } from "solid-navigator";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { FriendStatus, RawUser } from "@/chat-api/RawData";
import {
  blockUser,
  followUser,
  getFollowers,
  getFollowing,
  getUserDetailsRequest,
  unblockUser,
  unfollowUser,
  UserDetails,
} from "@/chat-api/services/UserService";
import useStore from "@/chat-api/store/useStore";
import { bannerUrl } from "@/chat-api/store/useUsers";
import {
  calculateTimeElapsedForActivityStatus,
  formatTimestamp,
  getDaysAgo,
} from "../../common/date";
import RouterEndpoints from "../../common/RouterEndpoints";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/icon/Icon";
import UserPresence from "@/components/user-presence/UserPresence";
import { css, styled } from "solid-styled-components";
import Text from "../ui/Text";
import { FlexColumn, FlexRow } from "../ui/Flexbox";
import { useWindowProperties } from "@/common/useWindowProperties";
import { addFriend } from "@/chat-api/services/FriendService";
import { useDrawer } from "../ui/drawer/Drawer";
import { PostsArea } from "../PostsArea";
import { CustomLink } from "../ui/CustomLink";
import { classNames, cn, conditionalClass } from "@/common/classNames";
import { Banner } from "../ui/Banner";
import { Markup } from "../Markup";
import { t } from "i18next";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import LegacyModal from "../ui/legacy-modal/LegacyModal";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { getLastSelectedChannelId } from "@/common/useLastSelectedServerChannel";
import ItemContainer from "../ui/LegacyItem";
import ContextMenu, {
  ContextMenuItem,
  ContextMenuProps,
} from "../ui/context-menu/ContextMenu";
import { copyToClipboard } from "@/common/clipboard";
import { Notice } from "../ui/Notice/Notice";
import env from "@/common/env";
import {
  RichProgressBar,
  getActivityIconName,
} from "@/components/activity/Activity";
import { CreateTicketModal } from "../CreateTicketModal";
import { MetaTitle } from "@/common/MetaTitle";
import average from "@/common/chromaJS";
import { useCustomScrollbar } from "../custom-scrollbar/CustomScrollbar";
import { emojiToUrl } from "@/common/emojiToUrl";

const ActionButtonsContainer = styled(FlexRow)`
  align-self: center;
  justify-content: center;
  margin-left: auto;
  flex-wrap: wrap;
`;

const ActionButtonContainer = styled(FlexRow)`
  align-items: center;
  border-radius: 8px;
  padding: 5px;
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ActionButton = (props: {
  icon?: string;
  label?: string;
  color?: string;
  class?: string;
  onClick?: (event: MouseEvent) => void;
}) => {
  return (
    <ActionButtonContainer class={props.class} gap={5} onclick={props.onClick}>
      <Icon color={props.color} size={18} name={props.icon} />
      <Show when={props.label}>
        <Text size={12} opacity={0.9}>
          {props.label}
        </Text>
      </Show>
    </ActionButtonContainer>
  );
};

export default function ProfilePane() {
  const params = useParams();
  const { users, friends, account, header } = useStore();
  const drawer = useDrawer();
  const { width, isMobileWidth, paneWidth } = useWindowProperties();
  const isMe = () => account.user()?.id === params.userId;
  const [userDetails, setUserDetails] = createSignal<UserDetails | null>(null);
  const [animateAvatar, setAnimateAvatar] = createSignal(false);
  const { isVisible, setThumbColor } = useCustomScrollbar();

  const { setPaneBackgroundColor } = useWindowProperties();
  createEffect(
    on(
      () => params.userId,
      async (userId) => {
        setUserDetails(null);
        drawer?.goToMain();
        fetchUserDetails(userId);
      }
    )
  );

  const fetchUserDetails = async (userId: string) => {
    setAnimateAvatar(false);
    const userDetails = await getUserDetailsRequest(userId, true);
    setUserDetails(userDetails);
    setTimeout(() => {
      setAnimateAvatar(true);
    }, 100);
  };

  const colors = () => {
    const bgColorOne = userDetails()?.profile?.bgColorOne;
    const bgColorTwo = userDetails()?.profile?.bgColorTwo;
    const primaryColor = userDetails()?.profile?.primaryColor;
    return { bg: [bgColorOne, bgColorTwo], primary: primaryColor };
  };
  const bgColor = createMemo(() => {
    try {
      return average([
        userDetails()?.profile?.bgColorOne! || "rgba(40, 40, 40, 0.86)",
        userDetails()?.profile?.bgColorTwo! || "rgba(40, 40, 40, 0.86)",
      ])
        .luminance(0.01)
        .alpha(0.9)
        .hex();
    } catch {
      return "rgba(40, 40, 40, 0.86)";
    }
  });

  const user = () => {
    if (userDetails()) return userDetails()?.user;
    if (isMe()) return account.user();
    const user = users.get(params.userId);
    if (user) return user;
  };

  onCleanup(() => {
    setPaneBackgroundColor(undefined);
  });

  createEffect(
    on(user, () => {
      setThumbColor(
        userDetails()?.profile?.primaryColor || "var(--primary-color)"
      );
      if (!colors().bg) {
        setPaneBackgroundColor(undefined);
      } else {
        setPaneBackgroundColor(`
          linear-gradient(
            180deg,
            ${colors()?.bg?.[0] || "rgba(40, 40, 40, 0.86)"},
            ${colors()?.bg?.[1] || "rgba(40, 40, 40, 0.86)"}
          )
        `);
      }

      if (!user()) return;
      header.updateHeader({
        subName: t("profile.title"),
        title: user()!.username,
        iconName: "person",
      });
    })
  );

  return (
    <>
      <MetaTitle>{!user() ? t("profile.title") : user()?.username}</MetaTitle>
      <Show when={user()}>
        <div
          class={cn(
            styles.profilePane,
            (paneWidth() || 0) < 1170 ? styles.mobile : false
          )}
          style={{
            "max-width": `${paneWidth()}px`,
            ...(isVisible()
              ? { "margin-right": "10px" }
              : { "margin-right": "4px" }),
          }}
        >
          <div class={styles.profilePaneInner}>
            <div class={classNames(styles.topArea)}>
              <Show when={user()?.banner || true} keyed={true}>
                <Banner
                  maxHeight={250}
                  animate
                  margin={0}
                  hexColor={user()?.hexColor}
                  url={bannerUrl(user()!)}
                  class={css`
                    z-index: 111;
                  `}
                />
              </Show>
              <FlexColumn class={styles.topAreaContent}>
                <FlexRow>
                  <Avatar
                    class={classNames(
                      styles.avatar,
                      css`
                        margin-top: -${width() <= 500 ? "50" : "52"}px;
                      `
                    )}
                    animate={animateAvatar()}
                    user={user()!}
                    size={width() <= 500 ? 92 : 110}
                  />
                  <Show when={!isMobileWidth()}>
                    <ActionButtons
                      class={css`
                        background-color: ${bgColor()};
                        border-radius: 10px;
                        padding: 4px;
                        margin-top: 4px;
                      `}
                      updateUserDetails={() => fetchUserDetails(params.userId)}
                      userDetails={userDetails()}
                      primaryColor={colors().primary}
                      user={user()}
                    />
                  </Show>
                </FlexRow>

                <div
                  class={styles.informationContainer}
                  style={{ background: bgColor() }}
                >
                  <div class={styles.details}>
                    <div class={styles.usernameTag}>
                      <span class={styles.username}>{user()!.username}</span>
                      <span class={styles.tag}>{`:${user()!.tag}`}</span>
                    </div>
                    <UserPresence
                      showFull
                      hideActivity
                      animate
                      userId={user()!.id}
                      showOffline={true}
                    />
                    <Show when={userDetails()}>
                      <Badges user={userDetails()!} />
                    </Show>
                    <div class={styles.followingAndFollowersContainer}>
                      <Show when={isMe() || !userDetails()?.hideFollowing}>
                        <CustomLink
                          href={RouterEndpoints.PROFILE(
                            user()!.id + "/following"
                          )}
                        >
                          {userDetails()?.user._count.following.toLocaleString()}{" "}
                          <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                            {t("profile.followingTab")}
                          </span>
                        </CustomLink>
                      </Show>
                      <Show when={isMe() || !userDetails()?.hideFollowers}>
                        <CustomLink
                          href={RouterEndpoints.PROFILE(
                            user()!.id + "/followers"
                          )}
                        >
                          {userDetails()?.user._count.followers.toLocaleString()}{" "}
                          <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                            {t("profile.followersTab")}
                          </span>
                        </CustomLink>
                      </Show>
                    </div>
                  </div>

                  <Show when={userDetails()?.profile?.bio}>
                    <BioContainer
                      primaryColor={colors()?.primary}
                      userDetails={userDetails()!}
                    />
                  </Show>
                </div>
              </FlexColumn>
            </div>
            <Show when={isMobileWidth()}>
              <div
                style={{
                  margin: "4px",
                  "margin-right": "0",
                  "margin-top": "0px",
                }}
              >
                <ActionButtons
                  class={css`
                    background-color: ${bgColor()};
                    border-radius: 8px;
                    padding: 4px;
                  `}
                  updateUserDetails={() => fetchUserDetails(params.userId)}
                  userDetails={userDetails()}
                  primaryColor={colors().primary}
                  user={user()}
                />
              </div>
            </Show>
            <Show when={userDetails()}>
              <Show when={(paneWidth() || 0) < 1170}>
                <SideBar mobilePane bgColor={bgColor()} user={userDetails()!} />
              </Show>
              <Content user={userDetails()!} bgColor={bgColor()} />
            </Show>
          </div>
          <Show when={(paneWidth() || 0) >= 1170}>
            <SideBar bgColor={bgColor()} user={userDetails()!} />
          </Show>
        </div>
      </Show>
    </>
  );
}

const ActionButtons = (props: {
  class?: string;
  updateUserDetails(): void;
  userDetails?: UserDetails | null;
  user?: RawUser | null;
  primaryColor?: string;
}) => {
  const params = useParams<{ userId: string }>();
  const { friends, users, account } = useStore();

  const [contextPosition, setContextPosition] = createSignal<{
    x: number;
    y: number;
  } | null>(null);

  const showProfileContext = (event: MouseEvent) => {
    setContextPosition({ x: event.clientX, y: event.clientY });
  };
  const isMe = () => account.user()?.id === params.userId;

  const friend = () => friends.get(params.userId);

  const isBlocked = () => friend()?.status === FriendStatus.BLOCKED;

  const friendExists = () => !!friend();
  const isPending = () =>
    friendExists() && friend().status === FriendStatus.PENDING;
  const isSent = () => friendExists() && friend().status === FriendStatus.SENT;
  const isFriend = () =>
    friendExists() && friend().status === FriendStatus.FRIENDS;

  const showAddFriend = () => !friendExists() && !isBlocked();

  const acceptClicked = () => {
    friend().accept();
  };

  const removeClicked = () => {
    friend().remove();
  };

  const addClicked = () => {
    if (!props.user) return;
    addFriend({
      username: props.user.username,
      tag: props.user.tag,
    }).catch((err) => {
      alert(err.message);
    });
  };

  const onMessageClicked = () => {
    users.openDM(params.userId);
  };

  const followClick = async () => {
    await followUser(params.userId);
    props.updateUserDetails();
  };

  const unfollowClick = async () => {
    await unfollowUser(params.userId);
    props.updateUserDetails();
  };

  const isFollowing = () => props.userDetails?.user.followers.length;

  const unblockClicked = async () => {
    await unblockUser(params.userId);
  };

  return (
    <ActionButtonsContainer class={props.class} gap={3}>
      <Show when={account.hasModeratorPerm()}>
        <CustomLink href={"/app/moderation/users/" + params.userId}>
          <ActionButton
            icon="security"
            label={t("profile.moderatorsOnly.title")}
            color={props.primaryColor || "var(--primary-color)"}
          />
        </CustomLink>
      </Show>

      {!isFollowing() && !isBlocked() && !isMe() && (
        <ActionButton
          icon="add_circle"
          label={t("profile.followButton")}
          onClick={followClick}
          color={props.primaryColor || "var(--primary-color)"}
        />
      )}
      {isFollowing() && (
        <ActionButton
          icon="add_circle"
          label={t("profile.unfollowButton")}
          onClick={unfollowClick}
          color="var(--alert-color)"
        />
      )}
      {isFriend() && (
        <ActionButton
          icon="person_add_disabled"
          label={t("profile.removeFriendButton")}
          color="var(--alert-color)"
          onClick={removeClicked}
        />
      )}
      {showAddFriend() && !isMe() && (
        <ActionButton
          icon="group_add"
          label={t("profile.addFriendButton")}
          color={props.primaryColor || "var(--primary-color)"}
          onClick={addClicked}
        />
      )}
      {isSent() && (
        <ActionButton
          icon="close"
          label={t("profile.pendingRequest")}
          color="var(--alert-color)"
          onClick={removeClicked}
        />
      )}
      {isPending() && (
        <ActionButton
          icon="done"
          label={t("profile.acceptRequestButton")}
          color="var(--success-color)"
          onClick={acceptClicked}
        />
      )}

      <Show when={isBlocked()}>
        <ActionButton
          icon="block"
          label={t("profile.unblock")}
          color="var(--alert-color)"
          onClick={unblockClicked}
        />
      </Show>

      <ActionButton
        icon={isMe() ? "note_alt" : "mail"}
        label={isMe() ? t("inbox.drawer.notes") : t("profile.messageButton")}
        color={props.primaryColor || "var(--primary-color)"}
        onClick={onMessageClicked}
      />
      <ActionButton
        icon="more_vert"
        color={props.primaryColor || "var(--primary-color)"}
        class="profile-context-button"
        onClick={showProfileContext}
      />
      <ProfileContextMenu
        position={contextPosition()}
        onClose={() => setContextPosition(null)}
        triggerClassName="profile-context-button"
      />
    </ActionButtonsContainer>
  );
};

function ProfileContextMenu(props: Omit<ContextMenuProps, "items">) {
  const params = useParams<{ userId: string }>();
  const { friends, users, account } = useStore();
  const { createPortal } = useCustomPortal();

  const friend = () => friends.get(params.userId);

  const isBlocked = () => friend()?.status === FriendStatus.BLOCKED;
  const isMe = () => account.user()?.id === params.userId;

  const items = () => {
    const items: ContextMenuItem[] = [
      {
        id: "message",
        label: isMe() ? t("inbox.drawer.notes") : t("profile.messageButton"),
        icon: isMe() ? "note_alt" : "mail",
        onClick: onMessageClicked,
      },
    ];

    if (isBlocked()) {
      items.push(
        { separator: true },
        {
          label: t("profile.unblock"),
          icon: "block",
          alert: true,
          onClick: unblockClicked,
        }
      );
    } else {
      if (!isMe()) {
        items.push({
          label: t("profile.block"),
          icon: "block",
          alert: true,
          onClick: blockClicked,
        });
      }
    }

    if (!isMe()) {
      items.push({
        id: "report",
        label: t("profile.report"),
        icon: "flag",
        alert: true,
        onClick: reportClicked,
      });
    }
    items.push(
      { separator: true },
      {
        label: t("profile.copyUrl"),
        icon: "content_copy",
        onClick: copyProfileClick,
      },
      { label: t("profile.copyId"), icon: "content_copy", onClick: copyIdClick }
    );
    return items;
  };

  const onMessageClicked = () => {
    users.openDM(params.userId);
  };

  const unblockClicked = async () => {
    await unblockUser(params.userId);
  };

  const blockClicked = async () => {
    await blockUser(params.userId);
  };

  const reportClicked = () => {
    return createPortal((close) => (
      <CreateTicketModal
        close={close}
        ticket={{ id: "ABUSE", userId: params.userId }}
      />
    ));
  };

  const copyIdClick = () => {
    copyToClipboard(params.userId);
  };
  const copyProfileClick = () => {
    console.log(`${env.APP_URL}/app/profile/${params.userId}`);
    copyToClipboard(`${env.APP_URL}/app/profile/${params.userId}`);
  };

  return <ContextMenu {...props} items={items()} />;
}

function Content(props: { user: UserDetails; bgColor: string }) {
  return (
    <div class={styles.content}>
      <PostsContainer user={props.user} bgColor={props.bgColor} />
    </div>
  );
}

function BioContainer(props: {
  primaryColor?: string;
  userDetails: UserDetails;
}) {
  return (
    <div class={styles.bioContainer}>
      <Text
        size={13}
        class={
          props.primaryColor
            ? css`
                a {
                  color: ${props.primaryColor};
                }
                .markup blockquote {
                  border-left-color: ${props.primaryColor};
                }
              `
            : ""
        }
      >
        <Markup text={props.userDetails?.profile?.bio!} />
      </Text>
    </div>
  );
}

function SideBar(props: {
  user: UserDetails;
  bgColor: string;
  mobilePane?: boolean;
}) {
  const [toggleJoinedDateType, setToggleJoinedDateType] = createSignal(false);
  const joinedAt = () => {
    if (!toggleJoinedDateType()) return getDaysAgo(props.user.user?.joinedAt!);
    return formatTimestamp(props.user.user.joinedAt!);
  };

  return (
    <div
      class={cn(props.mobilePane ? styles.mobilePane : false, styles.sidePane)}
    >
      <Show when={props.user?.suspensionExpiresAt !== undefined}>
        <SidePaneItem
          bgColor={props.bgColor}
          icon="block"
          label={t("profile.userSuspended")}
          color="var(--alert-color)"
          value={t("profile.expires") + `${
            !props.user.suspensionExpiresAt
              ? t("profile.never")
              : getDaysAgo(props.user.suspensionExpiresAt!)
          }`}
        />
      </Show>
      <Show when={props.user?.block}>
        <SidePaneItem
          bgColor={props.bgColor}
          icon="block"
          label={t("profile.youAreBlocked")}
          color="var(--alert-color)"
          value={t("profile.blockedDescription")}
        />
      </Show>
      <UserActivity
        bgColor={props.bgColor}
        color={props.user.profile?.primaryColor}
        userId={props.user?.user?.id}
      />
      <Show when={props.user}>
        <SidePaneItem
          bgColor={props.bgColor}
          icon="event"
          label={t("profile.joined")}
          color={props.user?.profile?.primaryColor}
          value={joinedAt()}
          onClick={() => setToggleJoinedDateType(!toggleJoinedDateType())}
        />
      </Show>
      <Show when={props.user?.user?.application?.creatorAccount}>
        <SidePaneItem
          bgColor={props.bgColor}
          icon="person"
          label={t("profile.botCreator")}
          color={props.user?.profile?.primaryColor}
        >
          <A
            href={RouterEndpoints.PROFILE(
              props.user.user?.application?.creatorAccount.user.id!
            )}
            class={cn(styles.item, styles.botCreatorItem)}
          >
            <Avatar
              user={props.user.user?.application?.creatorAccount.user!}
              size={20}
            />
            <div class={styles.name}>
              {props.user.user.application?.creatorAccount.user.username}
            </div>
          </A>
        </SidePaneItem>
      </Show>
      <Show when={props.user}>
        <MutualFriendList
          bgColor={props.bgColor}
          color={props.user?.profile?.primaryColor}
          mutualFriendIds={props.user?.mutualFriendIds}
        />
        <MutualServerList
          bgColor={props.bgColor}
          color={props.user.profile?.primaryColor}
          mutualServerIds={props.user?.mutualServerIds}
        />
      </Show>
    </div>
  );
}

const UserActivity = (props: {
  userId: string;
  color?: string;
  bgColor: string;
}) => {
  const { users } = useStore();
  const user = () => users.get(props.userId);
  const activity = () => user()?.presence()?.activity;
  const [playedFor, setPlayedFor] = createSignal("");

  const isMusic = () =>
    !!activity()?.action.startsWith(t("profile.float.listening")) &&
    !!activity()?.startedAt &&
    !!activity()?.endsAt;
  const isVideo = () =>
    !!activity()?.action.startsWith(t("profile.float.watching")) &&
    !!activity()?.startedAt &&
    !!activity()?.endsAt;

  const isLiveStream = () =>
    !!activity()?.action.startsWith(t("profile.float.watching")) && !activity()?.endsAt;

  const imgSrc = createMemo(() => {
    if (activity()?.emoji) {
      return emojiToUrl(activity()?.emoji!, false);
    }
    if (!activity()?.imgSrc) return;
    return `${env.NERIMITY_CDN}proxy/${encodeURIComponent(
      activity()?.imgSrc!
    )}/a`;
  });

  createEffect(
    on(activity, () => {
      if (!activity()) return;

      setPlayedFor(
        calculateTimeElapsedForActivityStatus(activity()?.startedAt!)
      );
      const intervalId = setInterval(() => {
        setPlayedFor(
          calculateTimeElapsedForActivityStatus(activity()?.startedAt!)
        );
      }, 1000);

      onCleanup(() => {
        clearInterval(intervalId);
      });
    })
  );

  return (
    <Show when={activity()}>
      <FlexColumn
        class={css`
          margin-bottom: 4px;
          border-radius: 8px;
          background: ${props.bgColor};
        `}
      >
        <FlexRow gap={4} style={{ flex: 1, padding: "8px" }}>
          <Icon
            class={css`
              margin-top: 2px;
            `}
            name={getActivityIconName(activity()!)}
            size={18}
            color={props.color || "var(--primary-color)"}
          />
          <span>
            <Text size={14}>{activity()?.action} </Text>
            <Text size={14} opacity={0.6}>
              {activity()?.name}
            </Text>
          </span>
        </FlexRow>

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
              class={styles.activityImg}
              classList={{
                [styles.videoActivityImg!]: isVideo() || isLiveStream(),
              }}
            />
            <div class={styles.richInfo}>
              <Text
                size={13}
                opacity={0.9}
                href={activity()?.link}
                isDangerousLink
                newTab
              >
                {activity()?.title || activity()?.name}
              </Text>

              <Text size={13} opacity={0.6}>
                {activity()?.subtitle}
              </Text>
              <Show when={!isMusic() && !isVideo()}>
                <Text class={styles.playedFor} size={13} opacity={0.6} title={formatTimestamp(activity()?.startedAt || 0)}>
                  {playedFor()}
                </Text>
              </Show>
              <Show when={isMusic() || isVideo()}>
                <RichProgressBar
                  updatedAt={activity()?.updatedAt}
                  speed={activity()?.speed}
                  primaryColor={props.color}
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
            style={{
              "margin-left": "8px",
              "margin-top": "-4px",
              "margin-bottom": "8px",
            }}
            title={formatTimestamp(activity()?.startedAt || 0)}
            size={14}
            opacity={0.6}
          >
            {t("profile.beenPlayingFor", { time: playedFor() })}
          </Text>
        </Show>
      </FlexColumn>
    </Show>
  );
};

function MutualFriendList(props: {
  mutualFriendIds: string[];
  bgColor: string;
  color?: string;
}) {
  const { users } = useStore();
  const { paneWidth } = useWindowProperties();

  const isMobileWidth = () => (paneWidth() || 0) < 1170;
  const [show, setShow] = createSignal(false);

  const mutualFriends = () => {
    return props.mutualFriendIds.map((userId) => {
      return users.get(userId);
    });
  };

  return (
    <div
      class={classNames(
        styles.block,
        conditionalClass(isMobileWidth(), styles.mobileBlock)
      )}
      style={{ "background-color": props.bgColor }}
    >
      <div class={styles.title} onClick={() => setShow(!show())}>
        <Icon
          name="group"
          size={18}
          class={styles.icon}
          color={props.color || "var(--primary-color)"}
        />
        <Text size={14} style={{ "margin-right": "auto" }}>
          {t("profile.mutualFriends", { count: props.mutualFriendIds.length })}
        </Text>
        <Show when={isMobileWidth()}>
          <Icon size={18} name="expand_more" />
        </Show>
      </div>
      <Show when={!isMobileWidth() || show()}>
        <div class={styles.list}>
          <For
            each={mutualFriends().sort((x, y) =>
              x.username.localeCompare(y.username)
            )}
          >
            {(user) => {
              return (
                <Show when={user}>
                  <A
                    href={RouterEndpoints.PROFILE(user.id)}
                    class={styles.item}
                  >
                    <Avatar user={user} size={20} />
                    <div class={styles.name}>{user.username}</div>
                  </A>
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
function MutualServerList(props: {
  mutualServerIds: string[];
  bgColor: string;
  color?: string;
}) {
  const { servers } = useStore();
  const { paneWidth } = useWindowProperties();

  const isMobileWidth = () => (paneWidth() || 0) < 1170;
  const [show, setShow] = createSignal(false);

  return (
    <div
      class={classNames(
        styles.block,
        conditionalClass(isMobileWidth(), styles.mobileBlock)
      )}
      style={{ "background-color": props.bgColor }}
    >
      <div class={styles.title} onClick={() => setShow(!show())}>
        <Icon
          name="dns"
          size={18}
          class={styles.icon}
          color={props.color || "var(--primary-color)"}
        />
        <Text size={14} style={{ "margin-right": "auto" }}>
          {t("profile.mutualServers", { count: props.mutualServerIds.length })}
        </Text>
        <Show when={isMobileWidth()}>
          <Icon size={18} name="expand_more" />
        </Show>
      </div>
      <Show when={!isMobileWidth() || show()}>
        <div class={styles.list}>
          <For each={props.mutualServerIds}>
            {(id: string) => {
              const server = () => servers.get(id);
              return (
                <Show when={server()}>
                  <A
                    href={RouterEndpoints.SERVER_MESSAGES(
                      server()!.id,
                      getLastSelectedChannelId(
                        server()!.id,
                        server()!.defaultChannelId
                      )
                    )}
                    class={styles.item}
                  >
                    <Avatar server={server()} size={20} />
                    <div class={styles.name}>{server()!.name}</div>
                  </A>
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

function SidePaneItem(props: {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  bgColor: string;
  onClick?: () => void;
  children?: JSXElement;
}) {
  return (
    <div
      class={cn(styles.SidePaneItem, props.onClick ? styles.clickable : "")}
      style={{ "background-color": props.bgColor }}
      onClick={props.onClick}
    >
      <FlexRow gap={4}>
        <Icon
          name={props.icon}
          size={18}
          color={props.color || "var(--primary-color)"}
        />
        <div class={styles.label}>{props.label}</div>
      </FlexRow>
      {props.children}
      <Show when={props.value}>
        <div class={styles.value}>{props.value}</div>
      </Show>
    </div>
  );
}

function PostsContainer(props: { user: UserDetails; bgColor: string }) {
  const { account } = useStore();
  const navigate = useNavigate();
  const params = useParams<{
    tab?: "replies" | "liked" | "following" | "followers";
  }>();

  const postCount = () => props.user.user._count.posts.toLocaleString();
  const likeCount = () => props.user.user._count.likedPosts.toLocaleString();

  const primaryColor = () => props.user.profile?.primaryColor;

  const currentPage = () => {
    switch (params.tab) {
      case "replies":
        return 1;
      case "liked":
        return 2;
      case "following":
        return 3;
      case "followers":
        return 4;
      default:
        return 0;
    }
  };

  const setCurrentPage = (page: number) => {
    switch (page) {
      case 1:
        navigate(RouterEndpoints.PROFILE(props.user.user.id) + "/replies");
        break;
      case 2:
        navigate(RouterEndpoints.PROFILE(props.user.user.id) + "/liked");
        break;
      case 3:
        navigate(RouterEndpoints.PROFILE(props.user.user.id) + "/following");
        break;
      case 4:
        navigate(RouterEndpoints.PROFILE(props.user.user.id) + "/followers");
        break;
      default:
        navigate(RouterEndpoints.PROFILE(props.user.user.id));
    }
  };

  const isMe = () => account.user()?.id === props.user.user.id;

  return (
    <div
      class={styles.postsContainer}
      style={{
        background: props.bgColor,
      }}
    >
      <FlexRow gap={5} style={{ "margin-bottom": "10px", "flex-wrap": "wrap" }}>
        <ItemContainer
          handlePosition="bottom"
          handleColor={primaryColor()}
          class={styles.postsTabButton}
          selected={currentPage() === 0}
          onClick={() => setCurrentPage(0)}
        >
          <Text
            size={14}
            color={currentPage() === 0 ? "white" : "rgba(255,255,255,0.6)"}
          >
            {t("profile.postsTab")}
          </Text>
        </ItemContainer>
        <ItemContainer
          handlePosition="bottom"
          handleColor={primaryColor()}
          class={styles.postsTabButton}
          selected={currentPage() === 1}
          onClick={() => setCurrentPage(1)}
        >
          <Text
            size={14}
            color={currentPage() === 1 ? "white" : "rgba(255,255,255,0.6)"}
          >
            {t("profile.postsAndRepliesTab", { count: postCount() })}
          </Text>
        </ItemContainer>
        <ItemContainer
          handlePosition="bottom"
          handleColor={primaryColor()}
          class={styles.postsTabButton}
          selected={currentPage() === 2}
          onClick={() => setCurrentPage(2)}
        >
          <Text
            size={14}
            color={currentPage() === 2 ? "white" : "rgba(255,255,255,0.6)"}
          >
            {t("profile.likedPostsTab", { count: likeCount() })}
          </Text>
        </ItemContainer>
        <Show when={isMe() || !props.user.hideFollowing}>
          <ItemContainer
            handlePosition="bottom"
            handleColor={primaryColor()}
            class={styles.postsTabButton}
            selected={currentPage() === 3}
            onClick={() => setCurrentPage(3)}
          >
            <Text
              size={14}
              color={currentPage() === 3 ? "white" : "rgba(255,255,255,0.6)"}
            >
              {t("profile.followingTab")}
            </Text>
          </ItemContainer>
        </Show>
        <Show when={isMe() || !props.user.hideFollowers}>
          <ItemContainer
            handlePosition="bottom"
            handleColor={primaryColor()}
            class={styles.postsTabButton}
            selected={currentPage() === 4}
            onClick={() => setCurrentPage(4)}
          >
            <Text
              size={14}
              color={currentPage() === 4 ? "white" : "rgba(255,255,255,0.6)"}
            >
              {t("profile.followersTab")}
            </Text>
          </ItemContainer>
        </Show>
      </FlexRow>
      <Show when={props.user && currentPage() <= 2}>
        <PostsArea
          pinnedPosts={currentPage() <= 1 ? props.user.pinnedPosts : []}
          primaryColor={primaryColor()}
          showLiked={currentPage() === 2}
          showReplies={currentPage() === 1}
          style={{ width: "100%" }}
          userId={props.user.user.id}
          showCreateNew={
            account.user()?.id === props.user.user.id && currentPage() === 0
          }
        />
      </Show>
      <Show when={props.user && currentPage() === 3}>
        <FollowingArea
          userId={props.user.user.id}
          usuallyHidden={isMe() && props.user.hideFollowing}
        />
      </Show>
      <Show when={props.user && currentPage() === 4}>
        <FollowersArea
          userId={props.user.user.id}
          usuallyHidden={isMe() && props.user.hideFollowers}
        />
      </Show>
    </div>
  );
}

function FollowersArea(props: { userId: string; usuallyHidden?: boolean }) {
  const [followers, setFollowers] = createSignal<RawUser[]>([]);
  onMount(() => {
    getFollowers(props.userId).then((newFollowers) =>
      setFollowers(newFollowers)
    );
  });

  return (
    <>
      <Show when={props.usuallyHidden}>
        <Notice
          type="info"
          description={t("profile.followersTabDescription")}
        />
      </Show>
      <UsersList users={followers()} />
    </>
  );
}
function FollowingArea(props: { userId: string; usuallyHidden?: boolean }) {
  const [following, setFollowing] = createSignal<RawUser[]>([]);
  onMount(() => {
    getFollowing(props.userId).then((newFollowing) =>
      setFollowing(newFollowing)
    );
  });

  return (
    <>
      <Show when={props.usuallyHidden}>
        <Notice
          type="info"
          description={t("profile.followingTabDescription")}
        />
      </Show>
      <UsersList users={following()} />
    </>
  );
}

const UserItemContainer = styled(FlexRow)`
  align-items: center;
  padding: 5px;
  border-radius: 8px;
  transition: 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

function UsersList(props: { users: RawUser[] }) {
  return (
    <FlexColumn>
      <For each={props.users}>
        {(user) => (
          <CustomLink href={RouterEndpoints.PROFILE(user.id)}>
            <UserItemContainer gap={5}>
              <Avatar user={user} size={20} />
              <Text>{user.username}</Text>
            </UserItemContainer>
          </CustomLink>
        )}
      </For>
    </FlexColumn>
  );
}

type Badge = typeof USER_BADGES.SUPPORTER;

const BadgeContainer = styled("button")<{ color: string; textColor?: string }>`
  background: ${(props) => props.color};
  border-radius: 4px;
  padding: 3px;
  color: ${(props) => props.textColor || "rgba(0, 0, 0, 0.7)"};
  font-weight: bold;
  font-size: 12px;
  border: none;
  cursor: pointer;
`;

function Badge(props: { badge: Badge; user: UserDetails }) {
  const { createPortal } = useCustomPortal();

  const onClick = () =>
    createPortal((close) => <BadgeDetailModal {...props} close={close} />);

  return (
    <BadgeContainer
      {...{ onClick }}
      textColor={props.badge.textColor}
      color={props.badge.color}
    >
      {props.badge.name}
    </BadgeContainer>
  );
}

const BadgesContainer = styled(FlexRow)`
  flex-wrap: wrap;
  margin-top: 5px;
`;

function Badges(props: { user: UserDetails }) {
  const allBadges = Object.values(USER_BADGES);

  const isBot = () => props.user.user.bot;

  const hasBadges = () =>
    allBadges.filter((badge) => hasBit(props.user.user.badges || 0, badge.bit));

  return (
    <Show when={hasBadges().length || isBot()}>
      <BadgesContainer gap={3}>
        <For each={hasBadges()}>
          {(badge) => <Badge {...{ badge }} {...props} />}
        </For>
        <Show when={isBot()}>
          <Badge badge={USER_BADGES.BOT} {...props} />
        </Show>
      </BadgesContainer>
    </Show>
  );
}

const BadgeDetailsModalContainer = styled(FlexColumn)`
  align-items: center;
  justify-content: center;
  min-height: 200px;
  min-width: 250px;
`;

function BadgeDetailModal(props: {
  badge: Badge;
  user: UserDetails;
  close(): void;
}) {
  const user = () => ({ ...props.user.user, badges: props.badge.bit });
  const [animate, setAnimate] = createSignal(false);

  onMount(() => {
    const id = window.setTimeout(() => {
      setAnimate(true);
    }, 100);
    onCleanup(() => {
      window.clearTimeout(id);
    });
  });

  return (
    <LegacyModal title={t("profile.badges.modalTitle", { name: props.badge.name })} close={props.close}>
      <BadgeDetailsModalContainer gap={30}>
        <FlexColumn itemsCenter gap={18}>
          <Avatar user={user()} size={80} animate={animate()} />
          <Text style={{ "max-width": "200px", "text-align": "center" }}>
            <Markup text={props.badge.description} />
          </Text>
        </FlexColumn>
        <FlexColumn itemsCenter gap={16}>
          <Text size={14} opacity={0.6}>
            {props.badge.credit}
          </Text>
        </FlexColumn>
      </BadgeDetailsModalContainer>
    </LegacyModal>
  );
}
