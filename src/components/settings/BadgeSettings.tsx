import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { css, styled } from "solid-styled-components";

import useStore from "@/chat-api/store/useStore";

import Breadcrumb, { BreadcrumbItem } from "../ui/Breadcrumb";
import { t } from "@nerimity/i18lite";

import {
  Bitwise,
  hasBit,
  USER_BADGES,
  USER_BADGES_VALUES,
  UserBadge
} from "@/chat-api/Bitwise";

import SettingsBlock, {
  SettingsGroup
} from "../ui/settings-block/SettingsBlock";
import { SelfUser } from "@/chat-api/events/connectionEventTypes";
import Avatar from "../ui/Avatar";
import { Notice } from "../ui/Notice/Notice";

import Icon from "../ui/icon/Icon";
import Block from "../ui/settings-block/Block";
import { RawInventoryItem } from "@/chat-api/RawData";
import { fetchInventory, toggleBadge } from "@/chat-api/services/UserService";
import { formatters } from "@/common/date";
import Checkbox from "../ui/Checkbox";
import { toast } from "../ui/custom-portal/CustomPortal";

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
      iconName: "settings"
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
    USER_BADGES.FOX_EARS_BROWN
  ];

  const palestineDescription = () => {
    const account = t("settings.drawer.account");
    const profile = t("settings.drawer.profile");
    return t("settings.badges.palestineDescription", {
      account,
      profile
    });
  };

  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbItem href="/app" icon="home" title={t("dashboard.title")} />
        <BreadcrumbItem title={t("settings.drawer.badges")} />
      </Breadcrumb>

      <OwnedBadges />

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
            description: palestineDescription
          }
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
      <SettingsGroup>
        <SettingsBlock
          label={t("settings.badges.price", { price: `$${props.price}` })}
          icon="favorite"
        />
        <Block
          class={css`
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(164px, 1fr));
            gap: 6px;
            justify-items: center;
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
        </Block>
      </SettingsGroup>
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
    background: var(--background-color);
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
          color: props.badge.textColor || "rgba(0, 0, 0, 0.7)"
        }}
        class="badge-name"
      >
        <Show when={props.badge.icon}>
          <Icon
            name={props.badge.icon!}
            size={14}
            color={props.badge.textColor || "rgba(0, 0, 0, 0.7)"}
            style={{ "margin-right": "4px", "vertical-align": "middle" }}
          />
        </Show>
        {props.badge.name()}
      </div>
      <div class="badge-desc">{props.badge.description?.()}</div>
    </div>
  );
};

const SupportMethodBlock = () => {
  return (
    <SettingsGroup>
      <SettingsBlock label={t("settings.badges.supportMethods")} icon="info" />
      <SettingsBlock
        label="Ko-Fi"
        iconSrc="/assets/kofi.svg"
        href="https://ko-fi.com/supertiger"
        hrefBlank
      />
      <SettingsBlock
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
    </SettingsGroup>
  );
};

const OwnedBadges = () => {
  const store = useStore();
  const [inventory, setInventory] = createSignal<RawInventoryItem[]>([]);

  const user = () => store.account.user();

  onMount(() => {
    fetchInventory().then(setInventory);
  });

  const inventoryBadges = () => {
    return inventory().filter((item) => item.itemType === "badge");
  };

  const ownedBadges = () => {
    const badges = inventoryBadges().map((item) => {
      const badge = USER_BADGES_VALUES.find(
        (badge) => badge.bit === parseInt(item.itemId)
      )!;
      return {
        ...badge,
        acquiredAt: item.acquiredAt,
        enabled: hasBit(user()?.badges || 0, badge!.bit)
      };
    });
    const hasPalestine = badges.find((badge) => badge.name() === "Palestine");
    if (!hasPalestine) {
      badges.unshift({
        ...USER_BADGES.PALESTINE,
        acquiredAt: 0,
        enabled: hasBit(user()?.badges || 0, USER_BADGES.PALESTINE.bit)
      });
    }
    return badges;
  };

  const handleBadgeToggle = (badge: { bit: number; removable?: boolean }) => {
    if (badge.removable === false) {
      return toast(
        t("settings.badges.unremovableError.title"),
        t("settings.badges.unremovableError.body"),
        "error"
      );
    }
    toggleBadge(badge.bit).then((result) => {
      store.account.setUser({ badges: result.badges });
    });
  };

  return (
    <div>
      <Notice
        type="info"
        description={t("settings.badges.acquisitionNotice")}
        style={{ "margin-bottom": "12px" }}
      />
      <SettingsGroup>
        <SettingsBlock
          label={t("settings.badges.inventory.ownedBadges", { count: ownedBadges().length })}
          icon="badge"
        />

        <For each={ownedBadges()}>
          {(item) => (
            <SettingsBlock
              onClick={() => handleBadgeToggle(item)}
              label={item!.name?.()!}
              description={
                item!.acquiredAt
                  ? t("settings.badges.inventory.acquireDate", { date: formatters().datetime.mediumDate.format(item!.acquiredAt) })
                  : undefined
              }
              icon={
                <Avatar user={{ ...user()!, badges: item!.bit }} size={40} />
              }
            >
              <Checkbox
                style={{ "pointer-events": "none" }}
                checked={item!.enabled}
                disabled={!item!.removable}
              />
            </SettingsBlock>
          )}
        </For>
      </SettingsGroup>
    </div>
  );
};
