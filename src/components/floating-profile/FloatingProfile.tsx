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
import { formatTimestamp } from "@/common/date";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { UserDetails, updatePresence } from "@/chat-api/services/UserService";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useResizeObserver } from "@/common/useResizeObserver";
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
import { useLocation, useNavigate } from "solid-navigator";

import { css } from "solid-styled-components";
import { Emoji } from "../ui/Emoji";
import { t } from "@nerimity/i18lite";
import { PostItem } from "../post-area/PostItem";
import { Skeleton } from "../ui/skeleton/Skeleton";
import average from "@/common/chromaJS";
import Button from "../ui/Button";
import { FlexColumn } from "../ui/Flexbox";
import { emitDrawerGoToMain } from "@/common/GlobalEvents";
import { ROLE_PERMISSIONS } from "@/chat-api/Bitwise";
import { userStatusDetail, UserStatuses } from "@/common/userStatus";
import DropDown, { DropDownItem } from "../ui/drop-down/DropDown";
import { AdvancedMarkupOptions } from "../advanced-markup-options/AdvancedMarkupOptions";
import Input from "../ui/input/Input";
import { formatMessage } from "../message-pane/MessagePane";
import {  DefaultTheme, defaultThemeCSSVars } from "@/common/themes";
import { userDetailsPreloader } from "@/common/createPreloader";
import { UserActivity } from "../user-activity/UserActivity";
import { Fonts } from "@/common/fonts";
import { LogoutModal } from "../settings/LogoutModal";

interface Props {
  dmPane?: boolean;
  position?: {
    left: number;
    top: number;
    anchor?: "left" | "right";
    bottom?: number;
  };
  hideLatestPost?: boolean;
  userId?: string;
  serverId?: string;
  close?: () => void;
  triggerEl?: HTMLElement;
  colors?: { bg?: [string | null, string | null]; primary?: string | null };
  bio?: string;
  channelNotice?: string;
  showProfileSettings?: boolean;
  font?: number | null;
}

