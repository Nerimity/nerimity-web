import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { css, styled } from "solid-styled-components";

import { FlexColumn, FlexRow } from "../ui/Flexbox";
import useStore from "@/chat-api/store/useStore";

import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";
import { electronWindowAPI } from "@/common/Electron";
import { addBit, Bitwise, USER_BADGES, UserBadge } from "@/chat-api/Bitwise";
import { RawUser } from "@/chat-api/RawData";
import SettingsBlock from "../ui/settings-block/SettingsBlock";
import { SelfUser } from "@/chat-api/events/connectionEventTypes";
import Avatar from "../ui/Avatar";
import { Notice } from "../ui/Notice/Notice";
import { cn } from "@/common/classNames";

const Container = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  flex-shrink: 0;
`;

export default function BadgeSettings() {
  const { header } = useStore();

  createEffect(() => {
    header.updateHeader({
      title: t("settings.drawer.title") + " - " + t("settings.drawer.badges"),
      iconName: "settings",
    });
  });

  const availableBadges = [
    USER_BADGES.DEER_EARS_WHITE,
    USER_BADGES.DEER_EARS_HORNS_DARK,
    USER_BADGES.DEER_EARS_HORNS,
    USER_BADGES.GOAT_HORNS,
    USER_BADGES.GOAT_EARS_WHITE,
    USER_BADGES.WOLF_EARS,
    USER_BADGES.DOG_SHIBA,
    USER_BADGES.DOG_EARS_BROWN,
    USER_BADGES.BUNNY_EARS_MAID,
    USER_BADGES.BUNNY_EARS_BLACK,
    USER_BADGES.CAT_EARS_PURPLE,
    USER_BADGES.CAT_EARS_BLUE,
    USER_BADGES.CAT_EARS_WHITE,
    USER_BADGES.CAT_EARS_MAID,
    USER_BADGES.FOX_EARS_GOLD,
    USER_BADGES.FOX_EARS_BROWN,
  ];

  const palestineDescription = () => {
    const account = t("settings.drawer.account");
    const profile = t("settings.drawer.profile");
    return t("settings.badges.palestineDescription", {
      account,
      profile,
    });
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.badges")} />
      </Breadcrumb>

      <Notice
        description={t("settings.badges.notice")}
        type="error"
        title={t("settings.badges.noticeTitle")}
        icon="favorite"
      />
      <SupportMethodBlock />
      <BadgesPreview badges={[USER_BADGES.SUPPORTER]} price={9.99} />
      <BadgesPreview badges={availableBadges} price={4.99} />
      <BadgesPreview
        badges={[
          {
            ...USER_BADGES.PALESTINE,
            description: palestineDescription,
          },
        ]}
        price={0}
      />
    </Container>
  );
}

const BadgesPreview = (props: { badges: Bitwise[]; price: number }) => {
  const store = useStore();
  const user = () => store.account.user();

  return (
    <Show when={user()}>
      <div>
        <SettingsBlock
          header
          label={t("settings.badges.price", { price: `$${props.price}` })}
          icon="favorite"
        />
        <div
          class={css`
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(164px, 1fr));
            gap: 6px;
            background: rgba(255, 255, 255, 0.05);
            justify-items: center;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            padding: 6px;
          `}
        >
          <For each={props.badges}>
            {(badge, i) => (
              <BadgeItem
                user={user()!}
                badge={badge}
                index={i()}
                length={props.badges.length}
              />
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

const badgeItemStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 20px;
  padding-top: 20px;
  gap: 8px;
  position: relative;
  box-sizing: border-box;
  z-index: 1;
  &:before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--background-color);
    opacity: 0.2;
    z-index: -1;
    border-radius: 8px;
    pointer-events: none;
  }
  .badge-desc {
    font-size: 12px;
    opacity: 0.6;
    text-align: center;
  }
`;
const BadgeItem = (props: {
  user: SelfUser;
  badge: UserBadge;
  index: number;
  length: number;
}) => {
  const [hovered, setHovered] = createSignal(false);
  return (
    <div
      class={badgeItemStyle}
      onMouseOver={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar
        user={{ ...props.user, badges: props.badge.bit }}
        size={52}
        animate={hovered()}
      />
      <div
        style={{
          "border-radius": "4px",
          padding: "3px",
          "font-weight": "bold",
          "font-size": "12px",
          background: props.badge.color,
          color: props.badge.textColor || "rgba(0, 0, 0, 0.7)",
        }}
        class="badge-name"
      >
        {props.badge.name()}
      </div>
      <div class="badge-desc">{props.badge.description?.()}</div>
    </div>
  );
};

const SupportMethodBlock = () => {
  return (
    <div>
      <SettingsBlock
        label={t("settings.badges.supportMethods")}
        icon="info"
        header
      />
      <SettingsBlock
        label="Ko-Fi"
        borderBottomRadius={false}
        borderTopRadius={false}
        iconSrc="/assets/kofi.png"
        href="https://ko-fi.com/supertiger"
        hrefBlank
      />
      <SettingsBlock
        borderTopRadius={false}
        class={css`
          img {
            border-radius: 50%;
          }
        `}
        label="Boosty"
        iconSrc="/assets/boosty.jpg"
        href="https://boosty.to/supertigerdev/donate"
        hrefBlank
      />
    </div>
  );
};
