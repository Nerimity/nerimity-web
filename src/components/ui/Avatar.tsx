import { avatarUrl } from "@/chat-api/store/useUsers";
import { classNames, cn } from "@/common/classNames";
import { useWindowProperties } from "@/common/useWindowProperties";
import {
  createEffect,
  createMemo,
  JSXElement,
  Match,
  Show,
  splitProps,
  Switch,
} from "solid-js";
import {
  hasBit,
  USER_BADGES,
  USER_BADGES_VALUES,
  UserBadge,
} from "@/chat-api/Bitwise";
import style from "./Avatar.module.css";
import { CatEarsBorder } from "../avatar-borders/CatEarBorder";
import { FoxEarsBorder } from "../avatar-borders/FoxEarBorder";
import env from "@/common/env";
import { BunnyEarsBorder } from "../avatar-borders/BunnyEarBorder";
import { DogEarsBorder } from "../avatar-borders/DogEarBorder";
import { FounderAdminSupporterBorder } from "../avatar-borders/FounderAdminSupporterBorder";
import { DogTailBorder } from "../avatar-borders/DogTailBorder";
import { WolfEarsBorder } from "../avatar-borders/WolfEarBorder";
import { GoatEarsBorder } from "../avatar-borders/GoatEarBorder";
import { DeerEarsBorder } from "../avatar-borders/DeerEarBorder";

interface Props {
  url?: string | null;
  size: number;
  class?: string;
  animate?: boolean;
  user?: {
    username: string;
    avatar?: string;
    hexColor: string;
    badges?: number;
    avatarUrl?: string | (() => string | null | undefined) | null;
  };
  server?: {
    name: string;
    avatar?: string;
    hexColor: string;
    verified: boolean;
  };
  voiceIndicator?: boolean;
  children?: JSXElement;
  showBorder?: boolean;
  resize?: number;
}

export interface ServerOrUserAvatar {
  avatar: string;
  hexColor: string;
  badges?: number;
  verified?: boolean;
  username?: string;
  name?: string;
}

function getFirstLetters(str: string) {
  if (!str) return "";

  const matches = str.split(" ");

  return matches.map((match) => match[0]?.toUpperCase()).join("");
}