const ProfileFlyout = (props: Props) => {
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
          hideLatestPost={props.hideLatestPost}
          bottom={props.position?.bottom}
          dmPane={props.dmPane}
          userId={props.userId}
          font={props.font}
          serverId={props.serverId}
          showProfileSettings={props.showProfileSettings}
        />
      </Match>
      <Match when={showMobileFlyout()}>
        <MobileFlyout
          bio={props.bio}
          channelNotice={props.channelNotice}
          hideLatestPost={props.hideLatestPost}
          colors={props.colors}
          close={props?.close}
          serverId={props.serverId}
          userId={props.userId}
          font={props.font}
          showProfileSettings={props.showProfileSettings}
        />
      </Match>
    </Switch>
  );
};
export default ProfileFlyout;

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
  hideLatestPost?: boolean;
  left?: number;
  font?: number | null;
  bottom?: number;
  top?: number;
  ref?: Setter<HTMLDivElement | undefined>;
  anchor?: "left" | "right";
  showProfileSettings?: boolean;
}) => {
  const { createPortal, openedPortals } = useCustomPortal();
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
        colors().bg?.[0] || DefaultTheme["pane-color"],
        colors().bg?.[1] || DefaultTheme["pane-color"],
      ])
        .luminance(0.01)
        .alpha(0.9)
        .hex();
    } catch {
      return DefaultTheme["pane-color"];
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
        const details = await userDetailsPreloader.run(props.userId);
        if (details.user.bot) {
          details.hideFollowing = true;
        }
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

    if (props.bottom) {
      flyoutRef()!.style.bottom = props.bottom + "px";
      return;
    }
    let newTop = props.top!;
    if (flyoutHeight() + props.top! > height())
      newTop =
        height() - flyoutHeight() - (electronWindowAPI()?.isElectron ? 35 : 0);
    flyoutRef()!.style.top = newTop + "px";
  });

  onMount(() => {
    document.addEventListener("mouseup", onBackgroundClick);
    document.addEventListener("mousedown", onMouseDown);
    onCleanup(() => {
      document.removeEventListener("mouseup", onBackgroundClick);
      document.removeEventListener("mousedown", onMouseDown);
    });
  });

  let startClick = { x: 0, y: 0 };
  let textSelected = false;

  const onBackgroundClick = (event: MouseEvent) => {
    if (props.showProfileSettings) {
      if (openedPortals().length > 1) return;
    }

    if (props.mobile) return;
    if (event.target instanceof Element) {
      if (event.target.closest(".dropdown-popup")) return;
      if (event.target.closest(".emoji-picker")) return;
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

      const xDistance = Math.abs(startClick.x - event.clientX);
      const yDistance = Math.abs(startClick.y - event.clientY);

      const clickedPos = xDistance > 3 || yDistance > 3;
      if (clickedPos || textSelected) {
        return;
      }

      props.close?.();
    }
  };

  const onMouseDown = (event: MouseEvent) => {
    startClick = {
      x: event.clientX,
      y: event.clientY,
    };
    textSelected = !!window.getSelection()?.toString();
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

  const font = createMemo(
    () =>
      Fonts[
        props.font !== undefined
          ? props.font || 0
          : details()?.profile?.font || 0
      ]
  );

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
            <div class={styles.usernameDetails}>
              <CustomLink
                decoration
                style={{ color: "white", "line-height": "1" }}
                href={RouterEndpoints.PROFILE(props.userId)}
              >
                <Text
                  style={{
                    "overflow-wrap": "anywhere",
                    "--font": `'${font()?.name}'`,
                    "--lh": font()?.lineHeight,
                    "--scale": font()?.scale,
                    "--ls": font()?.letterSpacing,
                  }}
                  class={styles.username}
                >
                  {user()!.username}
                </Text>
                <Text color="rgba(255,255,255,0.6)">:{user()!.tag}</Text>
              </CustomLink>
              <Show when={details()?.followsYou}>
                <div class={styles.followsYou}>{t("profile.followsYou")}</div>
              </Show>
            </div>

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
                    {t("profile.followingCount", { count: followingCount() })}
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
                    {t("profile.followerCount", { count: followersCount() })}
                  </CustomLink>
                </Show>
              </Text>
              <Show when={!props.showProfileSettings}>
                <div class={styles.buttonsContainer}>
                  <Button
                    padding={4}
                    textSize={12}
                    iconSize={18}
                    href={RouterEndpoints.PROFILE(user()!.id)}
                    color={colors().primary}
                    class={styles.button}
                    label={t("profile.fullProfile")}
                    iconName="person"
                    margin={0}
                  />
                  <Button
                    padding={4}
                    textSize={12}
                    iconSize={16}
                    color={colors().primary}
                    class={styles.button}
                    label={
                      isMe()
                        ? t("inbox.drawer.notes")
                        : t("profile.messageButton")
                    }
                    onClick={onMessageClicked}
                    iconName={isMe() ? "note_alt" : "mail"}
                    margin={0}
                  />
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    );
  };

  const memberJoinedAt = () => {
    if (!member()) return undefined;
    return formatTimestamp(member()!.joinedAt || 0);
  };
  const userJoinedAt = () => {
    if (!user()?.joinedAt) return undefined;
    return formatTimestamp(user()?.joinedAt || 0);
  };

  const ProfileArea = () => {
    const memberRoles = member()?.roles(true) || [];

    return (
      <>
        <Show
          when={
            memberRoles.length > 0 ||
            accountMember()?.hasPermission(ROLE_PERMISSIONS.MANAGE_ROLES)
          }
        >
          <div class={styles.section}>
            <FlyoutTitle
              primaryColor={colors()?.primary || undefined}
              style={{ "margin-bottom": "5px" }}
              icon="leaderboard"
              title={t("servers.settings.drawer.roles")}
            />
            <div class={styles.rolesContainer}>
              <For each={member()?.roles(true)!}>
                {(role) => (
                  <div class={styles.roleContainer}>
                    <Show when={role?.icon}>
                      <Emoji size={16} resize={26} icon={role?.icon} hovered />
                    </Show>
                    <Text
                      class={styles.roleName}
                      style={{
                        "--gradient": role.gradient || role.hexColor,
                        "--color": role.hexColor || "#fff",
                      }}
                      size={12}
                    >
                      {role?.name}
                    </Text>
                  </div>
                )}
              </For>
            </div>
            <Show
              when={accountMember()?.hasPermission(
                ROLE_PERMISSIONS.MANAGE_ROLES
              )}
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
          <div class={styles.section}>
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
          </div>
        </Show>

        <UserActivity
          userId={props.userId}
          primaryColor={colors()?.primary || undefined}
        />

        <Show when={!details()}>
          <Skeleton.Item height="50px" style={{ "margin-bottom": "6px" }} />
        </Show>
        <Show when={details()}>
          <div class={styles.section}>
            <FlyoutTitle
              title={t("channelDrawer.members.sort.joined")}
              icon="calendar_month"
              primaryColor={colors()?.primary || undefined}
            />
            <Text
              class={styles.joinedText}
              size={12}
              color="rgba(255,255,255,0.7)"
            >
              <div class={styles.joinedContainer} title="Nerimity">
                <Avatar url="https://nerimity.com/assets/logo.png" size={16} />
                {userJoinedAt()}
              </div>
              <Show when={member()}>
                <div class={styles.joinedContainer} title="Server">
                  <Avatar
                    server={{ ...member()?.server()!, verified: false }}
                    size={16}
                  />
                  {memberJoinedAt()}
                </div>
              </Show>
            </Text>
          </div>
        </Show>
        <Show when={bio()?.length}>
          <div class={styles.section}>
            <FlyoutTitle
              icon="info"
              title={t("settings.account.bio")}
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
          </div>
        </Show>
      </>
    );
  };

  const PostArea = (props: { primaryColor?: string }) => (
    <div class={styles.section}>
      <FlyoutTitle
        style={{ "margin-bottom": "5px" }}
        icon="chat"
        title={t("profile.latestPost")}
        primaryColor={props.primaryColor || undefined}
      />
      <PostItem
        primaryColor={props.primaryColor}
        class={styles.postItemContainer}
        post={latestPost()!}
        showRepostsAsSelf
      />
    </div>
  );

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      ref={(el) => {
        setFlyoutRef(el);
        props.ref?.(el);
      }}
      class={classNames(
        "modal",
        styles.flyoutContainer,
        props.showProfileSettings ? styles.profileSettingsShown : ""
      )}
      style={{
        ...style(),
        ...props.style,
        ...defaultThemeCSSVars,
        "--floating-bg-color": bgColor(),
        "--floating-primary-color": colors()?.primary || "var(--primary-color)",
      }}
    >
      <div
        class={styles.flyoutInnerContainer}
        style={{
          background: `linear-gradient(180deg, ${
            colors()?.bg?.[0] || DefaultTheme["pane-color"]
          }, ${colors()?.bg?.[1] || DefaultTheme["pane-color"]})`,
        }}
        classList={{
          [styles.dmPane]: props.dmPane,
        }}
      >
        <StickyArea />
        <Show when={isMe() && props.showProfileSettings}>
          <SelfArea bg={bgColor()} />
        </Show>
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
            <Show when={!props.hideLatestPost && latestPost()}>
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
  hideLatestPost?: boolean;
  serverId?: string;
  showProfileSettings?: boolean;
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
        hideLatestPost={props.hideLatestPost}
        style={style()}
        colors={props.colors}
        mobile
        font={props.font}
        showProfileSettings={props.showProfileSettings}
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

