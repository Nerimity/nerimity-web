import { avatarUrl } from "@/chat-api/store/useUsers";
import { classNames, cn } from "@/common/classNames";
import { useWindowProperties } from "@/common/useWindowProperties";
import { createMemo, JSXElement, Match, Show, Switch } from "solid-js";
import {
  hasBit,
  USER_BADGES,
  USER_BADGES_VALUES,
  UserBadge,
} from "@/chat-api/Bitwise";
import style from "./Avatar.module.css";
import { FounderAdminSupporterBorder } from "../avatar-borders/FounderAdminSupporterBorder";
import { CatEarsBorder } from "../avatar-borders/CatEarBorder";
import { FoxEarsBorder } from "../avatar-borders/FoxEarBorder";
import env from "@/common/env";

interface Props {
  url?: string | null;
  size: number;
  class?: string;
  animate?: boolean;
  user?: {
    avatar?: string;
    hexColor: string;
    badges?: number;
    avatarUrl?: string | (() => string | null | undefined) | null;
  };
  server?: { avatar?: string; hexColor: string; verified: boolean };
  voiceIndicator?: boolean;
  children?: JSXElement;
  showBorder?: boolean;
  resize?: number;
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
    if (typeof props.user?.avatarUrl === "string") return webhookAvatarUrl();
    const rawUrl = props.url || avatarUrl(serverOrUser());
    if (!rawUrl) return;
    const url = new URL(rawUrl);

    if (props.resize) {
      url.searchParams.set("size", props.resize.toString());
    }

    if (!rawUrl?.endsWith(".gif")) return url.href;

    if (!hasFocus() || !props.animate) {
      url.searchParams.set("type", "webp");
    }

    return url.href;
  };

  // used for webhook override
  const webhookAvatarUrl = () => {
    if (!props.user?.avatarUrl) return null;

    try {
      const baseUrl = new URL(props.user.avatarUrl);
      const ext = baseUrl.pathname.split(".").pop();

      const proxyUrl = new URL(
        `${env.NERIMITY_CDN}proxy/${encodeURIComponent(
          baseUrl.href
        )}/avatar.${ext}`
      );

      proxyUrl.searchParams.set("size", props.resize?.toString() || "500");

      if (!proxyUrl.pathname.endsWith(".gif")) return proxyUrl.href;

      if (!hasFocus() || !props.animate) {
        proxyUrl.searchParams.set("type", "webp");
      }

      return proxyUrl.href;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const badge = createMemo(() => {
    const badges = serverOrUser()?.badges;
    if (!badges) return;
    return badgesArr.find((b) => !b.overlay && hasBit(badges, b.bit));
  });

  return (
    <div
      style={{ width: props.size + "px", height: props.size + "px" }}
      class={classNames(style.avatarContainer, "avatar-container", props.class)}
    >
      <Switch
        fallback={
          <NoBorder
            size={props.size}
            children={props.children}
            color={serverOrUser()?.hexColor}
            serverOrUser={serverOrUser()}
            url={url() || undefined}
            badges={props.user?.badges}
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
            badges={props.user?.badges}
          />
        </Match>

        <Match when={props.server?.verified || badge()}>
          <AvatarBorder
            size={props.size}
            hovered={props.animate || props.showBorder}
            serverOrUser={serverOrUser()}
            url={url() || undefined}
            color={serverOrUser()?.hexColor}
            children={props.children}
            badge={badge()}
            badges={props.user?.badges}
          />
        </Match>
      </Switch>
    </div>
  );
}

const badgesArr = USER_BADGES_VALUES;

function AvatarBorder(props: {
  size: number;
  hovered?: boolean;
  serverOrUser: ServerOrUser;
  url?: string;
  color?: string;
  children?: JSXElement;
  badge?: UserBadge;
  badges?: number;
  voiceIndicator?: boolean;
}) {
  return (
    <>
      <Switch>
        <Match when={props.badge?.bit === USER_BADGES.MOD.bit}>
          <ModBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
          />
        </Match>

        <Match when={props.badge?.bit === USER_BADGES.EMO_SUPPORTER.bit}>
          <EmoSupporterBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.SUPPORTER.bit}>
          <SupporterBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.ADMIN.bit}>
          <AdminBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.FOUNDER.bit}>
          <FounderBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.PALESTINE.bit}>
          <PalestineBorder
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            badges={props.badges}
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
  badges?: number;
}) => {
  return (
    <div class={style.imageContainer}>
      <Overlays size={props.size} offset={-0.12} badges={props.badges} />
      <Switch>
        <Match when={props.children}>{props.children}</Match>

        <Match when={!props.children}>
          <Show when={!props.url}>
            <div
              class={style.avatarBackground}
              style={{ background: props.serverOrUser?.hexColor }}
            />
          </Show>

          <img
            class={style.image}
            loading="lazy"
            src={props.url || "/assets/profile.png"}
            alt="User Avatar"
          />
        </Match>
      </Switch>
    </div>
  );
};