export default function Avatar(props: Props) {
  const { hasFocus } = useWindowProperties();

  const serverOrUser = () => (props.server || props.user) as ServerOrUserAvatar;

  const url = () => {
    if (typeof props.user?.avatarUrl === "string") return webhookAvatarUrl();
    const rawUrl = props.url || avatarUrl(serverOrUser());
    if (!rawUrl) return;
    const url = new URL(rawUrl);

    if (props.resize) {
      url.searchParams.set("size", props.resize.toString());
    }

    if (!rawUrl?.endsWith(".gif") && !rawUrl.endsWith("#a")) return url.href;

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
          baseUrl.href,
        )}/avatar.${ext}`,
      );

      proxyUrl.searchParams.set("size", props.resize?.toString() || "500");

      if (
        !proxyUrl.pathname.endsWith(".gif") &&
        !proxyUrl.pathname.endsWith("#a")
      )
        return proxyUrl.href;

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
  serverOrUser: ServerOrUserAvatar;
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
          <UniversalBorder
            type="mod"
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
            serverOrUser={props.serverOrUser}
          />
        </Match>

        <Match when={props.badge?.bit === USER_BADGES.EMO_SUPPORTER.bit}>
          <UniversalBorder
            type="emo-supporter"
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
            serverOrUser={props.serverOrUser}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.SUPPORTER.bit}>
          <UniversalBorder
            type="supporter"
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
            serverOrUser={props.serverOrUser}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.ADMIN.bit}>
          <UniversalBorder
            type="admin"
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
            serverOrUser={props.serverOrUser}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.FOUNDER.bit}>
          <UniversalBorder
            type="founder"
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            color={props.color}
            badges={props.badges}
            children={props.children}
            serverOrUser={props.serverOrUser}
          />
        </Match>
        <Match when={props.badge?.bit === USER_BADGES.PALESTINE.bit}>
          <UniversalBorder
            type="palestine"
            size={props.size}
            avatarUrl={props.url}
            hovered={props.hovered}
            badges={props.badges}
            color={props.color}
            children={props.children}
            serverOrUser={props.serverOrUser}
          />
        </Match>
        <Match when={props.badge || props.serverOrUser?.verified}>
          <BasicBorder
            badges={props.badges}
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

export const FirstLetterAvatar = (props: {
  size: number;
  serverOrUser?: ServerOrUserAvatar;
}) => {
  const name = () => props.serverOrUser?.username || props.serverOrUser?.name;
  const firstLetters = () =>
    name() ? getFirstLetters(name()!).slice(0, 10) : "";
  const size = () =>
    (props.size / 100) *
      (firstLetters().length === 1
        ? 50
        : firstLetters().length === 2
          ? 40
          : 30) +
    "px";
  return (
    <div style={{ "font-size": size() }} class={style.avatarText}>
      {firstLetters()}
    </div>
  );
};

const NoBorder = (props: {
  size: number;
  url?: string;
  serverOrUser?: ServerOrUserAvatar;
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

          <Show when={props.url} fallback={<FirstLetterAvatar {...props} />}>
            <img
              class={style.image}
              loading="lazy"
              src={props.url}
              alt="User Avatar"
            />
          </Show>
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
  serverOrUser?: ServerOrUserAvatar;
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

type BorderType =
  | "mod"
  | "emo-supporter"
  | "supporter"
  | "admin"
  | "founder"
  | "palestine";

interface UniversalBorderProps {
  type: BorderType;
  size: number;
  avatarUrl?: string;
  hovered?: boolean;
  color?: string;
  children?: JSXElement;
  badges?: number;
  serverOrUser: ServerOrUserAvatar;
}

function UniversalBorder(props: UniversalBorderProps) {
  const [local, rest] = splitProps(props, [
    "type",
    "size",
    "badges",
    "avatarUrl",
  ]);

  return (
    <FounderAdminSupporterBorder
      type={local.type}
      size={local.size}
      url={local.avatarUrl}
      overlay={
        <Overlays
          size={local.size}
          offset={-0.78}
          badges={local.badges}
          hasBorder
        />
      }
      {...rest}
    />
  );
}

function Overlays(props: {
  badges?: number;
  offset?: number;
  hasBorder?: boolean;
  size: number;
}) {
  return (
    <Show when={props.badges}>
      <Switch>
        <Match when={hasBit(props.badges!, USER_BADGES.DEER_EARS_WHITE.bit)}>
          <DeerEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.5}
            color="white"
            scale={1.1}
          />
        </Match>
        <Match
          when={hasBit(props.badges!, USER_BADGES.DEER_EARS_HORNS_DARK.bit)}
        >
          <DeerEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.5}
            color="horns-dark"
            scale={1.1}
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.DEER_EARS_HORNS.bit)}>
          <DeerEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.5}
            color="horns"
            scale={1.1}
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.GOAT_HORNS.bit)}>
          <GoatEarsBorder
            size={props.size}
            offset={(props.offset || 0) + 0.1}
            color="horns"
            scale={1.4}
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.GOAT_EARS_WHITE.bit)}>
          <GoatEarsBorder
            size={props.size}
            offset={(props.offset || 0) + 0.1}
            color="ears-white"
            scale={1.4}
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.WOLF_EARS.bit)}>
          <WolfEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.2}
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.DOG_SHIBA.bit)}>
          <DogEarsBorder
            size={props.size}
            scale={1.2}
            offset={(props.offset || 0) - 0.03}
            color="shiba"
          />
          <DogTailBorder
            offset={(props.offset || 0) + (props.hasBorder ? 1 : 0.27)}
            size={props.size}
            color="shiba"
            offsetLeft={props.hasBorder ? -1.4 : -0.72}
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.DOG_EARS_BROWN.bit)}>
          <DogEarsBorder
            size={props.size}
            offset={(props.offset || 0) + (props.hasBorder ? 0.4 : 0.1)}
            color="brown"
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.BUNNY_EARS_MAID.bit)}>
          <BunnyEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.4}
            color="maid"
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.BUNNY_EARS_BLACK.bit)}>
          <BunnyEarsBorder
            size={props.size}
            offset={(props.offset || 0) - 0.5}
            color="black"
          />
        </Match>
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

        <Match when={hasBit(props.badges!, USER_BADGES.CAT_EARS_MAID.bit)}>
          <CatEarsBorder
            size={props.size}
            offset={(props.offset || 0) + (props.hasBorder ? -0.1 : -0.1)}
            color="maid"
          />
        </Match>
        <Match when={hasBit(props.badges!, USER_BADGES.CAT_EARS_PURPLE.bit)}>
          <CatEarsBorder
            size={props.size}
            offset={props.offset}
            color="purple"
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