function SelfArea(props: { bg: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const { createPortal } = useCustomPortal();

  const userId = () => store.account.user()?.id;
  const navigateToProfile = () => {
    navigate(RouterEndpoints.PROFILE(userId()!));
  };
  const navigateToEditProfile = () => {
    navigate("/app/settings/account");
  };

  const goToNotes = () => {
    store.users.openDM(userId()!);
    emitDrawerGoToMain();
  };

  const logoutClick = () => {
    createPortal((close) => <LogoutModal close={close} />);
  };

  return (
    <>
      <PresenceDropDown />
      <CustomStatus />
      <div class={styles.selfArea} style={{ background: props.bg }}>
        <SelfAreaButton
          onClick={navigateToProfile}
          label={t("settings.account.profile")}
          icon="person"
        />
        <SelfAreaButton
          label={t("inbox.drawer.notes")}
          icon="note_alt"
          onClick={goToNotes}
        />
        <SelfAreaButton
          label={t("profile.personal.editProfile")}
          icon="settings"
          onClick={navigateToEditProfile}
        />
        <SelfAreaButton
          label={t("header.logoutButton")}
          icon="logout"
          alert
          onClick={logoutClick}
        />
      </div>
    </>
  );
}

const SelfAreaButton = (props: {
  label: string;
  icon: string;
  onClick?: () => void;
  alert?: boolean;
}) => {
  const color = () =>
    props.alert ? "var(--alert-color)" : "var(--floating-primary-color)";
  return (
    <div class={styles.selfAreaButton} onClick={props.onClick}>
      <Icon name={props.icon} size={20} color={color()} />
      <div
        style={{
          color: color(),
        }}
      >
        {props.label}
      </div>
    </div>
  );
};

function PresenceDropDown() {
  const { account, users } = useStore();
  const user = () => users.get(account.user()?.id!);

  const presenceStatus = () =>
    userStatusDetail(user()?.presence()?.status || 0);

  const DropDownItems = UserStatuses.map((item, i) => {
    return {
      circleColor: item.color,
      id: item.id,
      label:
        item.name() === t("status.offline")
          ? t("status.appearAsOffline")
          : item.name(),
      index: i,
      onClick: (item) => {
        updatePresence({
          status: item.index,
        });
      },
    } satisfies DropDownItem;
  });
  // move invisible to the bottom.
  DropDownItems.push(DropDownItems.shift()!);

  return (
    <DropDown
      title={t("profile.personal.presence")}
      class={styles.presenceDropdown}
      items={DropDownItems}
      selectedId={presenceStatus().id}
    />
  );
}

function CustomStatus() {
  const { account, users } = useStore();
  const [customStatus, setCustomStatus] = createSignal("");
  const [inputRef, setInputRef] = createSignal<HTMLInputElement>();

  createEffect(
    on(
      () => account.user()?.customStatus,
      (custom) => {
        setCustomStatus(custom || "");
      }
    )
  );

  const save = (event: FocusEvent) => {
    console.log(event);
    const formattedStatus = formatMessage(customStatus().trim() || "");
    updatePresence({
      custom: customStatus().trim() ? formattedStatus : null,
    });
  };

  const changes = () => {
    return (customStatus() || "") !== (account.user()?.customStatus || "");
  };

  return (
    <div class={styles.customStatusContainer}>
      <Text opacity={0.8} size={14}>
        {t("profile.personal.customStatus")}
      </Text>
      <FlexColumn>
        <AdvancedMarkupOptions
          class="advancedMarkupOptions"
          inputElement={inputRef()!}
          updateText={setCustomStatus}
          zeroBottomBorderRadius
        />
        <Input
          type="textarea"
          height={30}
          ref={setInputRef}
          class={styles.customStatusInput}
          placeholder=""
          onText={setCustomStatus}
          value={customStatus()}
        />
        <Show when={changes()}>
          <Button
            label={t("general.saveButton")}
            onClick={save}
            iconName="save"
            iconSize={16}
            margin={[6, 0, 0, 0]}
          />
        </Show>
      </FlexColumn>
    </div>
  );
}