function BasicBorder(props: {
  size: number;
  hovered?: boolean;
  color: string;
  label?: string;
  url?: string;
  serverOrUser?: ServerOrUser;
  children?: JSXElement;
  hideBorder?: boolean;
  badges?: number;
}) {
  const inset = "-" + (props.size / 100) * 5 + "px";
  return (
    <>
      <NoBorder {...props} />
      <Show when={!props.hideBorder}>
        <div
          class={cn(style.basicBorderContainer, "basic-border")}
          style={{
            border: `solid ${(props.size / 100) * 8}px ${props.color}`,
            left: inset,
            top: inset,
            right: inset,
            bottom: inset,
          }}
        >
          <Show when={props.label && props.hovered}>
            <div
              class={style.basicBorderLabel}
              style={{
                "font-size": (props.size / 100) * 17 + "px",
                "border-radius": (props.size / 100) * 8 + "px",
                bottom: -((props.size / 100) * 15) + "px",
                padding: (props.size / 100) * 5 + "px",
                background: props.color,
              }}
            >
              {props.label}
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
}

function ModBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
  badges?: number;
}) {
  return (
    <FounderAdminSupporterBorder
      type="mod"
      children={props.children}
      overlay={
        <Overlays size={props.size} offset={-0.68} badges={props.badges} />
      }
      color={props.color}
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}
function EmoSupporterBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
  badges?: number;
}) {
  return (
    <FounderAdminSupporterBorder
      type="emo-supporter"
      children={props.children}
      color={props.color}
      overlay={
        <Overlays size={props.size} offset={-0.68} badges={props.badges} />
      }
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}
function SupporterBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
  badges?: number;
}) {
  return (
    <FounderAdminSupporterBorder
      type="supporter"
      children={props.children}
      overlay={
        <Overlays size={props.size} offset={-0.68} badges={props.badges} />
      }
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
  badges?: number;
  children?: JSXElement;
}) {
  return (
    <FounderAdminSupporterBorder
      type="admin"
      children={props.children}
      color={props.color}
      overlay={
        <Overlays size={props.size} offset={-0.68} badges={props.badges} />
      }
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}

function FounderBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  badges?: number;
  children?: JSXElement;
}) {
  return (
    <FounderAdminSupporterBorder
      type="founder"
      children={props.children}
      color={props.color}
      overlay={
        <Overlays size={props.size} offset={-0.68} badges={props.badges} />
      }
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}
function PalestineBorder(props: {
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
  badges?: number;
}) {
  return (
    <FounderAdminSupporterBorder
      type="palestine"
      children={props.children}
      overlay={
        <Overlays size={props.size} offset={-0.68} badges={props.badges} />
      }
      color={props.color}
      url={props.avatarUrl}
      hovered={props.hovered}
    />
  );
}

function Overlays(props: { badges?: number; offset?: number; size: number }) {
  return (
    <Show when={props.badges}>
      <Switch>
        <Match when={hasBit(props.badges!, USER_BADGES.FOX_EARS_BROWN.bit)}>
          <FoxEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.2}
            color="brown"
          />
        </Match>

        <Match when={hasBit(props.badges!, USER_BADGES.FOX_EARS_GOLD.bit)}>
          <FoxEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.2}
            color="gold"
          />
        </Match>

        <Match when={hasBit(props.badges!, USER_BADGES.CAT_EARS_BLUE.bit)}>
          <CatEarsBorder size={props.size} offset={props.offset} color="blue" />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.CAT_EARS_WHITE.bit)}>
          <CatEarsBorder
            size={props.size}
            offset={props.offset}
            color="white"
          />
        </Match>
      </Switch>
    </Show>
  );
}
