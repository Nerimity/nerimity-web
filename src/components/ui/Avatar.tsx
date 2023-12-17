import { avatarUrl } from "@/chat-api/store/useUsers";
import { classNames } from "@/common/classNames";
import { useWindowProperties } from "@/common/useWindowProperties";
import { read } from "fs";
import { createMemo, JSX, JSXElement, Match, Show, Switch } from "solid-js";
import { keyframes, styled } from "solid-styled-components";
import Text from "./Text";
import { hasBit, USER_BADGES } from "@/chat-api/Bitwise";
import styles from "./AvatarStyles.module.scss";
import { SupporterBorderSvg } from "../avatar-borders/SupporterBorderSvg";
import { AdminBorderSvg } from "../avatar-borders/AdminBorderSvg";
import { FounderBorderSvg } from "../avatar-borders/FounderBorderSvg";

interface Props {
  url?: string | null;
  size: number;
  class?: string;
  animate?: boolean;
  user?: { avatar?: string; hexColor: string; badges?: number };
  server?: { avatar?: string; hexColor: string; verified: boolean };
  voiceIndicator?: boolean;
  children?: JSXElement;
  showBorder?: boolean;
}

interface ServerOrUser {
  avatar: string;
  hexColor: string;
  badges?: number;
  verified?: boolean;
}

export default function Avatar(props: Props) {
  const { hasFocus } = useWindowProperties();

  const serverOrUser = () => (props.server || props.user) as ServerOrUser;

  const url = () => {
    let url = props.url;
    if (!url) {
      url = avatarUrl(serverOrUser());
    }

    if (!url?.endsWith(".gif")) return url;
    if (!hasFocus()) return url + "?type=webp";
    if (props.animate) return url;
    return url + "?type=webp";
  };

  const badge = createMemo(() => {
    const badges = serverOrUser().badges;
    if (!badges) return;
    return badgesArr.find((b) => hasBit(badges, b.bit));
  });

  return (
    <div
      style={{ width: props.size + "px", height: props.size + "px" }}
      class={classNames(
        styles.avatarContainer,
        "avatar-container",
        props.class
      )}
    >
      <Switch
        fallback={
          <NoBorder
            size={props.size}
            children={props.children}
            color={serverOrUser()?.hexColor}
            serverOrUser={serverOrUser()}
            url={url() || undefined}
          />
        }
      >
        <Match when={props.voiceIndicator}>
          <BasicBorder
            color="var(--success-color)"
            size={props.size}
            url={url() || undefined}
            hovered={props.animate}
            hideBorder={!props.animate}
            serverOrUser={serverOrUser()}
          />
        </Match>

        <Match when={props.server?.verified || props.user?.badges}>
          <AvatarBorder
            size={props.size}
            hovered={props.animate || props.showBorder}
            serverOrUser={serverOrUser()}
            url={url() || undefined}
            color={serverOrUser()?.hexColor}
            children={props.children}
            badge={badge()}
          />
        </Match>
      </Switch>
    </div>
  );
}

const badgesArr = Object.values(USER_BADGES);

function AvatarBorder(props: {
  size: number;
  hovered?: boolean;
  serverOrUser: ServerOrUser;
  url?: string;
  color?: string;
  children?: JSXElement;
  badge?: (typeof USER_BADGES)[keyof typeof USER_BADGES];
  voiceIndicator?: boolean;
}) {
  return (
    <>
      <Switch>
        <Match when={props.badge?.bit === USER_BADGES.SUPPORTER.bit}>
          <SupporterBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            children={props.children}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.ADMIN.bit}>
          <AdminBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            children={props.children}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.FOUNDER.bit}>
          <FounderBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            children={props.children}
          />
        </Match>
        <Match when={props.badge || props.serverOrUser?.verified}>
          <BasicBorder
            size={props.size}
            color={
              props.serverOrUser?.verified
                ? "var(--primary-color)"
                : props.badge!.color
            }
            label={
              props.serverOrUser?.verified ? "Verified" : props.badge!.name
            }
            hovered={props.hovered}
            serverOrUser={props.serverOrUser}
            url={props.url}
            children={props.children}
          />
        </Match>
      </Switch>
    </>
  );
}

const NoBorder = (props: {
  size: number;
  url?: string;
  serverOrUser?: ServerOrUser;
  color?: string;
  children?: JSXElement;
}) => {
  return (
    <div class={styles.imageContainer}>
      <Switch>
        <Match when={props.children}>{props.children}</Match>

        <Match when={!props.children}>
          <Show when={!props.url}>
            <div
              class={styles.avatarBackground}
              style={{ background: props.serverOrUser?.hexColor }}
            />
          </Show>

          <img
            class={styles.image}
            loading="lazy"
            src={props.url || "/assets/profile.png"}
            alt="User Avatar"
          />
        </Match>
      </Switch>
    </div>
  );
};

const BasicAvatarBorderContainer = styled("div")<{
  size: number;
  color: string;
}>`
  position: absolute;
  inset: 0;

  display: flex;
  justify-content: center;
  border-radius: 50%;

  border: solid ${(props) => (props.size / 100) * 8}px ${(props) => props.color};

  left: -${(props) => (props.size / 100) * 5}px;
  top: -${(props) => (props.size / 100) * 5}px;
  right: -${(props) => (props.size / 100) * 5}px;
  bottom: -${(props) => (props.size / 100) * 5}px;

  z-index: 1;
`;

const rotate = keyframes`
  0% { 
    opacity: 0;
    transform: translateY(10px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const BasicBorderLabelContainer = styled("div")`
  pointer-events: none;
  font-weight: bold;
  position: absolute;
  color: rgba(0, 0, 0, 0.7);

  animation: ${rotate} 0.2s ease-out forwards;
`;

function BasicBorder(props: {
  size: number;
  hovered?: boolean;
  color: string;
  label?: string;
  url?: string;
  serverOrUser?: ServerOrUser;
  children?: JSXElement;
  hideBorder?: boolean;
}) {
  return (
    <>
      <NoBorder {...props} />
      <Show when={!props.hideBorder}>
        <BasicAvatarBorderContainer
          class="basic-border"
          color={props.color}
          size={props.size}
        >
          <Show when={props.label && props.hovered}>
            <BasicBorderLabelContainer
              style={{
                "font-size": (props.size / 100) * 17 + "px",
                "border-radius": (props.size / 100) * 8 + "px",
                bottom: -((props.size / 100) * 15) + "px",
                padding: (props.size / 100) * 5 + "px",
                background: props.color,
              }}
            >
              {props.label}
            </BasicBorderLabelContainer>
          </Show>
        </BasicAvatarBorderContainer>
      </Show>
    </>
  );
}

function SupporterBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
}) {
  return (
    <SupporterBorderSvg
      children={props.children}
      color={props.color}
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}

function AdminBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
}) {
  return (
    <AdminBorderSvg
      children={props.children}
      color={props.color}
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}


function  FounderBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
}) {
  return (
    <FounderBorderSvg
      children={props.children}
      color={props.color}
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}
