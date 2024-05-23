import styles from "./FloatingProfile.module.scss";
import { For, JSX, Match, Show, Switch, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js";
import Icon from "../ui/icon/Icon";
import Text from "../ui/Text";
import { calculateTimeElapsedForActivityStatus, millisecondsToHhMmSs, timeElapsed } from "@/common/date";
import useStore from "@/chat-api/store/useStore";
import { useCustomPortal } from "../ui/custom-portal/CustomPortal";
import { UserDetails, getUserDetailsRequest } from "@/chat-api/services/UserService";
import { useWindowProperties } from "@/common/useWindowProperties";
import { useResizeObserver } from "@/common/useResizeObserver";
import Modal from "../ui/modal/Modal";
import RouterEndpoints from "@/common/RouterEndpoints";
import { Banner } from "../ui/Banner";
import { CustomLink } from "../ui/CustomLink";
import Avatar from "../ui/Avatar";
import UserPresence from "../user-presence/UserPresence";
import { Markup } from "../Markup";
import { PostItem } from "../PostsArea";
import { bannerUrl } from "@/chat-api/store/useUsers";
import { ServerMemberRoleModal } from "../member-context-menu/MemberContextMenu";
import { electronWindowAPI } from "@/common/Electron";
import { classNames, conditionalClass } from "@/common/classNames";
import { useLocation } from "solid-navigator";
import env from "@/common/env";
import { RichProgressBar, getActivityIconName } from "@/components/activity/Activity";
import { ActivityStatus } from "@/chat-api/RawData";
import { css } from "solid-styled-components";
import { Emoji } from "../ui/Emoji";



interface Props {
  dmPane?: boolean
  position?: {left: number, top: number; anchor?: "left" | "right"};
  userId?: string;
  serverId?: string;
  close?: () => void;
  triggerEl?: HTMLElement;
  colors?: {bg?: [string | null, string | null], primary?: string | null}
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

  createEffect(on([memoShowMobileFlyout, onPathChange],  () => {
    props.close?.();
  }, {defer: true}));

  return (
    <Switch>
      <Match when={!showMobileFlyout()}><DesktopProfileFlyout channelNotice={props.channelNotice} bio={props.bio} colors={props.colors} triggerEl={props.triggerEl} close={props.close} anchor={props.position?.anchor} left={props.position?.left} top={props.position?.top} dmPane={props.dmPane} userId={props.userId} serverId={props.serverId} /></Match>
      <Match when={showMobileFlyout()}>
        <MobileFlyout bio={props.bio} channelNotice={props.channelNotice} colors={props.colors} close={props?.close} serverId={props.serverId} userId={props.userId}  />
      </Match>
    </Switch>
  );

};


const DesktopProfileFlyout = (props: { channelNotice?: string, bio?: string; colors?: {bg?: [string | null, string | null], primary?: string | null}, triggerEl?: HTMLElement, dmPane?: boolean; mobile?: boolean; close?(): void, userId: string, serverId?: string, left?: number, top?: number; anchor?: "left" | "right" }) => {
  const { createPortal } = useCustomPortal();
  const { users, account, serverMembers, posts } = useStore();
  const [details, setDetails] = createSignal<UserDetails | undefined>(undefined);
  const [hover, setHover] = createSignal(false);
  const { height } = useWindowProperties();
  const isMe = () => account.user()?.id === props.userId;
  const { isMobileWidth } = useWindowProperties();
  
  const isMobileWidthMemo = createMemo(() => isMobileWidth());
  createEffect(on(isMobileWidthMemo, (input, prevInput) => {
    props.close?.();
  }, {defer: true}));


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
    return {bg: [bgColorOne, bgColorTwo], primary: primaryColor};
  };
  const bio = () => {
    if (props.bio !== undefined) return props.bio;
    return details()?.profile?.bio;
  };

  const member = () => props.serverId ? serverMembers.get(props.serverId, props.userId) : undefined;

  createEffect(on(() => props.userId, async() => {
    setDetails(undefined);
    const details = await getUserDetailsRequest(props.userId);
    setDetails(details);
    if (!details.latestPost) return;
    posts.pushPost(details.latestPost);
  }));

  const latestPost = () => posts.cachedPost(details()?.latestPost?.id!);


  const followingCount = () => details()?.user._count.following.toLocaleString();
  const followersCount = () => details()?.user._count.followers.toLocaleString();


  const [flyoutRef, setFlyoutRef] = createSignal<HTMLDivElement | undefined>(undefined);
  const { height: flyoutHeight} = useResizeObserver(flyoutRef);


  createEffect(() => {
    if (!flyoutRef()) return;
    if (props.mobile) return;
    let newTop = props.top!;
    if ((flyoutHeight() + props.top!) > height()) newTop = height() - flyoutHeight() - (electronWindowAPI()?.isElectron ? 35 : 0);
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
        if (event.target.closest(".trigger-profile-flyout") === props.triggerEl.closest(".trigger-profile-flyout")) return;
      }
      props.close?.();
    }
  };

  const left = () => {
    if (props.anchor == "left") return props.left + "px";
    return (props.left! - 350) + "px";

  };


  const style = () => ({
    left: left(),
    ...(props.mobile ? {
      top: "initial",
      bottom: "0",
      left: "0",
      right: "0",
      width: "initial",
      "align-items": "initial",
      "max-height": "70%",
      height: "initial"
    } : undefined),
    ...(props.dmPane ? {
      position: "relative",
      width: "initial",
      height: "initial",
      "z-index": 1
    } : undefined)
  }) as JSX.CSSProperties;

  const showRoleModal = () => {
    createPortal?.(close =>  <ServerMemberRoleModal close={close} userId={member()?.userId!} serverId={member()?.serverId!} />);
  };


  const StickyArea = () => {
    return (<>
      <Banner maxHeight={200} margin={props.dmPane ? 6 : 0} animate={!props.dmPane ? true : hover()} hexColor={user()?.hexColor} url={bannerUrl(user()!)} />
      <div class={styles.flyoutDetailsContainer}>
        <CustomLink href={RouterEndpoints.PROFILE(props.userId)} class={css`align-self: flex-start;`}>
          <Avatar animate class={styles.flyoutAvatarStyles} user={user()!} size={72} />
        </CustomLink>
        <div class={styles.flyoutOtherDetailsContainer}>
          <span>
            <CustomLink decoration style={{ color: "white" }} href={RouterEndpoints.PROFILE(props.userId)}>
              <Text style={{ "overflow-wrap": "anywhere" }}>{user()!.username}</Text>
              <Text color='rgba(255,255,255,0.6)'>:{user()!.tag}</Text>
            </CustomLink>
          </span>
          <UserPresence hideActivity animate userId={props.userId} showOffline />
          <Text size={12} opacity={0.6}><CustomLink href={RouterEndpoints.PROFILE(user()!.id + "/following")}>{followingCount()} Following</CustomLink> | <CustomLink href={RouterEndpoints.PROFILE(user()!.id + "/followers")}>{followersCount()} Followers</CustomLink></Text>
        </div>
      </div>

    </>);
  };
  const ProfileArea = () => (
    <>

      <Show when={member()}>
        <FlyoutTitle primaryColor={colors()?.primary || undefined} style={{ "margin-bottom": "5px" }} icon='leaderboard' title='Roles' />
        <div class={styles.rolesContainer}>
          <For each={member()?.roles(true)!}>
            {role => (<div class={styles.roleContainer}>
              <Show when={role?.icon}><Emoji size={16} resize={16} icon={role?.icon} hovered /></Show>
              <Text color={role?.hexColor} size={12}>{role?.name}</Text>
            </div>)}
          </For>
          <div class={classNames(styles.roleContainer, styles.selectable)}  onClick={showRoleModal}><Icon name='add' size={14} /></div>
        </div>
      </Show>

      <Show when={props.channelNotice}>
        <FlyoutTitle icon='info' title='Channel Notice' primaryColor={colors()?.primary || undefined} />
        <div class={styles.bioContainer}>
          <Text size={12} color='rgba(255,255,255,0.7)' class={colors()?.primary ? css`a {color: ${colors()?.primary}; }`: ""}><Markup text={props.channelNotice!} /></Text>
        </div>
      </Show>

      <UserActivity userId={props.userId} primaryColor={colors()?.primary || undefined} />


      <Show when={details()?.profile?.bio}>
        <FlyoutTitle icon='info' title='Bio' primaryColor={colors()?.primary || undefined} />
        <div class={styles.bioContainer}>
          <Text size={12} color='rgba(255,255,255,0.7)' class={colors()?.primary ? css`a {color: ${colors()?.primary}; }`: ""}><Markup text={bio()!} /></Text>
        </div>
      </Show>


    </>
  );

  const PostArea = (props: { primaryColor?: string }) => (
    <>
      <FlyoutTitle style={{ "margin-bottom": "5px" }} icon='chat' title='Latest Post' primaryColor={props.primaryColor || undefined} />
      <PostItem class={styles.postItemContainer} post={latestPost()!} />
    </>
  );

  return (
    <Show when={details()}>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={(() => setHover(false))} ref={setFlyoutRef} class={classNames("modal", styles.flyoutContainer)} style={style()}>
        <div 
          class={styles.flyoutInnerContainer} 
          style={{
            background: `linear-gradient(180deg, ${colors()?.bg?.[0] || "rgba(40, 40, 40, 0.86)"}, ${colors()?.bg?.[1] || "rgba(40, 40, 40, 0.86)"})`
          }}
          classList={{
            [styles.dmPane]: props.dmPane,
            [styles.mobile]: props.mobile
          }} 

        >
          <StickyArea/>
          <div class={classNames(styles.flyoutOuterScrollableContainer, conditionalClass(colors().primary, css`::-webkit-scrollbar-thumb{background-color: ${colors().primary!};}`))} >
            <div class={styles.flyoutScrollableContainer}>
              <ProfileArea />
              <Show when={latestPost()}>
                <PostArea primaryColor={colors()?.primary || undefined} />
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};



function MobileFlyout(props: { channelNotice?: string, bio?: string; colors?: {bg?: [string | null, string | null], primary?: string | null}, userId: string, serverId?: string, close?: () => void }) {
  let mouseDownTarget: HTMLDivElement | null = null;

  const onBackgroundClick = (event: MouseEvent) => {
    if (mouseDownTarget?.closest(".modal")) return;
    props.close?.();
  };


  return (
    <div class={styles.backgroundContainer} onClick={onBackgroundClick} onMouseDown={e => mouseDownTarget = e.target as any}>
      <DesktopProfileFlyout channelNotice={props.channelNotice} bio={props.bio} colors={props.colors} mobile close={props.close} serverId={props.serverId} userId={props.userId} />
    </div>
  );
}






function FlyoutTitle(props: { style?: JSX.CSSProperties, icon: string, title: string, primaryColor?: string }) {
  return (
    <div class={styles.flyoutTitle} style={props.style}>
      <Icon color={props.primaryColor || "var(--primary-color)"} name={props.icon} size={14} />
      <Text size={13}>{props.title}</Text>
    </div>
  );
}



export const UserActivity = (props: {primaryColor?: string; userId?: string, exampleActivity?: ActivityStatus}) => {
  const {users, account} = useStore();
  const user = () => users.get(props.userId! || account.user()?.id!);
  const activity = () => props.exampleActivity || user()?.presence()?.activity;
  const [playedFor, setPlayedFor] = createSignal("");


  const isMusic = () =>  !!activity()?.action.startsWith("Listening") && !!activity()?.startedAt && !!activity()?.endsAt;
  const isVideo = () =>  !!activity()?.action.startsWith("Watching") && !!activity()?.startedAt && !!activity()?.endsAt;

  createEffect(on(activity, () => {
    if (!activity()) return;




    setPlayedFor(calculateTimeElapsedForActivityStatus(activity()?.startedAt!, isMusic()));
    const intervalId = setInterval(() => {
      setPlayedFor(calculateTimeElapsedForActivityStatus(activity()?.startedAt!, isMusic()));
    }, 1000);

    onCleanup(() => {
      clearInterval(intervalId);
      
    });
  }));



  const imgSrc = () => {
    if (!activity()?.imgSrc) return;
    return `${env.NERIMITY_CDN}proxy/${encodeURIComponent(activity()?.imgSrc!)}/a`;

  };

  return (
    <Show when={activity()}>
      <div class={styles.userActivityContainer}>
        <Icon class={styles.icon} name={getActivityIconName(activity()!)} size={14} color={props.primaryColor || "var(--primary-color)"} />

        <div class={styles.activityInfo}>
          <div class={styles.activityInfoRow}>
            <Text size={13}>{activity()?.action}</Text>
            <Text size={13} opacity={0.6}>{activity()?.name}</Text>
          </div>
          <Show when={activity()?.imgSrc}>
            <div class={styles.richPresence}>
              <img src={imgSrc()} class={styles.activityImg + " activityImage"} classList={{[styles.videoActivityImg!]: isVideo()}} />
              <div class={styles.richInfo}>
                <Text href={activity()?.link} isDangerousLink newTab size={13} opacity={0.9}>{activity()?.title}</Text>
                <Text size={13} opacity={0.6}>{activity()?.subtitle}</Text>
                <Show when={!isMusic() && !isVideo()}><Text size={13} opacity={0.6}>{playedFor()}</Text></Show>
                <Show when={isMusic() || isVideo()}><RichProgressBar primaryColor={props.primaryColor} startedAt={activity()?.startedAt!} endsAt={activity()?.endsAt!} /></Show>
              </div>
            </div>
          </Show>
          <Show when={!activity()?.imgSrc}><Text size={13}>For {playedFor()}</Text></Show>
        </div>    
      </div>
    </Show>
  );

};


